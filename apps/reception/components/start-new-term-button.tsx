import { useState } from "react";
import { Alert } from "react-native";
import { Calendar } from "lucide-react-native";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { api, ApiClientError } from "@/lib/api";

interface StartNewTermButtonProps {
  /** Called after a term is successfully started, so the caller can reload
   * whatever data depends on "is there a current term" (Settings just shows
   * a success alert; the Dashboard also needs to leave its no-term state). */
  onStarted?: (term: { number: number }) => void;
  variant?: ButtonProps["variant"];
  className?: string;
}

/**
 * The one "Start new term" action in the app — same confirmation copy, same
 * API call, same button, wherever it's used. Settings and the Dashboard's
 * no-term empty state both render this instead of each keeping their own
 * copy of the logic, so the two can never drift out of sync.
 */
export function StartNewTermButton({ onStarted, variant = "secondary", className }: StartNewTermButtonProps) {
  const [starting, setStarting] = useState(false);

  function handlePress() {
    Alert.alert(
      "Start new term",
      "This creates a new term and snapshots the current fee schedule. Past payments and fee balances are not affected. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Start term",
          onPress: async () => {
            setStarting(true);
            try {
              const term = await api.post<{ number: number }>("/settings/start-term");
              Alert.alert("Term started", `Term ${term.number} is now active.`);
              onStarted?.(term);
            } catch (err) {
              Alert.alert("Error", err instanceof ApiClientError ? err.message : "Couldn't start new term.");
            } finally {
              setStarting(false);
            }
          },
        },
      ],
    );
  }

  const textColor = variant === "secondary" || variant === "outline" ? "text-slate-900" : "text-white";
  const iconColor = variant === "secondary" || variant === "outline" ? "#0f172a" : "#fff";

  return (
    <Button variant={variant} loading={starting} onPress={handlePress} className={className}>
      <Calendar size={16} color={iconColor} />
      <Text className={`ml-2 font-body-semibold text-base ${textColor}`}>Start new term</Text>
    </Button>
  );
}
