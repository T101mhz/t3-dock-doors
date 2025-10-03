import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface AssignmentModalProps {
  doorNumber: number | null;
  type: "INBOUND" | "OUTBOUND" | null;
  onClose: () => void;
  onSubmit: (trailerNumber: string) => Promise<void>;
}

export const AssignmentModal = ({ doorNumber, type, onClose, onSubmit }: AssignmentModalProps) => {
  const [trailerNumber, setTrailerNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!trailerNumber.trim()) return;
    
    setIsSubmitting(true);
    await onSubmit(trailerNumber.trim().toUpperCase());
    setIsSubmitting(false);
    setTrailerNumber("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && trailerNumber.trim()) {
      handleSubmit();
    }
  };

  return (
    <Dialog open={doorNumber !== null} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Assign Door {doorNumber} ({type})
          </DialogTitle>
          <DialogDescription>
            Please enter the trailer number before assigning.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="trailer-number">Trailer Number</Label>
            <Input
              id="trailer-number"
              placeholder="Enter Trailer Number (e.g., ABX12345)"
              value={trailerNumber}
              onChange={(e) => setTrailerNumber(e.target.value)}
              onKeyPress={handleKeyPress}
              className="uppercase"
              autoFocus
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!trailerNumber.trim() || isSubmitting}
          >
            {isSubmitting ? "Assigning..." : "Confirm Assignment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
