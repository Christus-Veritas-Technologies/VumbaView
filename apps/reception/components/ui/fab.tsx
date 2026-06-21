import type { ReactNode } from "react";
import { Pressable, type PressableProps } from "react-native";
import { MotiView } from "moti";
import { Plus } from "lucide-react-native";
import { cn } from "@/lib/utils";

export interface FabProps extends PressableProps {
  icon?: ReactNode;
  className?: string;
}

/**
 * Floating circular action button — the native primitive used on every
 * entity-list screen as the single, consistent "create new" entry point.
 * Defaults to a centered "+"; pass `icon` to show something else (e.g. a
 * sync icon). Positioned bottom-right with a spring-in entrance.
 */
export function Fab({ icon, className, ...props }: FabProps) {
  return (
    <MotiView
      from={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", delay: 150 }}
      className="absolute bottom-6 right-6"
    >
      <Pressable
        accessibilityRole="button"
        className={cn(
          "h-14 w-14 items-center justify-center rounded-full bg-gold-600 shadow-lg shadow-gold-900/40 active:bg-gold-700",
          className,
        )}
        {...props}
      >
        {icon ?? <Plus color="#fff" size={24} />}
      </Pressable>
    </MotiView>
  );
}
