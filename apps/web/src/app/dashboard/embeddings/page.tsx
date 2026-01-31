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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
    Cpu,
    Cloud,
    Server,
    Check,
    AlertCircle,
    ExternalLink,
    Eye,
    EyeOff,
    Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

type EmbeddingProviderType = "local" | "ollama" | "huggingface-tei" | "openai";

interface EmbeddingConfig {
    provider: EmbeddingProviderType;
    baseUrl?: string;
    model?: string;
    dimensions?: number;
    isConfigured: boolean;
    enabled: boolean;
}

const PROVIDER_INFO: Record<
    EmbeddingProviderType,
    {
        name: string;
        description: string;
        icon: typeof Cpu;
        requiresKey: boolean;
        requiresUrl: boolean;
        defaultModel: string;
        defaultUrl: string;
        url: string;
    }
> = {
    local: {
        name: "Local Transformers",
        description: "In-process embeddings (free, no server needed)",
        icon: Cpu,
        requiresKey: false,
        requiresUrl: false,
        defaultModel: "Xenova/all-MiniLM-L6-v2",
        defaultUrl: "",
        url: "https://huggingface.co/Xenova/all-MiniLM-L6-v2",
    },
    ollama: {
        name: "Ollama",
        description: "Self-hosted embeddings (free, local)",
        icon: Server,
        requiresKey: false,
        requiresUrl: true,
        defaultModel: "nomic-embed-text",
        defaultUrl: "http://localhost:11434",
        url: "https://ollama.com",
    },
    "huggingface-tei": {
        name: "HuggingFace TEI",
        description: "Text Embeddings Inference server (free, self-hosted)",
        icon: Server,
        requiresKey: false,
        requiresUrl: true,
        defaultModel: "BAAI/bge-small-en-v1.5",
        defaultUrl: "http://localhost:8080",
        url: "https://huggingface.co/docs/text-embeddings-inference",
    },
    openai: {
        name: "OpenAI",
        description: "Cloud-based embeddings (requires API key)",
        icon: Cloud,
        requiresKey: true,
        requiresUrl: false,
        defaultModel: "text-embedding-3-small",
        defaultUrl: "",
        url: "https://platform.openai.com/docs/guides/embeddings",
    },
};

