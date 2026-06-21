import { forwardRef } from "react";
import { Text as RNText, type TextProps as RNTextProps } from "react-native";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const textVariants = cva("font-body text-slate-900", {
  variants: {
    variant: {
      default: "font-body text-base text-slate-900",
      muted: "font-body text-sm text-slate-500",
      heading: "font-heading text-2xl text-slate-900",
      subheading: "font-heading-semibold text-lg text-slate-900",
      label: "font-body-medium text-sm text-slate-700",
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
