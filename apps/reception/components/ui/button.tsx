import { forwardRef } from "react";
import { ActivityIndicator, Pressable, Text, View, type PressableProps } from "react-native";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva("flex-row items-center justify-center rounded-md", {
  variants: {
    variant: {
      default: "bg-slate-900 active:bg-slate-800",
      secondary: "bg-slate-100 active:bg-slate-200",
      outline: "border border-slate-300 bg-transparent active:bg-slate-50",
      destructive: "bg-red-600 active:bg-red-700",
      ghost: "bg-transparent active:bg-slate-100",
    },
    size: {
      default: "h-11 px-4",
      sm: "h-9 px-3",
      lg: "h-12 px-6",
      icon: "h-10 w-10",
    },
  },
  defaultVariants: { variant: "default", size: "default" },
});

const buttonTextVariants = cva("text-center font-medium", {
  variants: {
    variant: {
      default: "text-white",
      secondary: "text-slate-900",
      outline: "text-slate-900",
      destructive: "text-white",
      ghost: "text-slate-900",
    },
    size: {
      default: "text-base",
      sm: "text-sm",
      lg: "text-lg",
      icon: "text-base",
    },
  },
  defaultVariants: { variant: "default", size: "default" },
});

export interface ButtonProps extends PressableProps, VariantProps<typeof buttonVariants> {
  loading?: boolean;
  className?: string;
}

const SPINNER_COLOR: Record<string, string> = {
  default: "#fff",
  secondary: "#0f172a",
  outline: "#0f172a",
  destructive: "#fff",
  ghost: "#0f172a",
};

export const Button = forwardRef<View, ButtonProps>(
  ({ className, variant = "default", size = "default", loading, disabled, children, ...props }, ref) => {
    return (
      <Pressable
        ref={ref}
        disabled={disabled || loading}
        className={cn(buttonVariants({ variant, size }), (disabled || loading) && "opacity-50", className)}
        {...props}
      >
        {loading ? (
          <ActivityIndicator color={SPINNER_COLOR[variant ?? "default"]} />
        ) : typeof children === "string" ? (
          <Text className={cn(buttonTextVariants({ variant, size }))}>{children}</Text>
        ) : (
          children
        )}
      </Pressable>
    );
  },
);

Button.displayName = "Button";
