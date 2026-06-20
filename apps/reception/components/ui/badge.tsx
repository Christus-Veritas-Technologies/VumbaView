import { Text, View } from "react-native";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva("self-start rounded-full px-2.5 py-1", {
  variants: {
    variant: {
      default: "bg-slate-100",
      success: "bg-emerald-100",
      warning: "bg-amber-100",
      danger: "bg-red-100",
    },
  },
  defaultVariants: { variant: "default" },
});

const badgeTextVariants = cva("text-xs font-medium", {
  variants: {
    variant: {
      default: "text-slate-700",
      success: "text-emerald-700",
      warning: "text-amber-700",
      danger: "text-red-700",
    },
  },
  defaultVariants: { variant: "default" },
});

export interface BadgeProps extends VariantProps<typeof badgeVariants> {
  children: React.ReactNode;
  className?: string;
  textClassName?: string;
}

export function Badge({ variant, className, textClassName, children }: BadgeProps) {
  return (
    <View className={cn(badgeVariants({ variant }), className)}>
      <Text className={cn(badgeTextVariants({ variant }), textClassName)}>{children}</Text>
    </View>
  );
}
