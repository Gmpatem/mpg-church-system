import { Spinner } from "./Spinner";

interface PageSpinnerProps {
  label?: string;
  className?: string;
}

export function PageSpinner({ label, className }: PageSpinnerProps) {
  return (
    <div
      className={
        className ??
        "flex min-h-[50vh] flex-col items-center justify-center gap-4"
      }
    >
      <Spinner size="lg" />
      {label ? (
        <p className="text-sm text-muted-foreground">{label}</p>
      ) : null}
    </div>
  );
}
