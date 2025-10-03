import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const HistoryExport = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const formatDuration = (seconds: number) => {
    if (typeof seconds !== "number" || seconds < 0) return "N/A";
    const h = String(Math.floor(seconds / 3600)).padStart(2, "0");
    const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  const generateCsv = async () => {
    setIsGenerating(true);

    try {
      const { data, error } = await supabase
        .from("dock_history")
        .select("*")
        .order("event_timestamp", { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        toast({
          title: "No History",
          description: "No history records found to export.",
          variant: "destructive",
        });
        setIsGenerating(false);
        return;
      }

      const headers = [
        "Dock Door",
        "Trailer Number",
        "Action",
        "Type",
        "Event Timestamp",
        "Assigned By",
        "Dwell Time (HH:MM:SS)",
      ];

      const csvRows = [headers.join(",")];

      data.forEach((item) => {
        let dwellTime = "N/A";

        if (item.action === "CLEARED" && item.assignment_timestamp && item.event_timestamp) {
          const assignTime = new Date(item.assignment_timestamp).getTime();
          const clearTime = new Date(item.event_timestamp).getTime();
          const durationInSeconds = Math.floor((clearTime - assignTime) / 1000);
          dwellTime = formatDuration(durationInSeconds);
        }

        const row = [
          item.door_number,
          `"${item.trailer_number || ""}"`,
          item.action,
          item.type || "",
          item.event_timestamp,
          item.assigned_by || "",
          dwellTime,
        ].join(",");

        csvRows.push(row);
      });

      const csvString = csvRows.join("\n");
      const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `dock_door_history_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Export Complete",
        description: "History report downloaded successfully.",
      });
    } catch (e) {
      console.error("Error generating report:", e);
      toast({
        title: "Export Failed",
        description: "Error generating report. Check console for details.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      onClick={generateCsv}
      disabled={isGenerating}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      {isGenerating ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <Download className="h-4 w-4" />
          Export History (CSV)
        </>
      )}
    </Button>
  );
};
