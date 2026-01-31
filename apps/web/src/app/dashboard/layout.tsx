import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-muted/40">
      <DashboardSidebar user={session.user} />
      <div className="flex-1 flex flex-col">
        <DashboardHeader user={session.user} />
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
