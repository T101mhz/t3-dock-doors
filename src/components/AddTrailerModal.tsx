import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AddTrailerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const AddTrailerModal = ({ open, onOpenChange, onSuccess }: AddTrailerModalProps) => {
  const [loadType, setLoadType] = useState<string>("");
  const [trailerNumber, setTrailerNumber] = useState("");
  const [carrier, setCarrier] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loadType || !trailerNumber) {
      toast.error("Please fill in load type and trailer number");
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase
      .from("parking_lot_trailers")
      .insert({
        load_type: loadType,
        trailer_number: trailerNumber,
        carrier: carrier,
        order_number: orderNumber,
      });

    if (error) {
      toast.error("Failed to add trailer");
      console.error("Error adding trailer:", error);
      setIsSubmitting(false);
      return;
    }

    toast.success("Trailer added to parking lot");
    
    // Reset form
    setLoadType("");
    setTrailerNumber("");
    setCarrier("");
    setOrderNumber("");
    setIsSubmitting(false);
    
    onSuccess();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Trailer to Parking Lot</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="loadType">Load Type</Label>
            <Select value={loadType} onValueChange={setLoadType}>
              <SelectTrigger id="loadType">
                <SelectValue placeholder="Select load type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INBOUND">INBOUND</SelectItem>
                <SelectItem value="OUTBOUND">OUTBOUND</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="trailerNumber">Trailer #</Label>
            <Input
              id="trailerNumber"
              value={trailerNumber}
              onChange={(e) => setTrailerNumber(e.target.value)}
              placeholder="Enter trailer number"
            />
          </div>

            <div className="space-y-2">
              <Label htmlFor="carrier">Carrier (optional)</Label>
              <Input
                id="carrier"
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
                placeholder="Enter carrier name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="orderNumber">Order # (optional)</Label>
              <Input
                id="orderNumber"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="Enter order number"
              />
            </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Adding..." : "Add Trailer"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};