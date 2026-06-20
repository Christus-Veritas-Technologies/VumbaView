import { forwardRef } from "react";
import { Text as RNText, type TextProps as RNTextProps } from "react-native";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const textVariants = cva("text-slate-900", {
  variants: {
    variant: {
      default: "text-base text-slate-900",
      muted: "text-sm text-slate-500",
      heading: "text-2xl font-bold text-slate-900",
      subheading: "text-lg font-semibold text-slate-900",
      label: "text-sm font-medium text-slate-700",
    },
  },
  defaultVariants: { variant: "default" },
});

export interface TextProps extends RNTextProps, VariantProps<typeof textVariants> {
  className?: string;
}

export const Text = forwardRef<RNText, TextProps>(({ className, variant, ...props }, ref) => (
  <RNText ref={ref} className={cn(textVariants({ variant }), className)} {...props} />
));

Text.displayName = "Text";
