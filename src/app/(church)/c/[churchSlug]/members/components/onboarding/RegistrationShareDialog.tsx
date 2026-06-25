"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Copy, Check, Share, ExternalLink } from "lucide-react";
import { buildRegistrationUrl } from "@/features/member-registration/registration-key-utils";
import { rotateRegistrationKeyAction, enableRegistrationAction } from "@/features/member-registration/registration-key";

type RegistrationShareDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  churchSlug: string;
};

export function RegistrationShareDialog({ open, onOpenChange, churchSlug }: RegistrationShareDialogProps) {
  const [key, setKey] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) {
      setKey(null);
      return;
    }
    setLoading(true);
    setError(null);
    rotateRegistrationKeyAction(churchSlug)
      .then(result => {
        if (result.ok) {
          setKey(result.key);
          setEnabled(true);
        } else {
          setError(result.error);
        }
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : "Failed to load registration link.");
      })
      .finally(() => setLoading(false));
  }, [open, churchSlug]);

  const fullUrl = typeof window !== "undefined" && key
    ? `${window.location.origin}${buildRegistrationUrl(churchSlug, key)}`
    : "";

  const handleCopy = async () => {
    if (!fullUrl) return;
    await navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    if (!fullUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Join our church", url: fullUrl });
      } catch {
        // ignore cancellation
      }
    } else {
      await handleCopy();
    }
  };

  const toggleEnabled = async (checked: boolean) => {
    setEnabled(checked);
    await enableRegistrationAction(churchSlug, { isEnabled: checked });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Share registration form</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-xl border p-3">
            <div>
              <p className="text-sm font-medium">Public registration</p>
              <p className="text-xs text-muted-foreground">Allow people to submit via /join/{churchSlug}</p>
            </div>
            <Checkbox checked={enabled} onCheckedChange={c => toggleEnabled(c === true)} />
          </div>

          {loading && <p className="text-sm text-muted-foreground">Loading registration link...</p>}

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {!loading && key && (
            <>
              <div className="space-y-1.5">
                <Label>Reusable registration link</Label>
                <div className="flex gap-2">
                  <Input value={fullUrl} readOnly className="font-mono text-xs" />
                  <Button size="icon" variant="outline" onClick={handleCopy}>
                    {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  This link contains a secret key. Share it carefully. Rotating the key invalidates previous links.
                </p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 gap-2" onClick={handleNativeShare}>
                  <Share className="size-4" />
                  Share
                </Button>
                <Button variant="outline" className="flex-1 gap-2" asChild>
                  <a href={fullUrl} target="_blank" rel="noreferrer">
                    <ExternalLink className="size-4" />
                    Preview
                  </a>
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
