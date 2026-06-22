import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";

export interface BrandMarkProps {
  size?: "xs" | "sm" | "base";
  className?: string;
}

/**
 * "VumbaView Academy" in red — the one piece of branding repeated across the
 * app (badges, headings, subheadings, sheet modals) so the school's identity
 * stays visible everywhere, not just on the login screen. Single source for
 * the wording/styling so every placement stays in sync.
 */
export function BrandMark({ size = "sm", className }: BrandMarkProps) {
  return (
    <Text
      className={cn(
        "font-body-semibold text-danger-600",
        size === "xs" ? "text-[11px]" : size === "base" ? "text-base" : "text-xs",
        className,
      )}
    >
      VumbaView Academy
    </Text>
  );
}
