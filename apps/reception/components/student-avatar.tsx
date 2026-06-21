import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";

// Cycled deterministically by level name so the same student always renders
// the same color across the directory list, list cards, and the detail
// screen — and so the app reads with the multi-color icon-badge variety
// from the design reference instead of everything in shades of gold.
const AVATAR_TONES = [
  { bg: "bg-gold-100", text: "#A37A1D" },
  { bg: "bg-info-100", text: "#2563EB" },
  { bg: "bg-violet-100", text: "#7C3AED" },
  { bg: "bg-success-100", text: "#059669" },
];

function toneForLevel(level: string) {
  let hash = 0;
  for (let i = 0; i < level.length; i++) hash = (hash * 31 + level.charCodeAt(i)) % AVATAR_TONES.length;
  return AVATAR_TONES[hash];
}

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

export interface StudentAvatarProps {
  name: string;
  level: string;
  size?: "sm" | "lg";
  className?: string;
}

export function StudentAvatar({ name, level, size = "sm", className }: StudentAvatarProps) {
  const tone = toneForLevel(level);
  const dimension = size === "lg" ? "h-16 w-16" : "h-11 w-11";
  const textSize = size === "lg" ? "text-lg" : "text-sm";

  return (
    <View className={cn("items-center justify-center rounded-full", dimension, tone.bg, className)}>
      <Text className={cn("font-body-semibold", textSize)} style={{ color: tone.text }}>
        {initialsOf(name)}
      </Text>
    </View>
  );
}
