import { Text, View, type TextProps, type ViewProps } from "react-native";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: ViewProps & { className?: string }) {
  return <View className={cn("rounded-lg border border-slate-200 bg-white p-4", className)} {...props} />;
}

export function CardHeader({ className, ...props }: ViewProps & { className?: string }) {
  return <View className={cn("mb-3", className)} {...props} />;
}

export function CardTitle({ className, ...props }: TextProps & { className?: string }) {
  return <Text className={cn("text-lg font-semibold text-slate-900", className)} {...props} />;
}

export function CardContent({ className, ...props }: ViewProps & { className?: string }) {
  return <View className={cn(className)} {...props} />;
}
