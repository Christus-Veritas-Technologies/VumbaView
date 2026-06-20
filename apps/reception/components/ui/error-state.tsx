import { View, type ViewProps } from "react-native";
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
    <View
      className={cn("items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4", className)}
      {...props}
    >
      <AlertTriangle size={20} color="#b91c1c" />
      <Text className="text-center text-sm text-red-700">{message}</Text>
      {onRetry ? (
        <Button size="sm" variant="outline" onPress={onRetry}>
          {retryLabel}
        </Button>
      ) : null}
    </View>
  );
}
