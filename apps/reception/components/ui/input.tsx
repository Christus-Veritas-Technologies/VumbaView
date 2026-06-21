import { forwardRef } from "react";
import { TextInput, type TextInputProps } from "react-native";
import { cn } from "@/lib/utils";

export interface InputProps extends TextInputProps {
  className?: string;
}

export const Input = forwardRef<TextInput, InputProps>(({ className, ...props }, ref) => (
  <TextInput
    ref={ref}
    placeholderTextColor="#94a3b8"
    selectionColor="#A37A1D"
    className={cn(
      "h-11 rounded-lg border border-slate-300 bg-white px-3 font-body text-base text-slate-900 focus:border-gold-500",
      className,
    )}
    {...props}
  />
));

Input.displayName = "Input";
