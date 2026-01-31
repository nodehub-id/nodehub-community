"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, TrendingUp, DollarSign, Zap, MessageSquare, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

const mockDailyData = [
  { date: "Mon", requests: 120, tokens: 45000, cost: 0.85 },
  { date: "Tue", requests: 150, tokens: 52000, cost: 0.98 },
  { date: "Wed", requests: 180, tokens: 68000, cost: 1.25 },
  { date: "Thu", requests: 140, tokens: 48000, cost: 0.92 },
  { date: "Fri", requests: 200, tokens: 75000, cost: 1.45 },
  { date: "Sat", requests: 90, tokens: 32000, cost: 0.62 },
  { date: "Sun", requests: 110, tokens: 41000, cost: 0.78 },
];

const mockModelData = [
  { name: "GPT-4o", requests: 450, percentage: 35 },
  { name: "Claude 3.5", requests: 380, percentage: 30 },
  { name: "GPT-4o-mini", requests: 280, percentage: 22 },
  { name: "Gemini Pro", requests: 160, percentage: 13 },
];

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("7d");

  const stats = [
    {
      title: "Total Requests",
      value: "1,270",
      change: "+12%",
      icon: MessageSquare,
    },
    {
      title: "Total Tokens",
      value: "401K",
      change: "+8%",
      icon: BarChart3,
    },
    {
      title: "Cost Savings",
      value: "$156",
      change: "+24%",
      icon: DollarSign,
    },
    {
      title: "Cache Hit Rate",
      value: "32%",
      change: "+5%",
      icon: Zap,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground mt-2">
            View your API usage and cost statistics
          </p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">Last 24 hours</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Community Edition retains analytics data for 7 days. Upgrade to Full Edition for 90+ days retention.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600 flex items-center">
                  <TrendingUp className="mr-1 h-3 w-3" />
                  {stat.change}
                </span>{" "}
                from last period
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Daily Requests</CardTitle>
            <CardDescription>Number of API requests per day</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={mockDailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="requests" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Token Usage</CardTitle>
            <CardDescription>Total tokens consumed per day</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={mockDailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="tokens"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Model Usage Distribution</CardTitle>
            <CardDescription>Requests by AI model</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockModelData.map((model) => (
                <div key={model.name} className="flex items-center">
                  <div className="w-24 font-medium">{model.name}</div>
                  <div className="flex-1 mx-4">
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${model.percentage}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-16 text-right text-sm text-muted-foreground">
                    {model.requests}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cost Overview</CardTitle>
            <CardDescription>Daily estimated costs</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={mockDailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => `$${value}`} />
                <Bar dataKey="cost" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Cost (7 days)</span>
                <span className="text-2xl font-bold">$6.85</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Based on available 7-day data
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
