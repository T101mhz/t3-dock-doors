import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DockDoor } from "@/components/DockDoor";
import { AssignmentModal } from "@/components/AssignmentModal";
import { UserNamePrompt } from "@/components/UserNamePrompt";
import { HistoryExport } from "@/components/HistoryExport";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { LogOut } from "lucide-react";
import type { Session } from "@supabase/supabase-js";

interface DockDoorData {
  id: string;
  door_number: number;
  status: "AVAILABLE" | "ASSIGNED";
  type: "INBOUND" | "OUTBOUND" | null;
  assigned_by: string | null;
  assigned_by_id: string | null;
  trailer_number: string | null;
  timestamp: string | null;
}

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [session, setSession] = useState<Session | null>(null);
  const [doors, setDoors] = useState<Record<number, DockDoorData>>({});
  const [userName, setUserName] = useState<string | null>(null);
  const [assignmentDoor, setAssignmentDoor] = useState<{
    doorNumber: number;
    type: "INBOUND" | "OUTBOUND";
  } | null>(null);

  // Check authentication and get user name
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setSession(session);
        const storedName = localStorage.getItem("dockUserName");
        setUserName(storedName);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setSession(session);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Fetch initial door data and subscribe to real-time updates
  useEffect(() => {
    if (!session) return;

    const fetchDoors = async () => {
      const { data, error } = await supabase
        .from("dock_doors")
        .select("*")
        .order("door_number");

      if (error) {
        toast({
          title: "Error",
          description: "Failed to load dock doors",
          variant: "destructive",
        });
        return;
      }

      const doorsMap: Record<number, DockDoorData> = {};
      data?.forEach((door) => {
        doorsMap[door.door_number] = door as DockDoorData;
      });
      setDoors(doorsMap);
    };

    fetchDoors();

    // Subscribe to real-time updates
    const channel = supabase
      .channel("dock_doors_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "dock_doors",
        },
        (payload) => {
          if (payload.eventType === "UPDATE" || payload.eventType === "INSERT") {
            const newDoor = payload.new as DockDoorData;
            setDoors((prev) => ({
              ...prev,
              [newDoor.door_number]: newDoor,
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session, toast]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleStartAssignment = (doorNumber: number, type: "INBOUND" | "OUTBOUND") => {
    setAssignmentDoor({ doorNumber, type });
  };

  const handleAssignmentSubmit = async (trailerNumber: string) => {
    if (!assignmentDoor || !session || !userName) return;

    const { doorNumber, type } = assignmentDoor;
    const door = doors[doorNumber];

    if (door && door.status === "ASSIGNED" && door.assigned_by_id !== session.user.id) {
      toast({
        title: "Door Unavailable",
        description: `Door ${doorNumber} is already assigned by ${door.assigned_by}`,
        variant: "destructive",
      });
      setAssignmentDoor(null);
      return;
    }

    try {
      const timestamp = new Date().toISOString();

      // Update door status
      const { error: updateError } = await supabase
        .from("dock_doors")
        .update({
          status: "ASSIGNED",
          type,
          assigned_by: userName,
          assigned_by_id: session.user.id,
          trailer_number: trailerNumber,
          timestamp,
        })
        .eq("door_number", doorNumber);

      if (updateError) throw updateError;

      // Log to history
      const { error: historyError } = await supabase.from("dock_history").insert({
        door_number: doorNumber,
        trailer_number: trailerNumber,
        action: "ASSIGNED",
        type,
        event_timestamp: timestamp,
        assigned_by: userName,
        assigned_by_id: session.user.id,
      });

      if (historyError) throw historyError;

      toast({
        title: "Door Assigned",
        description: `Door ${doorNumber} assigned successfully`,
      });

      setAssignmentDoor(null);
    } catch (error: any) {
      toast({
        title: "Assignment Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleClear = async (doorNumber: number) => {
    if (!session || !userName) return;

    const door = doors[doorNumber];

    if (!door || (door.status === "ASSIGNED" && door.assigned_by_id !== session.user.id)) {
      toast({
        title: "Cannot Clear",
        description: `Door ${doorNumber} is assigned by ${door?.assigned_by}`,
        variant: "destructive",
      });
      return;
    }

    try {
      const clearTimestamp = new Date().toISOString();

      // Log clearance to history if door was assigned
      if (door.status === "ASSIGNED") {
        const { error: historyError } = await supabase.from("dock_history").insert({
          door_number: doorNumber,
          trailer_number: door.trailer_number,
          action: "CLEARED",
          type: door.type,
          event_timestamp: clearTimestamp,
          assigned_by: userName,
          assigned_by_id: session.user.id,
          assignment_timestamp: door.timestamp,
        });

        if (historyError) throw historyError;
      }

      // Clear door status
      const { error: updateError } = await supabase
        .from("dock_doors")
        .update({
          status: "AVAILABLE",
          type: null,
          assigned_by: null,
          assigned_by_id: null,
          trailer_number: null,
          timestamp: null,
        })
        .eq("door_number", doorNumber);

      if (updateError) throw updateError;

      toast({
        title: "Door Cleared",
        description: `Door ${doorNumber} cleared successfully`,
      });
    } catch (error: any) {
      toast({
        title: "Clear Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleUserNameSubmit = (name: string) => {
    localStorage.setItem("dockUserName", name);
    setUserName(name);
  };

  const handleChangeName = () => {
    localStorage.removeItem("dockUserName");
    setUserName(null);
  };

  const sortedDoors = useMemo(() => {
    return Object.values(doors).sort((a, b) => a.door_number - b.door_number);
  }, [doors]);

  if (!session || !userName) {
    return userName === null ? <UserNamePrompt onSubmit={handleUserNameSubmit} /> : null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-4 sm:p-8">
        <Card className="mb-8 p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-foreground mb-2">
                Live Warehouse Dock Door Status
              </h1>
              <p className="text-sm text-muted-foreground">
                Hello, <span className="font-semibold text-primary">{userName}</span>!{" "}
                <button onClick={handleChangeName} className="text-primary hover:underline">
                  change name
                </button>
              </p>
            </div>
            <div className="flex items-center gap-3">
              <HistoryExport />
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {sortedDoors.map((door) => (
            <DockDoor
              key={door.door_number}
              door={door}
              userId={session.user.id}
              onStartAssignment={handleStartAssignment}
              onClear={handleClear}
            />
          ))}
        </div>

        <footer className="mt-10 pt-6 border-t border-border text-center text-sm text-muted-foreground">
          Real-time synchronization powered by Lovable Cloud
        </footer>
      </div>

      <AssignmentModal
        doorNumber={assignmentDoor?.doorNumber ?? null}
        type={assignmentDoor?.type ?? null}
        onClose={() => setAssignmentDoor(null)}
        onSubmit={handleAssignmentSubmit}
      />
    </div>
  );
};

export default Index;
