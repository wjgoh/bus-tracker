"use client";

import * as React from "react";
import { Sidebar as SidebarContainer } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { PanelLeftClose, PanelRightClose } from "lucide-react";

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  return (
    <SidebarContainer
      collapsible
      variant={isCollapsed ? "collapsed" : "default"}
      onCollapseChange={setIsCollapsed}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="text-lg font-semibold">Bus Tracker</div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-8 w-8"
          >
            {/* These are the icons that change based on sidebar state */}
            {isCollapsed ? (
              <PanelRightClose size={18} />
            ) : (
              <PanelLeftClose size={18} />
            )}
          </Button>
        </div>
        <nav className="space-y-2">
          {/* Example items */}
          <div className="flex items-center py-2">
            <span className="flex-1 truncate">Dashboard</span>
          </div>
        </nav>
      </div>
    </SidebarContainer>
  );
}
