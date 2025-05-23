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
  const [lastMoveTime, setLastMoveTime] = useState(0);
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragHandleRef = useRef<HTMLDivElement>(null);

  const minHeight = 80; // Reduced minimum for more flexibility
  const maxHeight = typeof window !== "undefined" ? window.innerHeight * 0.95 : 600; // Increased maximum
  const snapThreshold = 30; // Reduced for more precise control
  const velocity = useRef(0);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();

      setIsDragging(true);
      setStartY(e.touches[0].clientY);
      setStartHeight(height);
      setLastMoveTime(Date.now());
      velocity.current = 0;

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
      // Allow free movement within the full range
      const newHeight = Math.max(
        minHeight,
        Math.min(maxHeight, startHeight + deltaY)
      );

      // Calculate velocity for better snapping
      const currentTime = Date.now();
      const timeDelta = currentTime - lastMoveTime;
      if (timeDelta > 0) {
        velocity.current = deltaY / timeDelta;
      }
      setLastMoveTime(currentTime);

      setHeight(newHeight);
    },
    [isDragging, startY, startHeight, minHeight, maxHeight, lastMoveTime]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging) return;

      e.preventDefault();
      e.stopPropagation();

      setIsDragging(false);

      // Re-enable body scroll
      document.body.style.overflow = "";

      // Only snap if velocity is high, otherwise keep current position
      const velocityThreshold = 1.0; // Increased threshold
      const isSwipeUp = velocity.current > velocityThreshold;
      const isSwipeDown = velocity.current < -velocityThreshold;

      if (isSwipeDown) {
        // Fast swipe down - collapse
        setHeight(minHeight);
        setIsOpen(false);
      } else if (isSwipeUp) {
        // Fast swipe up - expand to comfortable size or max
        const targetHeight =
          height < maxHeight * 0.5 ? maxHeight * 0.6 : maxHeight;
        setHeight(targetHeight);
        setIsOpen(true);
      } else {
        // Gentle drag - keep current position but update open state
        setIsOpen(height > minHeight + 50);
      }
    },
    [isDragging, height, maxHeight, minHeight]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
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
      // Allow free movement within the full range
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

    // For mouse, use gentler snapping - only snap to extremes if very close
    if (height < minHeight + snapThreshold) {
      setHeight(minHeight);
      setIsOpen(false);
    } else if (height > maxHeight - snapThreshold) {
      setHeight(maxHeight);
      setIsOpen(true);
    } else {
      // Keep current position
      setIsOpen(height > minHeight + 50);
    }
  }, [isDragging, height, maxHeight, minHeight, snapThreshold]);

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
        setHeight(minHeight);
        setIsOpen(false);
      } else {
        setHeight(maxHeight * 0.6); // More reasonable default size
        setIsOpen(true);
      }
    },
    [isDragging, isOpen, minHeight, maxHeight]
  );

  return (
    <div
      ref={sheetRef}
      className={cn(
        "fixed bottom-0 left-0 right-0 bg-background border-t border-border rounded-t-lg shadow-lg z-50",
        isDragging ? "transition-none" : "transition-all duration-300 ease-out",
        className
      )}
      style={{ height: `${height}px` }}
    >
      {/* Drag Handle */}
      <div
        ref={dragHandleRef}
        className={cn(
          "flex justify-center items-center py-3 cursor-grab select-none touch-none",
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

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <div
          className="h-full overflow-y-auto px-4 pb-4"
          style={{ touchAction: "pan-y" }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
