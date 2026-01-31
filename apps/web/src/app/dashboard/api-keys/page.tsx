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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Key, Copy, Trash2, AlertCircle, Check, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ApiKey {
  id: string;
  name: string;
  keyPreview: string;
  createdAt: string;
  lastUsedAt: string | null;
  isActive: boolean;
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [newKeyName, setNewKeyName] = useState("");
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [deletingKeyId, setDeletingKeyId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchKeys();
  }, []);

  async function fetchKeys() {
    try {
      const response = await fetch("/api/keys");
      if (response.ok) {
        const data = await response.json();
        // Filter to only show active keys
        const activeKeys = data.keys.filter((key: ApiKey) => key.isActive !== false);
        setKeys(activeKeys);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch API keys",
        variant: "destructive",
      });
    }
  }

  async function createKey(e: React.FormEvent) {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName }),
      });

      const data = await response.json();

      if (response.ok) {
        setCreatedKey(data.key);
        setNewKeyName("");
        setIsDialogOpen(false);
        fetchKeys();
        toast({
          title: "Success",
          description: "API key created successfully",
        });
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to create API key",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create API key",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function deleteKey(id: string) {
    setDeletingKeyId(id);

    // Store the key being deleted for potential restoration
    const keyToDelete = keys.find((key) => key.id === id);

    // Optimistically remove the key from the array
    setKeys(keys.filter((key) => key.id !== id));

    try {
      const response = await fetch(`/api/keys/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "API key deleted successfully",
        });
      } else {
        // Restore the key if deletion failed
        if (keyToDelete) {
          setKeys((prev) => [...prev, keyToDelete]);
        }
        toast({
          title: "Error",
          description: "Failed to delete API key",
          variant: "destructive",
        });
      }
    } catch (error) {
      // Restore the key if deletion failed
      if (keyToDelete) {
        setKeys((prev) => [...prev, keyToDelete]);
      }
      toast({
        title: "Error",
        description: "Failed to delete API key",
        variant: "destructive",
      });
    } finally {
      setDeletingKeyId(null);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Copied",
      description: "API key copied to clipboard",
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">API Keys</h1>
        <p className="text-muted-foreground mt-2">
          Manage your API keys for accessing NodeHub
        </p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Community Edition allows only 1 API key. Upgrade to Full Edition for unlimited keys.
        </AlertDescription>
      </Alert>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button disabled={keys.length >= 1}>
            <Key className="mr-2 h-4 w-4" />
            Create New API Key
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create API Key</DialogTitle>
            <DialogDescription>
              Give your API key a name to help you identify it later.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={createKey}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Key Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Production Key"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isLoading || !newKeyName.trim()}>
                {isLoading ? "Creating..." : "Create Key"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {createdKey && (
        <Card className="border-yellow-500">
          <CardHeader>
            <CardTitle className="text-yellow-600">New API Key Created</CardTitle>
            <CardDescription>
              Copy this key now. You won&apos;t be able to see it again!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-muted p-3 rounded text-sm break-all">
                {createdKey}
              </code>
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(createdKey)}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <Button
              className="mt-4"
              variant="outline"
              onClick={() => setCreatedKey(null)}
            >
              I&apos;ve copied the key
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {keys.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Key className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No API keys created yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Create your first API key to start using NodeHub
              </p>
            </CardContent>
          </Card>
        ) : (
          keys.map((key) => (
            <Card key={key.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{key.name}</CardTitle>
                    <CardDescription>
                      Created {new Date(key.createdAt).toLocaleDateString()}
                      {key.lastUsedAt && (
                        <span className="ml-2">
                          • Last used {new Date(key.lastUsedAt).toLocaleDateString()}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteKey(key.id)}
                    disabled={deletingKeyId === key.id}
                  >
                    {deletingKeyId === key.id ? (
                      <>
                        <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Revoking...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-1" />
                        Revoke
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <code className="text-sm text-muted-foreground">
                  {key.keyPreview}
                </code>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
