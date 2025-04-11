"use client";

import { Button } from "@/components/ui/button";

export default function TrackButton() {
  return (
    <Button
      variant="default"
      className="mb-4 ml-0"
      onClick={() => {
        console.log("Button clicked");
      }}
    >
      Update Bus Location
    </Button>
  );
}
