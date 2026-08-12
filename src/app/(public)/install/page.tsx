import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, Church, Home, MoreVertical, Share2, Smartphone } from "lucide-react";

export const metadata: Metadata = {
  title: "Install My Church App",
  description: "Install the MPG Church Member Portal on iPhone, iPad, and Android.",
};

const androidSteps = [
  "Open the member portal in Chrome",
  "Tap Install App or the menu",
  "Tap Add to Home screen or Install App",
  "Confirm installation",
];

const iosSteps = [
  "Open the member portal in Safari",
  "Tap Share",
  "Tap Add to Home Screen",
  "Tap Add",
];

function InstallSteps({
  title,
  description,
  steps,
  icon,
}: {
  title: string;
  description: string;
  steps: string[];
  icon: ReactNode;
}) {
  return (
    <section className="rounded-[22px] border border-amber-100 bg-white p-5 shadow-sm shadow-amber-950/5">
      <div className="flex items-start gap-3">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-950">
          {icon}
        </div>
        <div>
          <h2 className="text-lg font-semibold text-emerald-950">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
        </div>
      </div>
      <ol className="mt-4 flex flex-col gap-3">
        {steps.map((step, index) => (
          <li key={step} className="flex items-center gap-3 rounded-2xl bg-amber-50/70 px-3 py-3 text-sm text-slate-700">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-950 text-xs font-semibold text-white">
              {index + 1}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

export default function InstallPage() {
  return (
    <main className="min-h-screen bg-[#fffaf0] px-4 py-5 text-slate-900">
      <div className="mx-auto flex w-full max-w-md flex-col gap-5">
        <header className="flex items-center gap-3">
          <Link
            href="/app"
            className="mobile-touch-feedback flex size-10 items-center justify-center rounded-full bg-white text-emerald-950 shadow-sm"
            aria-label="Back to app"
          >
            <ArrowLeft className="size-5" />
          </Link>
          <div className="flex size-11 items-center justify-center rounded-full bg-emerald-950 text-amber-300">
            <Church className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
              MPG Church
            </p>
            <h1 className="truncate text-xl font-semibold text-emerald-950">Install My Church</h1>
          </div>
        </header>

        <section className="rounded-[28px] border border-amber-100 bg-white p-5 shadow-sm shadow-amber-950/5">
          <div className="flex items-start gap-3">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-emerald-950 text-amber-300">
              <Smartphone className="size-7" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-emerald-950">Keep your church close</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Add the member portal to your home screen for fast access to duties, events, giving,
                attendance, and profile details.
              </p>
            </div>
          </div>
        </section>

        <InstallSteps
          title="Install on Android"
          description="Chrome, Edge, and Samsung Internet can install the portal from the browser menu."
          steps={androidSteps}
          icon={<MoreVertical className="size-6" />}
        />

        <InstallSteps
          title="Install on iPhone"
          description="Safari uses Add to Home Screen from the Share sheet."
          steps={iosSteps}
          icon={<Share2 className="size-6" />}
        />

        <Link
          href="/app"
          className="mobile-touch-feedback flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-950 px-4 text-sm font-semibold text-white shadow-sm"
        >
          <Home className="size-4" />
          Open My Church
        </Link>

        <p className="pb-6 text-center text-xs leading-5 text-slate-500">
          Install prompts normally require HTTPS in production. Localhost can be used for testing.
        </p>
      </div>
    </main>
  );
}
