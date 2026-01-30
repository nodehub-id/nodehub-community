import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { StatsCard } from "@/components/dashboard/stats-card";

async function getDashboardStats() {
  // Placeholder stats - would fetch from analytics API
  return {
    totalRequests: "0",
    cacheHitRate: "0%",
    costSaved: "$0.00",
    costSpent: "$0.00",
  };
}

export default async function OverviewPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }

  const stats = await getDashboardStats();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Overview</h2>
        <p className="text-muted-foreground">
          Welcome back! Here&apos;s your AI API usage at a glance.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Requests"
          value={stats.totalRequests}
          description="Last 7 days"
        />
        <StatsCard
          title="Cache Hit Rate"
          value={stats.cacheHitRate}
          description="Cost savings from caching"
        />
        <StatsCard
          title="Cost Saved"
          value={stats.costSaved}
          description="From semantic caching"
        />
        <StatsCard
          title="Cost Spent"
          value={stats.costSpent}
          description="Last 7 days"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>API Keys</CardTitle>
            <CardDescription>Manage your API keys</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Community Edition allows 1 API key
            </p>
            <Link href="/dashboard/api-keys">
              <Button className="w-full">Manage API Keys</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Providers</CardTitle>
            <CardDescription>Configure AI providers</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Set up OpenAI, Anthropic, Google, Groq, or Ollama
            </p>
            <Link href="/dashboard/providers">
              <Button className="w-full">Configure Providers</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Analytics</CardTitle>
            <CardDescription>View usage statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Track requests, costs, and cache performance
            </p>
            <Link href="/dashboard/analytics">
              <Button className="w-full">View Analytics</Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Start Guide</CardTitle>
          <CardDescription>Get started with NodeHub in 3 easy steps</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm font-medium mb-2">Step 1: Configure your IDE</p>
            <code className="text-xs bg-background p-2 rounded block font-mono">
              Base URL: http://localhost:3000/api/v1
              <br />
              API Key: Create one in the API Keys section
            </code>
          </div>
          <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-2 ml-4">
            <li>Go to <strong>API Keys</strong> and create your API key</li>
            <li>Go to <strong>Providers</strong> and configure at least one AI provider</li>
            <li>Use your API key in Cursor, Continue.dev, or any OpenAI-compatible tool</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
