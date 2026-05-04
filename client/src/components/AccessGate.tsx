import { useState } from "react";
import { Lock, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { authenticate, ApiError } from "@/lib/api";

interface Props {
  onAuthenticated: () => void;
}

export default function AccessGate({ onAuthenticated }: Props) {
  const [accessKey, setAccessKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessKey.trim()) return;
    setError(null);
    setLoading(true);
    try {
      await authenticate(accessKey.trim());
      onAuthenticated();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Authentication failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Lock className="h-5 w-5" />
            </div>
            <CardTitle className="text-2xl">Access required</CardTitle>
            <CardDescription>
              Enter your access key to use the URL shortener.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="access-key">Access key</Label>
                <Input
                  id="access-key"
                  type="password"
                  placeholder="•••••••••••••"
                  value={accessKey}
                  onChange={(e) => setAccessKey(e.target.value)}
                  autoFocus
                  disabled={loading}
                  required
                />
              </div>
              {error && (
                <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}
              <Button type="submit" className="w-full" disabled={!accessKey.trim() || loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    Unlock
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
            <p className="mt-6 text-center text-xs text-muted-foreground">
              Short links you create are public; this gate only protects creation and the dashboard.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
