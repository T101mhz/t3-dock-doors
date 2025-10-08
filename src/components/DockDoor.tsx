import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";

interface DockDoorProps {
  door: {
    id: string;
    door_number: number;
    status: "AVAILABLE" | "ASSIGNED";
    type: "INBOUND" | "OUTBOUND" | null;
    assigned_by: string | null;
    assigned_by_id: string | null;
    trailer_number: string | null;
    timestamp: string | null;
  };
  userName: string;
  onStartAssignment: (doorNumber: number, type: "INBOUND" | "OUTBOUND") => void;
  onClear: (doorNumber: number) => void;
}

const ORANGE_THRESHOLD = 90 * 60; // 90 minutes in seconds
const RED_THRESHOLD = 120 * 60; // 120 minutes in seconds

export const DockDoor = ({ door, userName, onStartAssignment, onClear }: DockDoorProps) => {
  const [elapsedTime, setElapsedTime] = useState("00:00:00");
  const [diffInSeconds, setDiffInSeconds] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (door.status === "ASSIGNED" && door.timestamp) {
      const calculateElapsed = () => {
        const assignmentTime = new Date(door.timestamp!).getTime();
        const now = new Date().getTime();
        const currentDiff = Math.max(0, Math.floor((now - assignmentTime) / 1000));
        
        setDiffInSeconds(currentDiff);
        
        const hours = String(Math.floor(currentDiff / 3600)).padStart(2, "0");
        const minutes = String(Math.floor((currentDiff % 3600) / 60)).padStart(2, "0");
        const seconds = String(currentDiff % 60).padStart(2, "0");
        
        setElapsedTime(`${hours}:${minutes}:${seconds}`);
      };

      calculateElapsed();
      interval = setInterval(calculateElapsed, 1000);
    } else {
      setElapsedTime("00:00:00");
      setDiffInSeconds(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [door.status, door.timestamp]);

  const isAssignedToYou = door.status === "ASSIGNED" && door.assigned_by === userName;
  
  let borderColor = "border-border";
  let ringClass = "";
  let statusColor = "text-muted-foreground";
  let timerColor = "text-foreground";

  if (door.status === "ASSIGNED") {
    if (diffInSeconds >= RED_THRESHOLD) {
      borderColor = "border-critical";
      ringClass = "ring-4 ring-critical/40";
      statusColor = "text-critical";
      timerColor = "text-critical font-extrabold";
    } else if (diffInSeconds >= ORANGE_THRESHOLD) {
      borderColor = "border-warning";
      ringClass = "ring-2 ring-warning/30";
      statusColor = "text-warning";
      timerColor = "text-warning font-bold";
    } else if (isAssignedToYou) {
      borderColor = door.type === "INBOUND" ? "border-inbound" : "border-outbound";
      statusColor = door.type === "INBOUND" ? "text-inbound" : "text-outbound";
      ringClass = door.type === "INBOUND" ? "ring-1 ring-inbound/30" : "ring-1 ring-outbound/30";
    } else {
      borderColor = door.type === "INBOUND" ? "border-inbound/60" : "border-outbound/60";
      statusColor = door.type === "INBOUND" ? "text-inbound/80" : "text-outbound/80";
      ringClass = door.type === "INBOUND" ? "ring-1 ring-inbound/20" : "ring-1 ring-outbound/20";
    }
  } else {
    borderColor = "border-available";
    statusColor = "text-available";
  }

  const assignedTimeDisplay = door.timestamp
    ? new Date(door.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    <Card className={`flex flex-col p-4 border-2 ${borderColor} ${ringClass} transition-all duration-300 hover:scale-[1.02] hover:shadow-lg`}>
      <div className={`flex justify-between items-center mb-3 pb-2 border-b border-border rounded-md -mx-4 -mt-4 px-4 pt-4 pb-2 ${
        diffInSeconds >= RED_THRESHOLD ? "animate-pulse-red" : ""
      }`}>
        <h2 className="text-3xl font-extrabold text-foreground">{door.door_number}</h2>
        <span className={`text-sm font-semibold uppercase tracking-wider ${statusColor}`}>
          {door.status === "AVAILABLE" ? "OPEN" : door.type}
        </span>
      </div>

      {/* Dock door visual */}
      <div className="relative h-20 bg-muted border-t-8 border-muted-foreground/30 overflow-hidden rounded-md flex items-end justify-center mb-3">
        <div className="absolute inset-x-4 bottom-0 h-16 bg-muted-foreground/90 border-2 border-muted-foreground rounded-sm">
          {door.status === "ASSIGNED" && (
            <div className="absolute inset-x-0 bottom-[-10px] p-2">
              <div className={`w-full h-auto rounded-lg ring-2 transition-transform duration-300 ${
                door.type === "INBOUND" ? "ring-inbound bg-inbound/20" : "ring-outbound bg-outbound/20"
              }`} style={{ minHeight: "50px", maxHeight: "70px" }}>
                <div className="flex items-center justify-center h-full">
                  <span className="text-2xl font-extrabold text-black">
                    {door.trailer_number}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="text-xs font-medium text-muted-foreground space-y-1">
        <p className="font-bold text-foreground break-all">
          Trailer: {door.trailer_number || "N/A"}
        </p>
        {door.status === "ASSIGNED" && (
          <div className="pt-2 border-t border-border space-y-1">
            <p className="text-muted-foreground">
              Assigned: {assignedTimeDisplay} by {door.assigned_by}
            </p>
            <div className={`flex items-center space-x-1 font-mono text-sm font-bold ${timerColor}`}>
              <Clock className="h-4 w-4" />
              <span>{elapsedTime}</span>
            </div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      {door.status === "AVAILABLE" ? (
        <div className="flex space-x-2 mt-4">
          <Button
            onClick={() => onStartAssignment(door.door_number, "INBOUND")}
            className="flex-1 bg-inbound hover:bg-inbound/90 text-white"
            size="sm"
          >
            INBOUND
          </Button>
          <Button
            onClick={() => onStartAssignment(door.door_number, "OUTBOUND")}
            className="flex-1 bg-outbound hover:bg-outbound/90 text-white"
            size="sm"
          >
            OUTBOUND
          </Button>
        </div>
      ) : (
        <Button
          onClick={() => onClear(door.door_number)}
          variant="destructive"
          className="w-full mt-4"
          size="sm"
        >
          Clear Door
        </Button>
      )}
    </Card>
  );
};
