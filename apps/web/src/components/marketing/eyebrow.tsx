import { cn } from "@vva/ui/lib/utils";

export function Eyebrow({
  className,
  children,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-2 rounded-full bg-secondary px-4 py-1.5 text-xs font-semibold tracking-wide text-secondary-foreground uppercase",
        className,
      )}
      {...props}
    >
      <span className="size-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
      {children}
    </span>
  );
}
