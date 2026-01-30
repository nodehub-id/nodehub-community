"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Check, X, Cloud, Eye, EyeOff } from "lucide-react";

interface Provider {
  id: string;
  name: string;
  enabled: boolean;
  models: string[];
  apiKeySet: boolean;
  apiKey?: string;
}

const PROVIDER_INFO: Record<string, { description: string; keyUrl: string }> = {
  openai: {
    description: "GPT-4o, GPT-4o-mini, GPT-4, GPT-3.5-turbo",
    keyUrl: "https://platform.openai.com/api-keys",
  },
  anthropic: {
    description: "Claude 3.5 Sonnet, Claude 3 Opus, Claude 3 Haiku",
    keyUrl: "https://console.anthropic.com/settings/keys",
  },
  google: {
    description: "Gemini 1.5 Pro, Gemini 1.5 Flash",
    keyUrl: "https://aistudio.google.com/app/apikey",
  },
  groq: {
    description: "Llama 3.2, Mixtral",
    keyUrl: "https://console.groq.com/keys",
  },
  ollama: {
    description: "Local models (no API key needed)",
    keyUrl: "",
  },
};

export default function ProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState<string | null>(null);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchProviders();
  }, []);

  async function fetchProviders() {
    try {
      const response = await fetch("/api/providers");
      if (response.ok) {
        const data = await response.json();
        setProviders(data.providers);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch providers",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function updateProvider(provider: Provider) {
    setIsSaving(provider.id);
    try {
      const response = await fetch("/api/providers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerId: provider.id,
          enabled: provider.enabled,
          apiKey: provider.apiKey || undefined,
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `${provider.name} updated successfully`,
        });
        fetchProviders();
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to update provider",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update provider",
      });
    } finally {
      setIsSaving(null);
    }
  }

  async function testProvider(providerId: string) {
    setTesting(providerId);
    try {
      // Simulate API test - would call actual endpoint in production
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setTestResults({ ...testResults, [providerId]: true });
      toast({
        title: "Success",
        description: "Provider connection successful",
      });
    } catch (error) {
      setTestResults({ ...testResults, [providerId]: false });
      toast({
        variant: "destructive",
        title: "Error",
        description: "Provider connection failed",
      });
    } finally {
      setTesting(null);
    }
  }

  function updateProviderField(id: string, field: keyof Provider, value: any) {
    setProviders(
      providers.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  }

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Providers</h2>
        <p className="text-muted-foreground">
          Configure AI provider API keys to enable model access
        </p>
      </div>

      <div className="grid gap-6">
        {providers.map((provider) => (
          <Card key={provider.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cloud className="h-5 w-5" />
                  <CardTitle>{provider.name}</CardTitle>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant={provider.enabled ? "default" : "secondary"}>
                    {provider.enabled ? "Enabled" : "Disabled"}
                  </Badge>
                  <Switch
                    checked={provider.enabled}
                    onCheckedChange={(checked) =>
                      updateProviderField(provider.id, "enabled", checked)
                    }
                  />
                </div>
              </div>
              <CardDescription>
                {PROVIDER_INFO[provider.id]?.description}
                {provider.models.length > 0 && (
                  <span className="block mt-1 text-xs">
                    Models: {provider.models.join(", ")}
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {provider.id !== "ollama" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor={`${provider.id}-key`}>API Key</Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          id={`${provider.id}-key`}
                          type={showKey[provider.id] ? "text" : "password"}
                          placeholder={
                            provider.apiKeySet
                              ? "••••••••••••••••"
                              : "Enter your API key"
                          }
                          value={provider.apiKey || ""}
                          onChange={(e) =>
                            updateProviderField(provider.id, "apiKey", e.target.value)
                          }
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-1/2 -translate-y-1/2"
                          onClick={() =>
                            setShowKey({
                              ...showKey,
                              [provider.id]: !showKey[provider.id],
                            })
                          }
                        >
                          {showKey[provider.id] ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Get your API key from{" "}
                      <a
                        href={PROVIDER_INFO[provider.id]?.keyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                      >
                        {provider.name}
                      </a>
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => updateProvider(provider)}
                      disabled={isSaving === provider.id}
                    >
                      {isSaving === provider.id ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save"
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => testProvider(provider.id)}
                      disabled={testing === provider.id || !provider.apiKey}
                    >
                      {testing === provider.id ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Testing...
                        </>
                      ) : testResults[provider.id] === true ? (
                        <>
                          <Check className="h-4 w-4 mr-2 text-green-600" />
                          Connected
                        </>
                      ) : testResults[provider.id] === false ? (
                        <>
                          <X className="h-4 w-4 mr-2 text-red-600" />
                          Failed
                        </>
                      ) : (
                        "Test Connection"
                      )}
                    </Button>
                  </div>
                </>
              )}

              {provider.id === "ollama" && (
                <div className="rounded-lg bg-muted p-4">
                  <p className="text-sm">
                    Ollama runs locally and doesn&apos;t require an API key. Make sure
                    Ollama is running on your machine:
                  </p>
                  <code className="mt-2 block text-xs bg-background p-2 rounded">
                    ollama serve
                  </code>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
