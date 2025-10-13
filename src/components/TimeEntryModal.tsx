import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TimeEntryModalProps {
  doorNumber: number | null;
  onClose: () => void;
  onSubmit: (manualTime: string) => void;
}

export const TimeEntryModal = ({ doorNumber, onClose, onSubmit }: TimeEntryModalProps) => {
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set default to today's date and current time
  const now = new Date();
  const defaultDate = now.toISOString().split('T')[0];
  const defaultTime = now.toTimeString().slice(0, 5);

  const handleSubmit = () => {
    if (!selectedDate || !selectedTime) return;

    const dateTimeString = `${selectedDate}T${selectedTime}:00`;
    const enteredDateTime = new Date(dateTimeString);
    
    // Validate not future
    if (enteredDateTime.getTime() > new Date().getTime()) {
      return;
    }

    setIsSubmitting(true);
    onSubmit(enteredDateTime.toISOString());
    setIsSubmitting(false);
    handleClose();
  };

  const handleClose = () => {
    setSelectedDate("");
    setSelectedTime("");
    onClose();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && selectedDate && selectedTime) {
      handleSubmit();
    }
  };

  return (
    <Dialog open={doorNumber !== null} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manual Check-In Time Entry</DialogTitle>
          <DialogDescription>
            Enter the check-in time for Door {doorNumber}. Cannot be a future time.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              max={defaultDate}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Select date"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="time">Time</Label>
            <Input
              id="time"
              type="time"
              step="60"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Select time"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!selectedDate || !selectedTime || isSubmitting}
          >
            Set Check-In Time
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
