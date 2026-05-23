"use client";

import { useState } from "react";
import { Search, Bell, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logout } from "@/actions/auth";
import { getInitials } from "@/lib/utils";
import type { AuthUser } from "@/types";

interface TopbarProps {
  user: AuthUser;
  onMenuClick?: () => void;
}

export function Topbar({ user, onMenuClick }: TopbarProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const displayName =
    user.fullName || user.email.split("@")[0] || "User";

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
  };

  return (
    <header className="flex h-14 items-center gap-4 border-b border-border bg-card px-4 lg:px-6">
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon-sm"
        className="lg:hidden text-muted-foreground"
        onClick={onMenuClick}
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Search */}
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Search…"
          className="pl-9 h-8 text-sm bg-background border-border focus:bg-card"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground relative"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
        </Button>

        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-8 w-8 rounded-full p-0"
              aria-label="User menu"
            >
              <Avatar className="h-8 w-8">
                {user.avatarUrl?.startsWith("https://") && (
                  <AvatarImage src={user.avatarUrl} alt={displayName} />
                )}
                <AvatarFallback className="text-xs">
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-foreground truncate">
                  {displayName}
                </span>
                <span className="text-xs text-muted-foreground truncate">
                  {user.email}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              destructive
              disabled={isLoggingOut}
              onSelect={handleLogout}
            >
              {isLoggingOut ? "Signing out…" : "Sign out"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
