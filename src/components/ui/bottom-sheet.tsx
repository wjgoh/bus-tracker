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
  const [height, setHeight] = useState(200); // Default collapsed height
  const [startY, setStartY] = useState(0);
  const [startHeight, setStartHeight] = useState(0);
  const sheetRef = useRef<HTMLDivElement>(null);

  const minHeight = 120;
  const maxHeight = window.innerHeight * 0.8;
  const snapThreshold = 50;

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      setIsDragging(true);
      setStartY(e.touches[0].clientY);
      setStartHeight(height);
    },
    [height]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging) return;

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

  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return;

    setIsDragging(false);

    // Snap to positions
    const quarterHeight = maxHeight * 0.25;
    const halfHeight = maxHeight * 0.5;

    if (height < quarterHeight) {
      setHeight(minHeight);
      setIsOpen(false);
    } else if (height < halfHeight + snapThreshold) {
      setHeight(halfHeight);
      setIsOpen(true);
    } else {
      setHeight(maxHeight);
      setIsOpen(true);
    }
  }, [isDragging, height, maxHeight, minHeight, snapThreshold]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
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

    // Snap to positions
    const quarterHeight = maxHeight * 0.25;
    const halfHeight = maxHeight * 0.5;

    if (height < quarterHeight) {
      setHeight(minHeight);
      setIsOpen(false);
    } else if (height < halfHeight + snapThreshold) {
      setHeight(halfHeight);
      setIsOpen(true);
    } else {
      setHeight(maxHeight);
      setIsOpen(true);
    }
  }, [isDragging, height, maxHeight, minHeight, snapThreshold]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const toggleSheet = () => {
    if (isOpen) {
      setHeight(minHeight);
      setIsOpen(false);
    } else {
      setHeight(maxHeight * 0.5);
      setIsOpen(true);
    }
  };

  return (
    <div
      ref={sheetRef}
      className={cn(
        "fixed bottom-0 left-0 right-0 bg-background border-t border-border rounded-t-lg shadow-lg transition-all duration-300 ease-out z-50",
        className
      )}
      style={{ height: `${height}px` }}
    >
      {/* Drag Handle */}
      <div
        className="flex justify-center items-center py-2 cursor-grab active:cursor-grabbing"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onClick={toggleSheet}
      >
        <div className="w-12 h-1 bg-muted-foreground/40 rounded-full" />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto px-4 pb-4">{children}</div>
      </div>
    </div>
  );
}