export default function EmbeddingsPage() {
    const [config, setConfig] = useState<EmbeddingConfig>({
        provider: "local",
        isConfigured: false,
        enabled: false,
    });
    const [apiKey, setApiKey] = useState("");
    const [baseUrl, setBaseUrl] = useState("");
    const [model, setModel] = useState("");
    const [showKey, setShowKey] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [testResult, setTestResult] = useState<{
        success: boolean;
        dimensions?: number;
        latencyMs?: number;
        error?: string;
    } | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        fetchConfig();
    }, []);

    async function fetchConfig() {
        setIsLoading(true);
        try {
            const response = await fetch("/api/embeddings/config");
            if (response.ok) {
                const data = await response.json();
                setConfig(data);
                setBaseUrl(data.baseUrl || "");
                setModel(data.model || "");
            }
        } catch (error) {
            console.error("Failed to fetch embedding config:", error);
        } finally {
            setIsLoading(false);
        }
    }

    async function saveConfig() {
        setIsSaving(true);
        try {
            const selectedInfo = PROVIDER_INFO[config.provider];
            const response = await fetch("/api/embeddings/config", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    provider: config.provider,
                    apiKey: apiKey || undefined,
                    baseUrl: baseUrl || selectedInfo.defaultUrl || undefined,
                    model: model || selectedInfo.defaultModel,
                    enabled: true,
                }),
            });

            if (response.ok) {
                toast({
                    title: "Success",
                    description: "Embedding provider configuration saved",
                });
                setApiKey("");
                fetchConfig();
            } else {
                throw new Error("Failed to save");
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to save embedding configuration",
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    }

    async function testConnection() {
        setIsTesting(true);
        setTestResult(null);
        const startTime = Date.now();

        try {
            const selectedInfo = PROVIDER_INFO[config.provider];
            const response = await fetch("/api/embeddings/test", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    provider: config.provider,
                    apiKey: apiKey || undefined,
                    baseUrl: baseUrl || selectedInfo.defaultUrl || undefined,
                    model: model || selectedInfo.defaultModel,
                }),
            });

            const data = await response.json();
            const latencyMs = Date.now() - startTime;

            if (data.success) {
                setTestResult({
                    success: true,
                    dimensions: data.dimensions,
                    latencyMs,
                });
                toast({
                    title: "Connection Successful",
                    description: `Generated test embedding: ${data.dimensions} dimensions in ${latencyMs}ms`,
                });
            } else {
                setTestResult({
                    success: false,
                    error: data.error || "Connection failed",
                });
                toast({
                    title: "Connection Failed",
                    description: data.error || "Could not connect to embedding provider",
                    variant: "destructive",
                });
            }
        } catch (error: any) {
            setTestResult({
                success: false,
                error: error.message || "Connection failed",
            });
            toast({
                title: "Connection Failed",
                description: error.message || "Could not connect to embedding provider",
                variant: "destructive",
            });
        } finally {
            setIsTesting(false);
        }
    }

    function handleProviderChange(value: string) {
        setConfig({ ...config, provider: value as EmbeddingProviderType });
        setTestResult(null);
        // Reset fields when changing provider
        const info = PROVIDER_INFO[value as EmbeddingProviderType];
        setBaseUrl(info.defaultUrl);
        setModel(info.defaultModel);
        setApiKey("");
    }

    const selectedInfo = PROVIDER_INFO[config.provider];
    const Icon = selectedInfo.icon;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Embedding Provider</h1>
                <p className="text-muted-foreground mt-2">
                    Configure the embedding provider for semantic caching
                </p>
            </div>

            <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                    Embedding providers generate vector representations of queries for
                    semantic matching. This is <strong>separate</strong> from your model
                    providers (for chat completions). Default: Local Transformers (no API
                    key required).
                </AlertDescription>
            </Alert>

            <Card>
                <CardHeader>
                    <CardTitle>Select Provider</CardTitle>
                    <CardDescription>
                        Choose how to generate embeddings for semantic caching
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <RadioGroup
                        value={config.provider}
                        onValueChange={handleProviderChange}
                        className="grid gap-4 md:grid-cols-2"
                    >
                        {(Object.keys(PROVIDER_INFO) as EmbeddingProviderType[]).map(
                            (key) => {
                                const info = PROVIDER_INFO[key];
                                const ProviderIcon = info.icon;
                                return (
                                    <div key={key} className="relative">
                                        <RadioGroupItem
                                            value={key}
                                            id={key}
                                            className="peer sr-only"
                                        />
                                        <Label
                                            htmlFor={key}
                                            className="flex flex-col items-start gap-2 rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                                        >
                                            <div className="flex items-center gap-2">
                                                <ProviderIcon className="h-5 w-5" />
                                                <span className="font-semibold">{info.name}</span>
                                                {key === "local" && (
                                                    <Badge variant="secondary" className="text-xs">
                                                        Default
                                                    </Badge>
                                                )}
                                            </div>
                                            <span className="text-sm text-muted-foreground">
                                                {info.description}
                                            </span>
                                        </Label>
                                    </div>
                                );
                            }
                        )}
                    </RadioGroup>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Icon className="h-5 w-5" />
                            <div>
                                <CardTitle>{selectedInfo.name} Configuration</CardTitle>
                                <CardDescription>{selectedInfo.description}</CardDescription>
                            </div>
                        </div>
                        {config.isConfigured && config.provider === config.provider && (
                            <Badge variant="outline" className="text-green-600">
                                <Check className="h-3 w-3 mr-1" />
                                Configured
                            </Badge>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {selectedInfo.requiresKey && (
                        <div className="space-y-2">
                            <Label htmlFor="api-key">API Key</Label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Input
                                        id="api-key"
                                        type={showKey ? "text" : "password"}
                                        placeholder={
                                            config.isConfigured
                                                ? "API key is configured"
                                                : "Enter your API key"
                                        }
                                        value={apiKey}
                                        onChange={(e) => setApiKey(e.target.value)}
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="absolute right-0 top-0 h-full px-3"
                                        onClick={() => setShowKey(!showKey)}
                                    >
                                        {showKey ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {selectedInfo.requiresUrl && (
                        <div className="space-y-2">
                            <Label htmlFor="base-url">Base URL</Label>
                            <Input
                                id="base-url"
                                type="text"
                                placeholder={selectedInfo.defaultUrl}
                                value={baseUrl}
                                onChange={(e) => setBaseUrl(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                                Default: {selectedInfo.defaultUrl}
                            </p>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="model">Model</Label>
                        <Input
                            id="model"
                            type="text"
                            placeholder={selectedInfo.defaultModel}
                            value={model}
                            onChange={(e) => setModel(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                            Default: {selectedInfo.defaultModel}
                        </p>
                    </div>

                    {testResult && (
                        <div
                            className={`p-4 rounded-lg ${testResult.success
                                    ? "bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800"
                                    : "bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800"
                                }`}
                        >
                            {testResult.success ? (
                                <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                                    <Check className="h-4 w-4" />
                                    <span>
                                        Success! {testResult.dimensions} dimensions,{" "}
                                        {testResult.latencyMs}ms latency
                                    </span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                                    <AlertCircle className="h-4 w-4" />
                                    <span>Failed: {testResult.error}</span>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex gap-2 pt-4">
                        <Button
                            variant="outline"
                            onClick={testConnection}
                            disabled={isTesting}
                        >
                            {isTesting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Testing...
                                </>
                            ) : (
                                "Test Connection"
                            )}
                        </Button>
                        <Button onClick={saveConfig} disabled={isSaving}>
                            {isSaving ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                "Save Configuration"
                            )}
                        </Button>
                    </div>

                    <a
                        href={selectedInfo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
                    >
                        Learn more about {selectedInfo.name}
                        <ExternalLink className="ml-1 h-3 w-3" />
                    </a>
                </CardContent>
            </Card>

            {config.provider === "local" && (
                <Alert>
                    <Cpu className="h-4 w-4" />
                    <AlertDescription>
                        <strong>Note:</strong> The first request with Local Transformers may
                        take 20-30 seconds as it downloads the model (~90MB). Subsequent
                        requests will be fast.
                    </AlertDescription>
                </Alert>
            )}
        </div>
    );
}
