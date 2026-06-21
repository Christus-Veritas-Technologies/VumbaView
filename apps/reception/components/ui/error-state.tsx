import { View, type ViewProps } from "react-native";
import { MotiView } from "moti";
import { AlertTriangle } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ErrorStateProps extends ViewProps {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

/** Consistent inline error banner used across screens, with an optional retry action. */
export function ErrorState({ message, onRetry, retryLabel = "Try again", className, ...props }: ErrorStateProps) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: -4 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 220 }}
    >
      <View
        className={cn("items-center gap-3 rounded-xl border border-danger-200 bg-danger-50 p-4", className)}
        {...props}
      >
        <AlertTriangle size={20} color="#B91C1C" />
        <Text className="text-center font-body text-sm text-danger-700">{message}</Text>
        {onRetry ? (
          <Button size="sm" variant="outline" onPress={onRetry}>
            {retryLabel}
          </Button>
        ) : null}
      </View>
    </MotiView>
  );
}
