"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollText, Search, Database, Zap, Loader2, RefreshCw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface LogEntry {
  id: string;
  timestamp: string;
  model: string;
  provider: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
  cacheHit: boolean;
  responseTime: number;
  status: "success" | "error";
}

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalRequests: 0,
    cacheHitRate: 0,
    avgResponseTime: 0,
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchLogs();
  }, []);

  async function fetchLogs() {
    try {
      setIsLoading(true);
      const response = await fetch("/api/logs");
      
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
        setSummary(data.summary || { totalRequests: 0, cacheHitRate: 0, avgResponseTime: 0 });
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch request logs",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch request logs",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const filteredLogs = logs.filter((log) => {
    if (searchQuery && !log.model.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (filter === "cache-hit" && !log.cacheHit) return false;
    if (filter === "cache-miss" && log.cacheHit) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Request Logs</h1>
        <p className="text-muted-foreground mt-2">
          View your API request history and performance metrics
        </p>
      </div>

      <Alert>
        <Database className="h-4 w-4" />
        <AlertDescription>
          Community Edition retains logs for 7 days. Upgrade to Full Edition for 90+ days retention.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle>Recent Requests</CardTitle>
              <CardDescription>Last 7 days of API requests</CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search model..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 w-[200px]"
                />
              </div>
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Requests</SelectItem>
                  <SelectItem value="cache-hit">Cache Hit</SelectItem>
                  <SelectItem value="cache-miss">Cache Miss</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={fetchLogs}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-12 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="relative overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted">
                  <tr>
                    <th className="px-4 py-3">Time</th>
                    <th className="px-4 py-3">Model</th>
                    <th className="px-4 py-3">Provider</th>
                    <th className="px-4 py-3">Tokens</th>
                    <th className="px-4 py-3">Cost</th>
                    <th className="px-4 py-3">Cache</th>
                    <th className="px-4 py-3">Response Time</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                        <ScrollText className="mx-auto h-12 w-12 mb-4" />
                        <p>No logs found</p>
                        <p className="text-sm mt-1">Make some API requests to see them here</p>
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr key={log.id} className="border-b hover:bg-muted/50">
                        <td className="px-4 py-3">
                          {new Date(log.timestamp).toLocaleTimeString()}
                          <div className="text-xs text-muted-foreground">
                            {new Date(log.timestamp).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-medium">{log.model}</td>
                        <td className="px-4 py-3">
                          <Badge variant="outline">{log.provider}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-xs">
                            <div>Prompt: {log.promptTokens}</div>
                            <div>Completion: {log.completionTokens}</div>
                            <div className="font-semibold">Total: {log.totalTokens}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3">${log.cost.toFixed(4)}</td>
                        <td className="px-4 py-3">
                          {log.cacheHit ? (
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                              <Zap className="h-3 w-3 mr-1" />
                              Hit
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Miss</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3">{log.responseTime}ms</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Requests (7 days)</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <div className="text-2xl font-bold">{summary.totalRequests.toLocaleString()}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Cache Hit Rate</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <div className="text-2xl font-bold">{summary.cacheHitRate}%</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Avg Response Time</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <div className="text-2xl font-bold">{summary.avgResponseTime}ms</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
