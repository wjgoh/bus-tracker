"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarTrigger,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { BusIcon } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useState, useEffect } from "react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { SidebarInner } from "./SidebarInner";

export function BusTrackerSidebar() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Mobile view - render bottom sheet
  if (isMobile) {
    return (
      <BottomSheet>
        <SidebarInner isMobile={true} />
      </BottomSheet>
    );
  }

  // Desktop view - render sidebar
  return (
    <Sidebar>
      <SidebarTrigger className="absolute -right-12 top-4 bg-background border shadow-sm rounded-md" />

      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 pt-3">
          <BusIcon className="h-6 w-6" />
          <h2 className="font-semibold text-lg">Bus Tracker</h2>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarInner />
      </SidebarContent>

      <SidebarFooter>
        <div className="flex items-center justify-between px-2">
          <span className="text-xs text-muted-foreground">v1.0.0</span>
          <ThemeToggle />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
