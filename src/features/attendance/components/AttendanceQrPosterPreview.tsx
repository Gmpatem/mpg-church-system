"use client";

import { Eye, FileDown, ImageDown, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AttendanceQrPoster, type AttendanceQrPosterProps } from "./AttendanceQrPoster";

interface AttendanceQrPosterPreviewProps {
  posterProps: AttendanceQrPosterProps;
  onPrint: () => void;
  onDownloadPdf: () => void;
  onDownloadPng: () => void;
  pendingAction: "pdf" | "png" | "print" | null;
}

export function AttendanceQrPosterPreview({
  posterProps,
  onPrint,
  onDownloadPdf,
  onDownloadPng,
  pendingAction,
}: AttendanceQrPosterPreviewProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className="gap-2">
          <Eye data-icon="inline-start" />
          Preview Poster
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Attendance QR Poster</DialogTitle>
          <DialogDescription>
            A4 poster preview for church entrance printing and sharing.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl bg-slate-100 p-3">
          <AttendanceQrPoster {...posterProps} className="shadow-none" />
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            disabled={pendingAction !== null}
            onClick={onPrint}
          >
            <Printer data-icon="inline-start" />
            Print Poster
          </Button>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              disabled={pendingAction !== null}
              onClick={onDownloadPng}
            >
              <ImageDown data-icon="inline-start" />
              Download PNG
            </Button>
            <Button
              type="button"
              className="gap-2"
              disabled={pendingAction !== null}
              onClick={onDownloadPdf}
            >
              <FileDown data-icon="inline-start" />
              Download PDF
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
