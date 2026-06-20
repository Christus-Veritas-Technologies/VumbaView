import { View } from "react-native";
import { MotiView } from "moti";
import { Text } from "@/components/ui/text";

/** Small pulsing-dot badge shown on any locally-queued record that hasn't
 * made it to the server yet. The pulse is a deliberately subtle, functional
 * use of Moti — signals "this will sync" without being a distraction. */
export function PendingSyncBadge({ label = "Pending sync" }: { label?: string }) {
  return (
    <View className="flex-row items-center gap-1.5 self-start rounded-full bg-amber-50 px-2.5 py-1">
      <MotiView
        className="h-2 w-2 rounded-full bg-amber-500"
        from={{ opacity: 0.35, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1.1 }}
        transition={{ type: "timing", duration: 800, loop: true }}
      />
      <Text className="text-xs font-medium text-amber-700">{label}</Text>
    </View>
  );
}
