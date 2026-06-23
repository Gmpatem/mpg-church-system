"use client";

import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  Loader2,
} from "lucide-react";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils/cn";

const toastIcons = {
  default: <Info className="size-4" aria-hidden="true" />,
  success: <CheckCircle2 className="size-4" aria-hidden="true" />,
  error: <AlertCircle className="size-4" aria-hidden="true" />,
  warning: <AlertTriangle className="size-4" aria-hidden="true" />,
  info: <Info className="size-4" aria-hidden="true" />,
  progress: <Loader2 className="size-4 animate-spin" aria-hidden="true" />,
  destructive: <AlertCircle className="size-4" aria-hidden="true" />,
};

const toastIconTones = {
  default: "text-muted-foreground",
  success: "text-primary",
  error: "text-destructive",
  warning: "text-foreground",
  info: "text-muted-foreground",
  progress: "text-primary",
  destructive: "text-destructive",
};

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider duration={5000}>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        const variant = props.variant ?? "default";

        return (
          <Toast key={id} {...props}>
            <div className={cn("mt-0.5 shrink-0", toastIconTones[variant])}>
              {toastIcons[variant]}
            </div>
            <div className="grid min-w-0 flex-1 gap-1">
              {title ? <ToastTitle>{title}</ToastTitle> : null}
              {description ? (
                <ToastDescription>{description}</ToastDescription>
              ) : null}
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
