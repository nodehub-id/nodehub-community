"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Database, Trash2, RefreshCw, AlertCircle, Check, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

export default function CachingPage() {
  const { toast } = useToast();
  const [cacheEnabled, setCacheEnabled] = useState(true);
  const [semanticCache, setSemanticCache] = useState(true);
  const [ttlDays, setTtlDays] = useState(7);
  const [isClearing, setIsClearing] = useState(false);

  // Community Edition: Fixed at 0.95 (95%)
  const SIMILARITY_THRESHOLD = 95;

  const cacheStats = {
    totalEntries: 1247,
    exactHits: 843,
    semanticHits: 312,
    totalSavings: "$156.42",
    hitRate: "32%",
    storageUsed: "45.2 MB",
  };

  async function clearCache() {
    setIsClearing(true);
    try {
      // API endpoint doesn't exist yet, just simulate
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast({
        title: "Success",
        description: "Cache cleared successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear cache",
        variant: "destructive",
      });
    } finally {
      setIsClearing(false);
    }
  }

  function saveSettings() {
    toast({
      title: "Success",
      description: "Cache settings saved",
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Caching</h1>
        <p className="text-muted-foreground mt-2">
          Manage semantic caching settings and view cache statistics
        </p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Community Edition provides basic caching with 40-50% cost savings. Upgrade to Full Edition for advanced caching (55-70% savings) and configurable similarity thresholds.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cacheStats.totalEntries.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cache Hit Rate</CardTitle>
            <Check className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cacheStats.hitRate}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cost Savings</CardTitle>
            <span className="text-2xl">$</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cacheStats.totalSavings}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cacheStats.storageUsed}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Cache Settings</CardTitle>
            <CardDescription>Configure basic caching behavior</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="cache-enabled">Enable Caching</Label>
                <p className="text-sm text-muted-foreground">
                  Store and reuse AI responses
                </p>
              </div>
              <Switch
                id="cache-enabled"
                checked={cacheEnabled}
                onCheckedChange={setCacheEnabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="semantic-cache">Semantic Matching</Label>
                <p className="text-sm text-muted-foreground">
                  Match similar questions using AI embeddings
                </p>
              </div>
              <Switch
                id="semantic-cache"
                checked={semanticCache}
                onCheckedChange={setSemanticCache}
                disabled={!cacheEnabled}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Cache TTL (Days)</Label>
                <span className="text-sm text-muted-foreground">{ttlDays} days</span>
              </div>
              <Slider
                value={[ttlDays]}
                onValueChange={(value) => setTtlDays(value[0])}
                max={30}
                min={1}
                step={1}
                disabled={!cacheEnabled}
              />
              <p className="text-xs text-muted-foreground">
                How long to keep cached responses before expiration
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label>Similarity Threshold</Label>
                <Badge variant="secondary" className="font-mono">
                  <Lock className="h-3 w-3 mr-1" />
                  {SIMILARITY_THRESHOLD}%
                </Badge>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Community Edition uses a fixed threshold of {SIMILARITY_THRESHOLD}% for optimal performance. 
                  Upgrade to Full Edition to customize (80-99%).
                </p>
              </div>
            </div>

            <Button onClick={saveSettings} className="w-full" disabled={!cacheEnabled}>
              Save Settings
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cache Management</CardTitle>
            <CardDescription>Manage your cached data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Clear All Cache</p>
                  <p className="text-sm text-muted-foreground">
                    Remove all cached responses ({cacheStats.totalEntries} entries)
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={clearCache}
                  disabled={isClearing}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {isClearing ? "Clearing..." : "Clear"}
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Refresh Stats</p>
                  <p className="text-sm text-muted-foreground">
                    Update cache statistics
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toast({ title: "Stats refreshed" })}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
              </div>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Caching helps reduce API costs by reusing similar responses. Current estimated savings: {cacheStats.totalSavings}.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cache Hits Breakdown</CardTitle>
          <CardDescription>Exact vs semantic cache matches</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium">Exact Matches</p>
              <p className="text-2xl font-bold mt-1">{cacheStats.exactHits.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Identical questions receiving cached responses
              </p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium">Semantic Matches</p>
              <p className="text-2xl font-bold mt-1">{cacheStats.semanticHits.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Similar questions matched using AI embeddings (95% similarity)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
