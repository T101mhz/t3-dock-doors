import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { AddTrailerModal } from "./AddTrailerModal";
import { DoorSelectionModal } from "./DoorSelectionModal";

interface ParkingLotTrailer {
  id: string;
  load_type: string;
  trailer_number: string;
  carrier: string;
  order_number: string;
  created_at: string;
}

interface ParkingLotModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAssignToDoor: (trailerId: string, loadType: string, trailerNumber: string, doorNumber: number) => void;
  userName: string;
}

export const ParkingLotModal = ({ open, onOpenChange, onAssignToDoor, userName }: ParkingLotModalProps) => {
  const [trailers, setTrailers] = useState<ParkingLotTrailer[]>([]);
  const [addTrailerOpen, setAddTrailerOpen] = useState(false);
  const [selectedTrailer, setSelectedTrailer] = useState<ParkingLotTrailer | null>(null);
  const [doorSelectionOpen, setDoorSelectionOpen] = useState(false);

  const fetchTrailers = async () => {
    const { data, error } = await supabase
      .from("parking_lot_trailers")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      toast.error("Failed to load parking lot trailers");
      console.error("Error fetching trailers:", error);
      return;
    }

    setTrailers(data || []);
  };

  useEffect(() => {
    if (open) {
      fetchTrailers();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const channel = supabase
      .channel("parking_lot_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "parking_lot_trailers",
        },
        () => {
          fetchTrailers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [open]);

  const handleAssign = (trailer: ParkingLotTrailer) => {
    setSelectedTrailer(trailer);
    setDoorSelectionOpen(true);
  };

  const handleDoorSelection = (doorNumber: number) => {
    if (selectedTrailer) {
      onAssignToDoor(
        selectedTrailer.id,
        selectedTrailer.load_type,
        selectedTrailer.trailer_number,
        doorNumber
      );
      setSelectedTrailer(null);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Parking Lot - Waiting Trailers</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <Button onClick={() => setAddTrailerOpen(true)} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Add Trailer
            </Button>

            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Load Type</TableHead>
                    <TableHead>Trailer #</TableHead>
                    <TableHead>Carrier</TableHead>
                    <TableHead>Order #</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trailers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No trailers waiting
                      </TableCell>
                    </TableRow>
                  ) : (
                    trailers.map((trailer) => (
                      <TableRow key={trailer.id}>
                        <TableCell className="font-medium">{trailer.load_type}</TableCell>
                        <TableCell>{trailer.trailer_number}</TableCell>
                        <TableCell>{trailer.carrier}</TableCell>
                        <TableCell>{trailer.order_number}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            onClick={() => handleAssign(trailer)}
                          >
                            Assign to Door
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AddTrailerModal
        open={addTrailerOpen}
        onOpenChange={setAddTrailerOpen}
        onSuccess={fetchTrailers}
      />

      <DoorSelectionModal
        open={doorSelectionOpen}
        onOpenChange={setDoorSelectionOpen}
        onConfirm={handleDoorSelection}
        trailerNumber={selectedTrailer?.trailer_number || ""}
      />
    </>
  );
};