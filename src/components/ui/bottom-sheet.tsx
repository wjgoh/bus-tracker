"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

interface BottomSheetProps {
  children: React.ReactNode;
  className?: string;
}

export function BottomSheet({ children, className }: BottomSheetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [height, setHeight] = useState(200);
  const [startY, setStartY] = useState(0);
  const [startHeight, setStartHeight] = useState(0);
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragHandleRef = useRef<HTMLDivElement>(null);

  const minHeight = 60;
  const maxHeight =
    typeof window !== "undefined" ? window.innerHeight * 0.95 : 600;

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      // Only handle drag on the handle, not the content
      if (!dragHandleRef.current?.contains(e.target as Node)) return;

      e.preventDefault();
      e.stopPropagation();

      setIsDragging(true);
      setStartY(e.touches[0].clientY);
      setStartHeight(height);

      // Disable body scroll
      document.body.style.overflow = "hidden";
    },
    [height]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging) return;

      e.preventDefault();
      e.stopPropagation();

      const currentY = e.touches[0].clientY;
      const deltaY = startY - currentY;
      const newHeight = Math.max(
        minHeight,
        Math.min(maxHeight, startHeight + deltaY)
      );

      setHeight(newHeight);
    },
    [isDragging, startY, startHeight, minHeight, maxHeight]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging) return;

      e.preventDefault();
      e.stopPropagation();

      setIsDragging(false);

      // Re-enable body scroll
      document.body.style.overflow = "";

      // No snapping - just update open state based on current height
      setIsOpen(height > 100);
    },
    [isDragging, height]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Only handle drag on the handle, not the content
      if (!dragHandleRef.current?.contains(e.target as Node)) return;

      e.preventDefault();
      setIsDragging(true);
      setStartY(e.clientY);
      setStartHeight(height);
    },
    [height]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;

      const deltaY = startY - e.clientY;
      const newHeight = Math.max(
        minHeight,
        Math.min(maxHeight, startHeight + deltaY)
      );

      setHeight(newHeight);
    },
    [isDragging, startY, startHeight, minHeight, maxHeight]
  );

  const handleMouseUp = useCallback(() => {
    if (!isDragging) return;

    setIsDragging(false);

    // No snapping - just update open state
    setIsOpen(height > 100);
  }, [isDragging, height]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove, {
        passive: false,
      });
      document.addEventListener("mouseup", handleMouseUp);

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const toggleSheet = useCallback(
    (e: React.MouseEvent) => {
      // Only toggle on click, not during drag
      if (isDragging) return;

      e.preventDefault();
      e.stopPropagation();

      if (isOpen) {
        setHeight(60);
        setIsOpen(false);
      } else {
        setHeight(400);
        setIsOpen(true);
      }
    },
    [isDragging, isOpen]
  );

  return (
    <div
      ref={sheetRef}
      className={cn(
        "fixed bottom-0 left-0 right-0 bg-background border-t border-border rounded-t-lg shadow-lg z-50 flex flex-col",
        isDragging ? "transition-none" : "transition-all duration-300 ease-out",
        className
      )}
      style={{ height: `${height}px` }}
    >
      {/* Drag Handle */}
      <div
        ref={dragHandleRef}
        className={cn(
          "flex justify-center items-center py-3 cursor-grab select-none touch-none flex-shrink-0",
          isDragging && "cursor-grabbing"
        )}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onClick={toggleSheet}
        style={{ touchAction: "none" }}
      >
        <div className="w-12 h-1 bg-muted-foreground/40 rounded-full" />
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-hidden min-h-0">
        <div
          className="h-full overflow-y-auto overflow-x-hidden px-4 pb-4 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent"
          style={{
            touchAction: "pan-y",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
