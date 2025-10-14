import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DockDoor } from "@/components/DockDoor";
import { AssignmentModal } from "@/components/AssignmentModal";
import { UserNamePrompt } from "@/components/UserNamePrompt";
import { HistoryExport } from "@/components/HistoryExport";
import { ParkingLotModal } from "@/components/ParkingLotModal";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Truck } from "lucide-react";

interface DockDoorData {
  id: string;
  door_number: number;
  status: "AVAILABLE" | "ASSIGNED";
  type: "INBOUND" | "OUTBOUND" | "RELOAD" | null;
  assigned_by: string | null;
  assigned_by_id: string | null;
  trailer_number: string | null;
  timestamp: string | null;
  reload_pending: boolean | null;
  manual_time_entry: boolean | null;
}

const Index = () => {
  const { toast } = useToast();
  const [doors, setDoors] = useState<Record<number, DockDoorData>>({});
  const [userName, setUserName] = useState<string | null>(null);
  const [assignmentDoor, setAssignmentDoor] = useState<{
    doorNumber: number;
    type: "INBOUND" | "OUTBOUND";
  } | null>(null);
  const [parkingLotOpen, setParkingLotOpen] = useState(false);

  // Get user name from localStorage
  useEffect(() => {
    const storedName = localStorage.getItem("dockUserName");
    setUserName(storedName);
  }, []);

  // Fetch initial door data and subscribe to real-time updates
  useEffect(() => {
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
  }, [toast]);

  const handleStartAssignment = (doorNumber: number, type: "INBOUND" | "OUTBOUND") => {
    setAssignmentDoor({ doorNumber, type });
  };

  const handleAssignmentSubmit = async (trailerNumber: string, isReload: boolean) => {
    if (!assignmentDoor || !userName) return;

    const { doorNumber, type } = assignmentDoor;
    const door = doors[doorNumber];

    if (door && door.status === "ASSIGNED" && door.assigned_by !== userName) {
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
          assigned_by_id: null,
          trailer_number: trailerNumber,
          timestamp,
          reload_pending: isReload,
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
        assigned_by_id: null,
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
    if (!userName) return;

    const door = doors[doorNumber];

    if (!door) {
      toast({
        title: "Cannot Clear",
        description: `Door ${doorNumber} not found`,
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
          assigned_by_id: null,
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
          reload_pending: false,
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

  const handleManualTimeEntry = async (doorNumber: number, manualTime: string) => {
    if (!userName) return;

    const door = doors[doorNumber];
    if (!door) {
      toast({
        title: "Cannot Update Time",
        description: `Door ${doorNumber} not found`,
        variant: "destructive",
      });
      return;
    }

    // Validate that the time is not in the future
    const enteredTime = new Date(manualTime).getTime();
    const now = new Date().getTime();
    
    if (enteredTime > now) {
      toast({
        title: "Invalid Time",
        description: "Cannot enter a future time",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error: updateError } = await supabase
        .from("dock_doors")
        .update({
          timestamp: manualTime,
          manual_time_entry: true,
        })
        .eq("door_number", doorNumber);

      if (updateError) throw updateError;

      toast({
        title: "Time Updated",
        description: `Manual check-in time set for door ${doorNumber}`,
      });
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleReload = async (doorNumber: number) => {
    if (!userName) return;

    const door = doors[doorNumber];

    if (!door || !door.trailer_number) {
      toast({
        title: "Cannot Reload",
        description: `Door ${doorNumber} has no trailer assigned`,
        variant: "destructive",
      });
      return;
    }

    try {
      const newTimestamp = new Date().toISOString();

      // Log reload to history
      const { error: historyError } = await supabase.from("dock_history").insert({
        door_number: doorNumber,
        trailer_number: door.trailer_number,
        action: "RELOAD",
        type: door.type,
        event_timestamp: newTimestamp,
        assigned_by: userName,
        assigned_by_id: null,
        assignment_timestamp: door.timestamp,
      });

      if (historyError) throw historyError;

      // Reset timer, change type to RELOAD, and clear reload_pending
      const { error: updateError } = await supabase
        .from("dock_doors")
        .update({
          timestamp: newTimestamp,
          type: "RELOAD",
          reload_pending: false,
        })
        .eq("door_number", doorNumber);

      if (updateError) throw updateError;

      toast({
        title: "Reload Started",
        description: `Door ${doorNumber} reload started`,
      });
    } catch (error: any) {
      toast({
        title: "Reload Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleAssignToDoor = async (trailerId: string, loadType: string, trailerNumber: string, doorNumber: number) => {
    if (!userName) return;

    const selectedDoor = doors[doorNumber];

    if (!selectedDoor) {
      toast({
        title: "Invalid Door",
        description: `Door ${doorNumber} not found`,
        variant: "destructive",
      });
      return;
    }

    if (selectedDoor.status === "ASSIGNED") {
      toast({
        title: "Door Unavailable",
        description: `Door ${doorNumber} is already assigned`,
        variant: "destructive",
      });
      return;
    }

    try {
      const timestamp = new Date().toISOString();

      // Delete from parking lot
      const { error: deleteError } = await supabase
        .from("parking_lot_trailers")
        .delete()
        .eq("id", trailerId);

      if (deleteError) throw deleteError;

      // Update door status
      const { error: updateError } = await supabase
        .from("dock_doors")
        .update({
          status: "ASSIGNED",
          type: loadType as "INBOUND" | "OUTBOUND",
          assigned_by: userName,
          assigned_by_id: null,
          trailer_number: trailerNumber,
          timestamp,
          reload_pending: false,
        })
        .eq("door_number", doorNumber);

      if (updateError) throw updateError;

      // Log to history
      const { error: historyError } = await supabase.from("dock_history").insert({
        door_number: doorNumber,
        trailer_number: trailerNumber,
        action: "ASSIGNED",
        type: loadType as "INBOUND" | "OUTBOUND",
        event_timestamp: timestamp,
        assigned_by: userName,
        assigned_by_id: null,
      });

      if (historyError) throw historyError;

      toast({
        title: "Trailer Assigned",
        description: `Trailer ${trailerNumber} assigned to Door ${doorNumber}`,
      });
    } catch (error: any) {
      toast({
        title: "Assignment Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const sortedDoors = useMemo(() => {
    return Object.values(doors).sort((a, b) => a.door_number - b.door_number);
  }, [doors]);

  if (!userName) {
    return <UserNamePrompt onSubmit={handleUserNameSubmit} />;
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
              <Button 
                onClick={() => setParkingLotOpen(true)}
                variant="secondary"
                className="gap-2"
              >
                <Truck className="h-4 w-4" />
                Parking Lot
              </Button>
              <HistoryExport />
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {sortedDoors.map((door) => (
            <DockDoor
              key={door.door_number}
              door={door}
              userName={userName}
              onStartAssignment={handleStartAssignment}
              onClear={handleClear}
              onReload={handleReload}
              onManualTimeEntry={handleManualTimeEntry}
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

      <ParkingLotModal
        open={parkingLotOpen}
        onOpenChange={setParkingLotOpen}
        onAssignToDoor={handleAssignToDoor}
        userName={userName}
      />
    </div>
  );
};

export default Index;
