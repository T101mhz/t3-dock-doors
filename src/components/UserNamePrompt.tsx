import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface UserNamePromptProps {
  onSubmit: (name: string) => void;
}

export const UserNamePrompt = ({ onSubmit }: UserNamePromptProps) => {
  const [name, setName] = useState("");

  const handleSubmit = () => {
    const trimmedName = name.trim();
    if (trimmedName.length >= 3) {
      onSubmit(trimmedName);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && name.trim().length >= 3) {
      handleSubmit();
    }
  };

  return (
    <Dialog open={true}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">Welcome to Live Dock Dashboard</DialogTitle>
          <DialogDescription>
            Please enter your name or identifier (e.g., "John", "Shift 1 Lead") so others know who made an assignment.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="user-name">Your Name</Label>
            <Input
              id="user-name"
              placeholder="Enter Your Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyPress={handleKeyPress}
              autoFocus
            />
          </div>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={name.trim().length < 3}
          className="w-full"
        >
          Start Using Dashboard
        </Button>
      </DialogContent>
    </Dialog>
  );
};
