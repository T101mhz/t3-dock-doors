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
import { Checkbox } from "@/components/ui/checkbox";

interface AssignmentModalProps {
  doorNumber: number | null;
  type: "INBOUND" | "OUTBOUND" | null;
  onClose: () => void;
  onSubmit: (trailerNumber: string, isReload: boolean) => Promise<void>;
}

export const AssignmentModal = ({ doorNumber, type, onClose, onSubmit }: AssignmentModalProps) => {
  const [trailerNumber, setTrailerNumber] = useState("");
  const [isReload, setIsReload] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!trailerNumber.trim()) return;
    
    setIsSubmitting(true);
    await onSubmit(trailerNumber.trim().toUpperCase(), isReload);
    setIsSubmitting(false);
    setTrailerNumber("");
    setIsReload(false);
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
          
          {type === "INBOUND" && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="reload"
                checked={isReload}
                onCheckedChange={(checked) => setIsReload(checked === true)}
              />
              <Label
                htmlFor="reload"
                className="text-sm font-normal cursor-pointer"
              >
                Reload
              </Label>
            </div>
          )}
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
