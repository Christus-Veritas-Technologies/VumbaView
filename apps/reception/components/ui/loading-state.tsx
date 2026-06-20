import { ActivityIndicator, View, type ViewProps } from "react-native";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";

export interface LoadingStateProps extends ViewProps {
  label?: string;
  className?: string;
}

/** Consistent inline loading placeholder used across screens during initial data fetches. */
export function LoadingState({ label = "Loading…", className, ...props }: LoadingStateProps) {
  return (
    <View className={cn("items-center justify-center gap-2 p-8", className)} {...props}>
      <ActivityIndicator color="#0f172a" />
      <Text variant="muted">{label}</Text>
    </View>
  );
}
