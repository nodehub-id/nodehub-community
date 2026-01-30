"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface HeaderProps {
  user: {
    email?: string | null;
    name?: string | null;
    image?: string | null;
  };
}

export function DashboardHeader({ user }: HeaderProps) {
  return (
    <header className="border-b bg-background px-6 py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-4">
          <Avatar>
            <AvatarFallback className="bg-primary text-primary-foreground">
              {user.name?.charAt(0) || user.email?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
