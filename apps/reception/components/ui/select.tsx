import { useState } from "react";
import { FlatList, Modal, Pressable, View } from "react-native";
import { Check, ChevronDown } from "lucide-react-native";
import { cn } from "@/lib/utils";
import { Text } from "@/components/ui/text";

export interface SelectOption {
  label: string;
  value: string;
}

export interface SelectProps {
  options: SelectOption[];
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function Select({ options, value, onValueChange, placeholder = "Select...", className }: SelectProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        className={cn(
          "h-11 flex-row items-center justify-between rounded-md border border-slate-300 bg-white px-3",
          className,
        )}
      >
        <Text className={selected ? "text-base text-slate-900" : "text-base text-slate-400"}>
          {selected ? selected.label : placeholder}
        </Text>
        <ChevronDown size={18} color="#94a3b8" />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable className="flex-1 justify-end bg-black/40" onPress={() => setOpen(false)}>
          <Pressable className="max-h-[70%] rounded-t-xl bg-white" onPress={(e) => e.stopPropagation()}>
            <View className="border-b border-slate-200 px-4 py-3">
              <Text variant="subheading">{placeholder}</Text>
            </View>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    onValueChange(item.value);
                    setOpen(false);
                  }}
                  className="flex-row items-center justify-between border-b border-slate-100 px-4 py-3"
                >
                  <Text className={item.value === value ? "font-medium text-slate-900" : "text-slate-700"}>
                    {item.label}
                  </Text>
                  {item.value === value ? <Check size={18} color="#0f172a" /> : null}
                </Pressable>
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
