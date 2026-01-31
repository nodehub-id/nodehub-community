"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Cloud,
  Check,
  AlertCircle,
  ExternalLink,
  Eye,
  EyeOff,
  Server,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface Provider {
  id: string;
  name: string;
  enabled: boolean;
  models: string[];
  apiKeySet: boolean;
  baseUrl?: string;
}

const PROVIDER_INFO: Record<string, { url: string; description: string; requiresKey: boolean }> = {
  openai: {
    url: "https://platform.openai.com/api-keys",
    description: "GPT-4, GPT-4o, GPT-3.5 Turbo",
    requiresKey: true,
  },
  anthropic: {
    url: "https://console.anthropic.com/settings/keys",
    description: "Claude 3.5 Sonnet, Claude 3 Opus, Claude 3 Haiku",
    requiresKey: true,
  },
  google: {
    url: "https://makersuite.google.com/app/apikey",
    description: "Gemini Pro, Gemini Ultra",
    requiresKey: true,
  },
  groq: {
    url: "https://console.groq.com/keys",
    description: "Fast inference for open source models",
    requiresKey: true,
  },
  ollama: {
    url: "https://ollama.com",
    description: "Self-hosted open source models (local or cloud)",
    requiresKey: false,
  },
};

export default function ProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [baseUrls, setBaseUrls] = useState<Record<string, string>>({});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchProviders();
    fetchEnvDefaults();
  }, []);

  async function fetchProviders() {
    try {
      const response = await fetch("/api/providers");
      if (response.ok) {
        const data = await response.json();
        setProviders(data.providers);
        
        // Populate baseUrls from provider data (for Ollama)
        const urls: Record<string, string> = {};
        for (const provider of data.providers as Provider[]) {
          if (provider.baseUrl) {
            urls[provider.id] = provider.baseUrl;
          }
        }
        setBaseUrls((prev) => ({ ...prev, ...urls }));
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch providers",
        variant: "destructive",
      });
    }
  }

  async function fetchEnvDefaults() {
    try {
      const response = await fetch("/api/providers/env");
      if (response.ok) {
        const data = await response.json();
        // Pre-fill API keys and base URLs from environment variables
        const keys: Record<string, string> = {};
        const urls: Record<string, string> = {};
        
        for (const [providerId, defaults] of Object.entries(data.envDefaults as Record<string, { apiKey?: string; baseUrl?: string }>)) {
          if (defaults.apiKey) {
            keys[providerId] = defaults.apiKey;
          }
          if (defaults.baseUrl) {
            urls[providerId] = defaults.baseUrl;
          }
        }
        
        setApiKeys(keys);
        setBaseUrls(urls);
      }
    } catch (error) {
      // Silently fail - env vars are optional
      console.log("No env defaults found");
    }
  }

  async function updateProvider(providerId: string, enabled: boolean, apiKey?: string, baseUrl?: string) {
    setIsLoading((prev) => ({ ...prev, [providerId]: true }));
    try {
      // For Ollama, we store the baseUrl as the apiKey in the database
      const keyToStore = providerId === "ollama" ? (baseUrl || baseUrls[providerId]) : (apiKey || apiKeys[providerId]);
      
      const response = await fetch("/api/providers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerId, enabled, apiKey: keyToStore }),
      });

      if (response.ok) {
        fetchProviders();
        toast({
          title: "Success",
          description: `${providerId} ${enabled ? 'enabled' : 'disabled'}`,
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to update provider",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update provider",
        variant: "destructive",
      });
    } finally {
      setIsLoading((prev) => ({ ...prev, [providerId]: false }));
    }
  }

  function handleApiKeyChange(providerId: string, value: string) {
    setApiKeys((prev) => ({ ...prev, [providerId]: value }));
  }

  function handleBaseUrlChange(providerId: string, value: string) {
    setBaseUrls((prev) => ({ ...prev, [providerId]: value }));
  }

  function saveApiKey(providerId: string) {
    const key = apiKeys[providerId];
    if (key) {
      updateProvider(providerId, true, key);
      // Don't clear the input so user can see what's saved
    }
  }

  function saveBaseUrl(providerId: string) {
    const url = baseUrls[providerId];
    if (url) {
      updateProvider(providerId, true, undefined, url);
    }
  }

  const isOllama = (providerId: string) => providerId === "ollama";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Providers</h1>
        <p className="text-muted-foreground mt-2">
          Configure AI provider API keys to enable model access
        </p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Configure at least one provider to start using NodeHub. API keys from environment variables are pre-filled but can be changed.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4">
        {providers.map((provider) => (
          <Card key={provider.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Cloud className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle className="text-lg">{provider.name}</CardTitle>
                    <CardDescription>
                      {PROVIDER_INFO[provider.id]?.description}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-2">
                    {provider.apiKeySet && (
                      <Badge variant="outline" className="text-green-600">
                        <Check className="h-3 w-3 mr-1" />
                        Configured
                      </Badge>
                    )}
                    <Switch
                      checked={provider.enabled}
                      onCheckedChange={(checked) =>
                        updateProvider(provider.id, checked)
                      }
                      disabled={isLoading[provider.id] || (!provider.apiKeySet && PROVIDER_INFO[provider.id]?.requiresKey)}
                    />
                  </div>
                  {!provider.apiKeySet && PROVIDER_INFO[provider.id]?.requiresKey && (
                    <span className="text-xs text-muted-foreground">
                      Save {isOllama(provider.id) ? "Base URL" : "API key"} to enable
                    </span>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {provider.models.slice(0, 4).map((model) => (
                  <Badge key={model} variant="secondary" className="text-xs">
                    {model}
                  </Badge>
                ))}
                {provider.models.length > 4 && (
                  <Badge variant="secondary" className="text-xs">
                    +{provider.models.length - 4} more
                  </Badge>
                )}
              </div>

              {isOllama(provider.id) ? (
                // Ollama uses Base URL instead of API Key
                <div className="space-y-2">
                  <Label htmlFor={`url-${provider.id}`}>Base URL</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        id={`url-${provider.id}`}
                        type="text"
                        placeholder="http://localhost:11434"
                        value={baseUrls[provider.id] || ""}
                        onChange={(e) =>
                          handleBaseUrlChange(provider.id, e.target.value)
                        }
                      />
                    </div>
                    <Button
                      onClick={() => saveBaseUrl(provider.id)}
                      disabled={!baseUrls[provider.id] || isLoading[provider.id]}
                    >
                      {isLoading[provider.id] ? "Saving..." : "Save"}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Default: http://localhost:11434 (local Ollama instance)
                  </p>
                </div>
              ) : (
                // Other providers use API Key
                <div className="space-y-2">
                  <Label htmlFor={`key-${provider.id}`}>API Key</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        id={`key-${provider.id}`}
                        type={showKeys[provider.id] ? "text" : "password"}
                        placeholder={
                          provider.apiKeySet
                            ? "API key is set (from env or dashboard)"
                            : `Enter your ${provider.name} API key`
                        }
                        value={apiKeys[provider.id] || ""}
                        onChange={(e) =>
                          handleApiKeyChange(provider.id, e.target.value)
                        }
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() =>
                          setShowKeys((prev) => ({
                            ...prev,
                            [provider.id]: !prev[provider.id],
                          }))
                        }
                      >
                        {showKeys[provider.id] ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <Button
                      onClick={() => saveApiKey(provider.id)}
                      disabled={!apiKeys[provider.id] || isLoading[provider.id]}
                    >
                      {isLoading[provider.id] ? "Saving..." : "Save"}
                    </Button>
                  </div>
                </div>
              )}

              <a
                href={PROVIDER_INFO[provider.id]?.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
              >
                {isOllama(provider.id) ? (
                  <>
                    <Server className="mr-1 h-3 w-3" />
                    Learn more about Ollama
                  </>
                ) : (
                  <>
                    Get API key from {provider.name}
                    <ExternalLink className="ml-1 h-3 w-3" />
                  </>
                )}
              </a>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
