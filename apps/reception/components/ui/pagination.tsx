import { View } from "react-native";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";

export interface PaginationProps {
  page: number;
  totalPages: number;
  hasPrev: boolean;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  total?: number;
  className?: string;
}

/** Prev/Next pager shown under any list that may grow past one page of 10. */
export function Pagination({
  page,
  totalPages,
  hasPrev,
  hasNext,
  onPrev,
  onNext,
  total,
  className,
}: PaginationProps) {
  // Nothing to page through — stay out of the way.
  if (totalPages <= 1) return null;

  return (
    <View className={cn("flex-row items-center justify-between gap-3 border-t border-slate-100 px-4 py-3", className)}>
      <Button variant="outline" size="sm" onPress={onPrev} disabled={!hasPrev} className="gap-1">
        <ChevronLeft size={16} color="#334155" />
        <Text className="font-body-semibold text-sm text-slate-700">Previous</Text>
      </Button>

      <Text variant="muted" className="text-sm">
        Page {page} of {totalPages}
        {typeof total === "number" ? ` · ${total} total` : ""}
      </Text>

      <Button variant="outline" size="sm" onPress={onNext} disabled={!hasNext} className="gap-1">
        <Text className="font-body-semibold text-sm text-slate-700">Next</Text>
        <ChevronRight size={16} color="#334155" />
      </Button>
    </View>
  );
}
