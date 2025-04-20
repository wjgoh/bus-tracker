"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const sidebarVariants = cva(
  "h-full bg-sidebar text-sidebar-foreground transition-all duration-300 border-r border-sidebar-border",
  {
    variants: {
      variant: {
        default: "w-64",
        collapsed: "w-16",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

interface SidebarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof sidebarVariants> {
  collapsible?: boolean;
  onCollapseChange?: (collapsed: boolean) => void;
}

const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  (
    {
      className,
      variant,
      collapsible = true,
      onCollapseChange,
      children,
      ...props
    },
    ref
  ) => {
    const [isCollapsedInternal, setIsCollapsedInternal] = React.useState(
      variant === "collapsed"
    );

    // Update internal state when variant prop changes
    React.useEffect(() => {
      setIsCollapsedInternal(variant === "collapsed");
    }, [variant]);

    // Use the internal state for determining if collapsed
    const isCollapsed = isCollapsedInternal;

    // Add toggle function that uses the collapsible prop
    const toggleCollapse = React.useCallback(() => {
      if (collapsible) {
        setIsCollapsedInternal((prev) => !prev);
      }
    }, [collapsible]);

    React.useEffect(() => {
      if (onCollapseChange) {
        onCollapseChange(isCollapsedInternal);
      }
    }, [isCollapsedInternal, onCollapseChange]);

    return (
      <div
        ref={ref}
        className={cn(
          sidebarVariants({ variant: isCollapsed ? "collapsed" : "default" }),
          className
        )}
        {...props}
      >
        <div className="flex flex-col h-full">
          {collapsible && <div className="p-2 flex justify-end"></div>}
          <div className="flex-1 overflow-y-auto p-4">{children}</div>
        </div>
      </div>
    );
  }
);

Sidebar.displayName = "Sidebar";
export { Sidebar, sidebarVariants };
