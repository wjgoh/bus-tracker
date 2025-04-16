"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Loader2, Download } from "lucide-react";

export default function GtfsUpdateButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState<boolean | null>(null);

  const handleUpdate = async () => {
    setIsLoading(true);
    setMessage("");
    setIsSuccess(null);

    try {
      const response = await fetch("/api/update-gtfs");
      const data = await response.json();

      if (data.success) {
        setMessage("GTFS data updated successfully!");
        setIsSuccess(true);
      } else {
        setMessage(data.message || "Failed to update GTFS data");
        setIsSuccess(false);
      }
    } catch (error) {
      console.error("Error updating GTFS data:", error);
      setMessage("Error updating GTFS data. Check console for details.");
      setIsSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-2">
      <Button
        onClick={handleUpdate}
        disabled={isLoading}
        className="flex gap-2 items-center"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Updating GTFS Data...
          </>
        ) : (
          <>
            <Download className="h-4 w-4" />
            Update GTFS Data
          </>
        )}
      </Button>

      {message && (
        <div
          className={`text-sm mt-2 ${
            isSuccess ? "text-green-600" : "text-red-600"
          }`}
        >
          {message}
        </div>
      )}
    </div>
  );
}
