"use client";

import { forwardRef } from "react";
import {
  BookOpenCheck,
  Camera,
  ClipboardList,
  Heart,
  LockKeyhole,
  Phone,
  QrCode,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

export type AttendanceQrPosterType = "sabbath" | "activity" | "group" | "event" | "online";

export type AttendanceQrPosterProps = {
  churchName: string;
  churchLogoUrl?: string | null;
  churchSubtitle?: string | null;
  title?: string;
  subtitle?: string;
  message?: string;
  qrValue: string;
  qrImageUrl?: string | null;
  qrType?: AttendanceQrPosterType;
  activityName?: string | null;
  instructions?: string[];
  helpNote?: string;
  privacyNote?: string;
  blessingText?: string;
  className?: string;
};

const posterDefaults: Record<AttendanceQrPosterType, { title: string; subtitle: string; message: string }> = {
  sabbath: {
    title: "Sabbath Attendance",
    subtitle: "Happy Sabbath!",
    message:
      "Members and visitors are welcome. Please scan the QR code below to record your attendance for today’s worship.",
  },
  activity: {
    title: "Activity Attendance",
    subtitle: "Welcome",
    message: "Please scan the QR code below to record your attendance for this activity.",
  },
  group: {
    title: "Small Group Attendance",
    subtitle: "Welcome",
    message: "Please scan the QR code below to record your attendance for this small group.",
  },
  event: {
    title: "Event Attendance",
    subtitle: "Welcome",
    message: "Please scan the QR code below to record your attendance for this event.",
  },
  online: {
    title: "Online Program Attendance",
    subtitle: "Welcome",
    message: "Please scan the QR code below to record your attendance for this online program.",
  },
};

const defaultInstructions = [
  "Open your phone camera",
  "Scan the QR code",
  "Follow the attendance prompts on your phone",
];

const instructionIcons = [Camera, QrCode, ClipboardList];

function splitMessage(message: string) {
  const firstSentence = message.match(/^[^.?!]+[.?!]/)?.[0];
  if (!firstSentence) return { lead: null, rest: message };
  return { lead: firstSentence, rest: message.slice(firstSentence.length).trim() };
}

export const AttendanceQrPoster = forwardRef<HTMLDivElement, AttendanceQrPosterProps>(
  (
    {
      churchName,
      churchLogoUrl,
      churchSubtitle = "Seventh-day Adventist Church",
      title,
      subtitle,
      message,
      qrValue,
      qrImageUrl,
      qrType = "sabbath",
      activityName,
      instructions = defaultInstructions,
      helpNote = "Need help? Please speak with the deacon, usher, or church office.",
      privacyNote = "Your information is used only for church attendance and follow-up.",
      blessingText = "Thank you and God bless your worship today!",
      className,
    },
    ref
  ) => {
    const defaults = posterDefaults[qrType];
    const posterTitle = activityName || title || defaults.title;
    const posterSubtitle = subtitle || defaults.subtitle;
    const posterMessage = message || defaults.message;
    const { lead, rest } = splitMessage(posterMessage);

    return (
      <section
        ref={ref}
        className={cn(
          "attendance-qr-poster relative mx-auto flex aspect-[210/297] w-full max-w-[794px] flex-col overflow-hidden rounded-[22px] border border-[#d8c08a] bg-[#fffaf0] text-[#242424] shadow-xl",
          className
        )}
        aria-label={`${posterTitle} poster`}
      >
        <div className="absolute -top-[88px] left-1/2 h-[170px] w-[112%] -translate-x-1/2 rounded-b-[50%] bg-[#064b32]" />
        <div className="absolute -top-[70px] left-1/2 h-[152px] w-[108%] -translate-x-1/2 rounded-b-[50%] border-b-[10px] border-[#bf8f22]" />

        <div className="relative flex flex-1 flex-col px-[74px] pb-[34px] pt-[62px]">
          <header className="flex items-center justify-center gap-5 text-center">
            <div className="flex size-[76px] shrink-0 items-center justify-center rounded-2xl bg-white/85 p-2 shadow-sm">
              {churchLogoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={churchLogoUrl}
                  alt=""
                  crossOrigin="anonymous"
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <BookOpenCheck className="size-12 text-[#064b32]" aria-hidden="true" />
              )}
            </div>
            <div className="min-w-0 text-left">
              <p className="truncate text-[42px] font-semibold leading-none tracking-normal text-[#064b32]">
                {churchName}
              </p>
              {churchSubtitle ? (
                <p className="mt-2 text-[19px] font-medium uppercase tracking-[0.14em] text-[#223b31]">
                  {churchSubtitle}
                </p>
              ) : null}
            </div>
          </header>

          <div className="mt-8 flex items-center justify-center gap-8 text-[#bf8f22]">
            <div className="h-px w-[170px] bg-[#c8a45a]" />
            <div className="size-3 rotate-45 bg-[#bf8f22]" />
            <div className="h-px w-[170px] bg-[#c8a45a]" />
          </div>

          <div className="mt-7 text-center">
            <h1 className="text-[66px] font-semibold leading-none tracking-normal text-[#064b32]">
              {posterTitle}
            </h1>
            <div className="mt-4 flex items-center justify-center gap-5 text-[#bf8f22]">
              <Sparkles className="size-8" aria-hidden="true" />
              <p className="text-[40px] font-medium italic leading-none tracking-normal">{posterSubtitle}</p>
              <Sparkles className="size-8" aria-hidden="true" />
            </div>
            {lead ? <p className="mt-4 text-[23px] font-medium text-[#2f3033]">{lead}</p> : null}
            <p className="mx-auto mt-5 max-w-[610px] text-[25px] font-medium leading-[1.25] text-[#2f3033]">
              {rest || posterMessage}
            </p>
          </div>

          <div className="mt-6 flex justify-center">
            <div className="rounded-[22px] bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.18)]">
              <div className="flex flex-col items-center gap-4">
                <div className="rounded-xl bg-white p-2">
                  {qrImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={qrImageUrl}
                      alt="Attendance QR code"
                      className="size-[270px] object-contain"
                    />
                  ) : (
                    <div className="flex size-[270px] items-center justify-center border border-dashed border-[#8f8a7b] bg-white p-5 text-center font-mono text-xs leading-5 text-[#2f3033]">
                      {qrValue}
                    </div>
                  )}
                </div>
                <div className="inline-flex h-14 min-w-[230px] items-center justify-center gap-4 rounded-full bg-[#064b32] px-8 text-[25px] font-semibold text-white shadow-sm">
                  <Phone className="size-8" aria-hidden="true" />
                  Scan here
                </div>
              </div>
            </div>
          </div>

          <div className="relative mt-7 rounded-2xl border border-[#223b31] bg-white/82 px-8 pb-5 pt-7">
            <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#064b32] px-11 py-2 text-[17px] font-bold uppercase tracking-[0.08em] text-white">
              How to use
            </div>
            <div className="grid grid-cols-3 divide-x divide-[#cfc8b8]">
              {instructions.slice(0, 3).map((instruction, index) => {
                const Icon = instructionIcons[index] ?? ClipboardList;
                return (
                  <div key={instruction} className="flex items-center justify-center gap-4 px-5">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#064b32] text-[18px] font-bold text-white">
                      {index + 1}
                    </div>
                    <Icon className="size-12 shrink-0 text-[#064b32]" aria-hidden="true" />
                    <p className="text-[17px] font-medium leading-[1.16] text-[#242424]">{instruction}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-7 flex items-center gap-8 rounded-2xl bg-[#f0efe7] px-9 py-6">
            <Heart className="size-16 shrink-0 text-[#064b32]" aria-hidden="true" />
            <div>
              <p className="text-[23px] font-bold text-[#064b32]">Need help?</p>
              <p className="mt-1 text-[20px] font-medium leading-[1.25] text-[#242424]">
                {helpNote.replace(/^Need help\?\s*/i, "")}
              </p>
            </div>
          </div>
        </div>

        <footer className="grid h-[112px] grid-cols-[1fr_108px_1fr] items-center border-t-[4px] border-[#bf8f22] bg-[#064b32] px-10 text-white">
          <div className="flex items-center gap-4">
            <ShieldCheck className="size-10 shrink-0 text-[#d0a138]" aria-hidden="true" />
            <p className="text-[16px] font-medium leading-[1.28]">{privacyNote}</p>
          </div>
          <div className="mx-auto flex size-[92px] items-center justify-center rounded-full border border-[#e8d8ad] bg-white text-[#bf8f22] shadow-lg">
            <BookOpenCheck className="size-14" aria-hidden="true" />
          </div>
          <div className="flex items-center justify-end gap-4 text-right">
            <p className="max-w-[270px] text-[23px] font-medium italic leading-[1.15]">{blessingText}</p>
            <LockKeyhole className="size-10 shrink-0 text-[#d0a138]" aria-hidden="true" />
          </div>
        </footer>
      </section>
    );
  }
);

AttendanceQrPoster.displayName = "AttendanceQrPoster";
