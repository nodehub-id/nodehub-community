"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Key,
  Cloud,
  Cpu,
  Database,
  BarChart3,
  Settings,
  LogOut,
  ScrollText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { NodeHubLogo } from "@/components/logo";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/api-keys", label: "API Keys", icon: Key },
  { href: "/dashboard/providers", label: "Model Providers", icon: Cloud },
  { href: "/dashboard/embeddings", label: "Embeddings", icon: Cpu },
  { href: "/dashboard/caching", label: "Caching", icon: Database },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/logs", label: "Logs", icon: ScrollText },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];


export function DashboardSidebar() {
  const { data: session } = useSession();
  const user = session?.user;
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r bg-background flex flex-col">
      <div className="p-6">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl">
          <NodeHubLogo className="w-8 h-8 text-foreground" />
          <span>NodeHub</span>
        </Link>
      </div>

      <ScrollArea className="flex-1 px-4">
        <nav className="space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`))
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
      </ScrollArea>

      <Separator />

      <div className="p-4">
        <div className="mb-4 px-4 py-2">
          <p className="text-sm font-medium truncate">{user?.name || user?.email || "User"}</p>
          <p className="text-xs text-muted-foreground truncate">{user?.email || ""}</p>
        </div>
        <form action="/api/auth/signout" method="POST">
          <Button type="submit" variant="outline" className="w-full" size="sm">
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </form>
      </div>
    </aside>
  );
}
