"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm transition-opacity duration-300 lg:hidden",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 border-r border-border shadow-dropdown transition-transform duration-300 ease-out lg:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="absolute right-3 top-3 z-10">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            className="text-muted-foreground"
            aria-label="Close navigation"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <Sidebar onNavClick={onClose} />
      </div>
    </>
  );
}
