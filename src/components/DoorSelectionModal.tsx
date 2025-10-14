import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

interface DoorSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (doorNumber: number) => void;
  trailerNumber: string;
}

export const DoorSelectionModal = ({
  open,
  onOpenChange,
  onConfirm,
  trailerNumber,
}: DoorSelectionModalProps) => {
  const [selectedDoor, setSelectedDoor] = useState<string>("");

  const handleConfirm = () => {
    if (selectedDoor) {
      onConfirm(parseInt(selectedDoor));
      setSelectedDoor("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select Door for Trailer {trailerNumber}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="doorNumber">Door Number</Label>
            <Select value={selectedDoor} onValueChange={setSelectedDoor}>
              <SelectTrigger id="doorNumber">
                <SelectValue placeholder="Select a door" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 15 }, (_, i) => i + 1).map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    Door {num}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={handleConfirm} 
            className="w-full"
            disabled={!selectedDoor}
          >
            Assign to Door {selectedDoor}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};