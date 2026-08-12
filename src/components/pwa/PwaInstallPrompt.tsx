"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Download, MoreVertical, Share2, Smartphone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

type InstallPlatform = "android" | "ios" | "prompt" | "unsupported";

type PwaInstallPromptProps = {
  variant?: "member-portal";
  className?: string;
};

const DISMISSED_KEY = "mpg-member-portal-install-dismissed-at";
const DISMISS_WINDOW_MS = 1000 * 60 * 60 * 24 * 14;

function isStandaloneMode() {
  const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean };

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    navigatorWithStandalone.standalone === true
  );
}

function hasRecentDismissal() {
  const dismissedAt = Number(window.localStorage.getItem(DISMISSED_KEY) ?? 0);

  return Number.isFinite(dismissedAt) && Date.now() - dismissedAt < DISMISS_WINDOW_MS;
}

function detectPlatform(): InstallPlatform {
  const userAgent = navigator.userAgent.toLowerCase();
  const platform = navigator.platform.toLowerCase();
  const isIpadOs = platform === "macintel" && navigator.maxTouchPoints > 1;

  if (/iphone|ipad|ipod/.test(userAgent) || isIpadOs) return "ios";
  if (/android/.test(userAgent)) return "android";

  return "unsupported";
}

export function PwaInstallPrompt({ className }: PwaInstallPromptProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [platform, setPlatform] = useState<InstallPlatform>("unsupported");
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isStandaloneMode() || hasRecentDismissal()) {
      return;
    }

    const detectedPlatform = detectPlatform();
    setPlatform(detectedPlatform);

    if (detectedPlatform === "ios" || detectedPlatform === "android") {
      setIsVisible(true);
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setPlatform("prompt");
      setIsVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setIsVisible(false);
  }

  function dismiss() {
    window.localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    setIsVisible(false);
  }

  if (!isVisible) return null;

  const canPrompt = Boolean(deferredPrompt);
  const isIos = platform === "ios";

  return (
    <section
      className={cn(
        "mobile-fade-up flex flex-col gap-3 rounded-[22px] border border-amber-100 bg-white p-4 shadow-sm shadow-amber-950/5 lg:hidden",
        className
      )}
      aria-label="Install My Church App"
    >
      <div className="flex items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-emerald-950 text-amber-300">
          <Smartphone className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold text-emerald-950">Install My Church App</p>
              <p className="mt-1 text-sm leading-5 text-slate-600">
                Open your member portal from your home screen for faster access to duties, events,
                giving, and profile details.
              </p>
            </div>
            <button
              type="button"
              onClick={dismiss}
              className="mobile-touch-feedback flex size-9 shrink-0 items-center justify-center rounded-full text-slate-500 hover:bg-amber-50 hover:text-emerald-950"
              aria-label="Dismiss install prompt"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {canPrompt ? (
        <Button
          type="button"
          onClick={handleInstall}
          className="min-h-11 rounded-2xl bg-emerald-950 text-white hover:bg-emerald-900"
        >
          <Download className="mr-2 size-4" />
          Install App
        </Button>
      ) : isIos ? (
        <div className="rounded-2xl bg-amber-50/80 p-3 text-sm text-slate-700">
          <p className="mb-2 font-medium text-emerald-950">Install on iPhone</p>
          <ol className="flex flex-col gap-2">
            <li className="flex gap-2">
              <Share2 className="mt-0.5 size-4 shrink-0 text-emerald-900" />
              <span>Tap the Share button</span>
            </li>
            <li className="flex gap-2">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-900" />
              <span>{"Scroll and tap \"Add to Home Screen\""}</span>
            </li>
            <li className="flex gap-2">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-900" />
              <span>{"Tap \"Add\""}</span>
            </li>
          </ol>
        </div>
      ) : (
        <div className="rounded-2xl bg-amber-50/80 p-3 text-sm text-slate-700">
          <p className="mb-2 font-medium text-emerald-950">Install on Android</p>
          <ol className="flex flex-col gap-2">
            <li className="flex gap-2">
              <MoreVertical className="mt-0.5 size-4 shrink-0 text-emerald-900" />
              <span>Open Chrome menu</span>
            </li>
            <li className="flex gap-2">
              <Download className="mt-0.5 size-4 shrink-0 text-emerald-900" />
              <span>{"Tap \"Install app\" or \"Add to Home screen\""}</span>
            </li>
            <li className="flex gap-2">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-900" />
              <span>Confirm installation</span>
            </li>
          </ol>
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <Link href="/install" className="text-xs font-medium text-emerald-900">
          Need help installing?
        </Link>
        <button
          type="button"
          onClick={dismiss}
          className="mobile-touch-feedback min-h-9 rounded-xl px-3 text-xs font-medium text-slate-500 hover:bg-amber-50 hover:text-emerald-950"
        >
          Maybe later
        </button>
      </div>
    </section>
  );
}
