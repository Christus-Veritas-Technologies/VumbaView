import { Text, View, type TextProps, type ViewProps } from "react-native";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: ViewProps & { className?: string }) {
  return (
    <View
      className={cn("rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200", className)}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: ViewProps & { className?: string }) {
  return <View className={cn("mb-3", className)} {...props} />;
}

export function CardTitle({ className, ...props }: TextProps & { className?: string }) {
  return <Text className={cn("font-heading-semibold text-lg text-slate-900", className)} {...props} />;
}

export function CardContent({ className, ...props }: ViewProps & { className?: string }) {
  return <View className={cn(className)} {...props} />;
}
