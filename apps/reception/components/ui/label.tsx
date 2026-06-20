import { Text, type TextProps } from "react-native";
import { cn } from "@/lib/utils";

export function Label({ className, ...props }: TextProps & { className?: string }) {
  return <Text className={cn("mb-1.5 text-sm font-medium text-slate-700", className)} {...props} />;
}
