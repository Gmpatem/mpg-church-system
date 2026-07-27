"use client";

import { useRef, useState } from "react";
import { Copy, FileDown, ImageDown, Printer } from "lucide-react";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { AttendanceQrPoster, type AttendanceQrPosterProps } from "./AttendanceQrPoster";
import { AttendanceQrPosterPreview } from "./AttendanceQrPosterPreview";

type PendingAction = "pdf" | "png" | "print" | "copy" | null;

interface AttendanceQrExportActionsProps {
  posterProps: AttendanceQrPosterProps;
  fileBaseName: string;
  attendanceLink: string;
  className?: string;
}

function sanitizeFileName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90) || "attendance-qr-poster";
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export function AttendanceQrExportActions({
  posterProps,
  fileBaseName,
  attendanceLink,
  className,
}: AttendanceQrExportActionsProps) {
  const posterRef = useRef<HTMLDivElement>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [copied, setCopied] = useState(false);
  const safeFileBaseName = sanitizeFileName(fileBaseName);

  async function renderPosterPng() {
    if (!posterRef.current) throw new Error("Poster is not ready yet.");

    return toPng(posterRef.current, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: "#fffaf0",
      width: posterRef.current.offsetWidth,
      height: posterRef.current.offsetHeight,
      style: {
        transform: "none",
      },
    });
  }

  async function handleCopy() {
    try {
      setPendingAction("copy");
      await navigator.clipboard.writeText(attendanceLink);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } finally {
      setPendingAction(null);
    }
  }

  function handlePrint() {
    setPendingAction("print");
    document.body.classList.add("printing-attendance-poster");

    const cleanup = () => {
      document.body.classList.remove("printing-attendance-poster");
      window.removeEventListener("afterprint", cleanup);
      setPendingAction(null);
    };

    window.addEventListener("afterprint", cleanup);
    window.setTimeout(() => window.print(), 50);
    window.setTimeout(cleanup, 1500);
  }

  async function handleDownloadPng() {
    try {
      setPendingAction("png");
      const dataUrl = await renderPosterPng();
      downloadDataUrl(dataUrl, `${safeFileBaseName}.png`);
    } finally {
      setPendingAction(null);
    }
  }

  async function handleDownloadPdf() {
    try {
      setPendingAction("pdf");
      const dataUrl = await renderPosterPng();
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
      });

      pdf.addImage(dataUrl, "PNG", 0, 0, 210, 297, undefined, "FAST");
      pdf.save(`${safeFileBaseName}.pdf`);
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <>
      <div className={cn("no-print flex flex-wrap gap-2", className)}>
        <AttendanceQrPosterPreview
          posterProps={posterProps}
          onPrint={handlePrint}
          onDownloadPdf={handleDownloadPdf}
          onDownloadPng={handleDownloadPng}
          pendingAction={pendingAction === "copy" ? null : pendingAction}
        />
        <Button
          type="button"
          variant="outline"
          className="gap-2"
          disabled={pendingAction !== null}
          onClick={handlePrint}
        >
          <Printer data-icon="inline-start" />
          Print Poster
        </Button>
        <Button
          type="button"
          variant="outline"
          className="gap-2"
          disabled={pendingAction !== null}
          onClick={handleDownloadPdf}
        >
          <FileDown data-icon="inline-start" />
          Download PDF
        </Button>
        <Button
          type="button"
          variant="outline"
          className="gap-2"
          disabled={pendingAction !== null}
          onClick={handleDownloadPng}
        >
          <ImageDown data-icon="inline-start" />
          Download PNG
        </Button>
        <Button
          type="button"
          variant="outline"
          className="gap-2"
          disabled={pendingAction !== null}
          onClick={handleCopy}
        >
          <Copy data-icon="inline-start" />
          {copied ? "Copied Link" : "Copy Attendance Link"}
        </Button>
      </div>

      <div className="attendance-qr-poster-export-source" aria-hidden="true">
        <AttendanceQrPoster ref={posterRef} {...posterProps} />
      </div>
    </>
  );
}
