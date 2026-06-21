import { Text, View } from "react-native";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva("self-start rounded-full px-2.5 py-1", {
  variants: {
    variant: {
      default: "bg-slate-100",
      success: "bg-success-100",
      warning: "bg-warning-100",
      danger: "bg-danger-100",
      gold: "bg-gold-100",
    },
  },
  defaultVariants: { variant: "default" },
});

const badgeTextVariants = cva("text-xs font-body-semibold", {
  variants: {
    variant: {
      default: "text-slate-700",
      success: "text-success-700",
      warning: "text-warning-700",
      danger: "text-danger-700",
      gold: "text-gold-800",
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
