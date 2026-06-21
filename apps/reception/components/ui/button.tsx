import { forwardRef } from "react";
import { ActivityIndicator, Pressable, Text, View, type PressableProps } from "react-native";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva("flex-row items-center justify-center rounded-lg active:opacity-90", {
  variants: {
    variant: {
      // Gold is the brand-primary action color — used for the main/default
      // call to action on every screen.
      default: "bg-gold-600 active:bg-gold-700",
      secondary: "bg-slate-100 active:bg-slate-200",
      outline: "border border-slate-300 bg-transparent active:bg-slate-50",
      destructive: "bg-danger-600 active:bg-danger-700",
      success: "bg-success-600 active:bg-success-700",
      warning: "bg-warning-600 active:bg-warning-700",
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

const buttonTextVariants = cva("text-center font-body-semibold", {
  variants: {
    variant: {
      default: "text-white",
      secondary: "text-slate-900",
      outline: "text-slate-900",
      destructive: "text-white",
      success: "text-white",
      warning: "text-white",
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
  success: "#fff",
  warning: "#fff",
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
