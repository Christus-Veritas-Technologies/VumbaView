import { ActivityIndicator, View, type ViewProps } from "react-native";
import { MotiView } from "moti";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";

export interface LoadingStateProps extends ViewProps {
  label?: string;
  className?: string;
}

/** Consistent inline loading placeholder used across screens during initial data fetches. */
export function LoadingState({ label = "Loading…", className, ...props }: LoadingStateProps) {
  return (
    <MotiView
      from={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ type: "timing", duration: 250 }}
      className={cn("items-center justify-center gap-2 p-8", className)}
      {...props}
    >
      <ActivityIndicator color="#A37A1D" />
      <Text variant="muted">{label}</Text>
    </MotiView>
  );
}
