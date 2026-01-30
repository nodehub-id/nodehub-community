import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default async function DashboardPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="border-b bg-background">
        <div className="container flex h-16 items-center justify-between">
          <h1 className="text-xl font-bold">NodeHub Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {session.user.email}
            </span>
            <form action="/api/auth/signout" method="POST">
              <Button type="submit" variant="outline" size="sm">
                Sign Out
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>API Keys</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Manage your API keys for accessing NodeHub
              </p>
              <Link href="/dashboard/api-keys">
                <Button className="w-full">Manage Keys</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Providers</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Configure AI provider API keys
              </p>
              <Link href="/dashboard/providers">
                <Button className="w-full">Configure</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                View usage statistics and metrics
              </p>
              <Link href="/dashboard/analytics">
                <Button className="w-full">View Analytics</Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Quick Start</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-muted p-4">
                <p className="text-sm font-medium mb-2">Configure your IDE:</p>
                <code className="text-xs bg-background p-2 rounded block">
                  {`Base URL: http://localhost:3000/api/v1\nAPI Key: [Create one in API Keys]`}
                </code>
              </div>
              <p className="text-sm text-muted-foreground">
                1. Go to <strong>API Keys</strong> to create your first API key<br/>
                2. Go to <strong>Providers</strong> to add at least one AI provider<br/>
                3. Use the API key in your IDE or applications
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
