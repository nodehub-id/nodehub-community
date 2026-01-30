"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, Database, Trash2 } from "lucide-react";

export default function CachingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Caching</h2>
        <p className="text-muted-foreground">
          Configure semantic caching to reduce API costs
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Community Edition</AlertTitle>
        <AlertDescription>
          Caching settings are optimized for best performance. Upgrade to Full
          Edition for advanced configuration options.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Cache Status</CardTitle>
          <CardDescription>Current caching configuration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Semantic Caching</Label>
              <p className="text-sm text-muted-foreground">
                Enable similarity-based caching
              </p>
            </div>
            <Badge>Always Enabled</Badge>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Similarity Threshold</Label>
                <p className="text-sm text-muted-foreground">
                  Minimum similarity for cache hits
                </p>
              </div>
              <Badge variant="secondary">0.95 (Fixed)</Badge>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Default TTL</Label>
                <p className="text-sm text-muted-foreground">
                  How long to keep cached responses
                </p>
              </div>
              <Badge variant="secondary">24 hours (Fixed)</Badge>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Cache Storage</Label>
                <p className="text-sm text-muted-foreground">
                  Where cached data is stored
                </p>
              </div>
              <Badge variant="secondary">PostgreSQL + pgvector</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cache Statistics</CardTitle>
          <CardDescription>Current cache performance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm font-medium">Total Cached</p>
              <p className="text-2xl font-bold">-</p>
            </div>
            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm font-medium">Cache Hits</p>
              <p className="text-2xl font-bold">-</p>
            </div>
            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm font-medium">Hit Rate</p>
              <p className="text-2xl font-bold">-</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>Destructive actions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-destructive">Clear Cache</Label>
              <p className="text-sm text-muted-foreground">
                Delete all cached responses (cannot be undone)
              </p>
            </div>
            <Button variant="destructive" size="sm">
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Cache
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
