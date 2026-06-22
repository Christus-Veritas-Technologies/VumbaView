import type { ReactNode } from "react";
import { View } from "react-native";
import { MotiView } from "moti";
import { BrandMark } from "@/components/brand-mark";
import { cn } from "@/lib/utils";

export interface SheetScreenProps {
  children: ReactNode;
  className?: string;
}

/**
 * Chrome for routes presented as a native modal (Stack.Screen
 * `presentation: "modal"`) — rounded top corners, a drag-handle affordance,
 * and a slide-up entrance, so a dedicated route reads as a bottom
 * sheet/dialog rather than a plain full screen. The existing Stack header
 * (back/close + title) still provides the dismiss action, so this only
 * adds the sheet-like body chrome around it.
 *
 * Used for short-input entity-creation flows (new student, new staff) per
 * the "dialogs for entities with a short amount of info" pattern, and for
 * longer flows (record payment, edit student) that still benefit from
 * reading as a sheet rather than a flat screen.
 */
export function SheetScreen({ children, className }: SheetScreenProps) {
  return (
    <View className="flex-1 bg-slate-100">
      <MotiView
        from={{ translateY: 28, opacity: 0 }}
        animate={{ translateY: 0, opacity: 1 }}
        transition={{ type: "timing", duration: 260 }}
        className={cn("flex-1 overflow-hidden rounded-t-3xl bg-white", className)}
      >
        <View className="items-center pb-1 pt-2.5">
          <View className="mb-1.5 h-1.5 w-10 rounded-full bg-slate-200" />
          <BrandMark size="xs" />
        </View>
        {children}
      </MotiView>
    </View>
  );
}
