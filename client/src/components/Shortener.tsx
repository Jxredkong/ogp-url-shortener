import { useEffect, useState, useCallback } from "react";
import { Link2, Loader2, Copy, Check, ExternalLink, MousePointerClick, LogOut, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiError, clearToken, listRecent, shortenUrl, type LinkDto } from "@/lib/api";

interface Props {
  onSignOut: () => void;
}

export default function Shortener({ onSignOut }: Props) {
  const [url, setUrl] = useState("");
  const [reuse, setReuse] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<LinkDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recent, setRecent] = useState<LinkDto[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const refreshRecent = useCallback(async () => {
    setLoadingRecent(true);
    try {
      const links = await listRecent();
      setRecent(links);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        onSignOut();
        return;
      }
    } finally {
      setLoadingRecent(false);
    }
  }, [onSignOut]);

  useEffect(() => {
    refreshRecent();
  }, [refreshRecent]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setError(null);
    setSubmitting(true);
    try {
      const link = await shortenUrl(url.trim(), reuse);
      setResult(link);
      setUrl("");
      await refreshRecent();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        onSignOut();
        return;
      }
      const msg = err instanceof ApiError ? err.message : "Something went wrong";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const copy = async (link: LinkDto) => {
    await navigator.clipboard.writeText(link.shortUrl);
    setCopiedCode(link.shortCode);
    setTimeout(() => setCopiedCode((c) => (c === link.shortCode ? null : c)), 2000);
  };

  const signOut = () => {
    clearToken();
    onSignOut();
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 py-10 sm:py-14">
      <header className="mb-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-md">
            <Link2 className="h-5 w-5" />
          </span>
          <span className="text-sm font-semibold uppercase tracking-wider text-foreground/80">
            OGP URL Shortener
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={signOut} className="text-muted-foreground">
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </header>

      <section className="mb-8 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          Fast, simple, deterministic
        </div>
        <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">
          Turn long URLs into{" "}
          <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            short links
          </span>
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-pretty text-muted-foreground">
          Paste any http(s) URL and get back a short, shareable link. Click counts and the ten most recent links live below.
        </p>
      </section>

      <Card className="mb-8">
        <CardContent className="p-6">
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="url">Long URL</Label>
              <Input
                id="url"
                type="url"
                placeholder="https://open.gov.sg/products"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={submitting}
                required
                autoFocus
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <label className="flex cursor-pointer select-none items-center gap-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={reuse}
                  onChange={(e) => setReuse(e.target.checked)}
                  className="h-4 w-4 rounded border-input accent-primary"
                />
                Reuse existing code if this URL was shortened before
              </label>
              <Button type="submit" disabled={!url.trim() || submitting} size="lg">
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Shortening...
                  </>
                ) : (
                  <>Shorten</>
                )}
              </Button>
            </div>
            {error && (
              <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}
          </form>
        </CardContent>
      </Card>

      {result && (
        <Card className="mb-10 border-primary/40">
          <CardHeader className="pb-3">
            <CardDescription>Your short link</CardDescription>
            <CardTitle className="break-all font-mono text-xl text-primary">
              {result.shortUrl}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="break-all text-sm text-muted-foreground">
              {"-> "}<span className="text-foreground/80">{result.originalUrl}</span>
            </p>
            <div className="flex shrink-0 gap-2">
              <Button variant="outline" size="sm" onClick={() => copy(result)}>
                {copiedCode === result.shortCode ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy
                  </>
                )}
              </Button>
              <Button asChild variant="outline" size="sm">
                <a href={result.shortUrl} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  Open
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Recent links
          </h2>
          {!loadingRecent && recent.length > 0 && (
            <span className="text-xs text-muted-foreground">{recent.length} most recent</span>
          )}
        </div>
        <Card>
          <CardContent className="p-0">
            {loadingRecent ? (
              <div className="flex items-center justify-center p-10 text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </div>
            ) : recent.length === 0 ? (
              <div className="p-10 text-center text-sm text-muted-foreground">
                No links yet. Shorten one above to get started.
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {recent.map((link) => (
                  <li key={link.shortCode} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:gap-4">
                    <div className="min-w-0 flex-1">
                      <a
                        href={link.shortUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="block truncate font-mono text-sm font-semibold text-primary hover:underline"
                      >
                        {link.shortUrl}
                      </a>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">{link.originalUrl}</p>
                    </div>
                    <div className="flex items-center gap-3 sm:gap-4">
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <MousePointerClick className="h-3.5 w-3.5" />
                        {link.clickCount} {link.clickCount === 1 ? "click" : "clicks"}
                      </span>
                      <Button variant="ghost" size="sm" onClick={() => copy(link)}>
                        {copiedCode === link.shortCode ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>

      <footer className="mt-12 text-center text-xs text-muted-foreground">
        Built for the OGP SWE Intern take-home assessment.
      </footer>
    </div>
  );
}
