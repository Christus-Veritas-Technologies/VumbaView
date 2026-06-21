import { Pressable, View } from "react-native";
import { MotiView } from "moti";
import { ChevronRight } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { FeeStatusBadge } from "@/components/fee-status-badge";
import { PendingSyncBadge } from "@/components/pending-sync-badge";
import { StudentAvatar } from "@/components/student-avatar";
import { LEVEL_LABELS } from "@/lib/types";
import type { StudentCacheRow } from "@/lib/storage/db";

interface StudentListItemProps {
  student: StudentCacheRow;
  onPress: () => void;
  /**
   * "row" (default) is a full-width list row with a bottom border — used on
   * phone-width single-column lists. "card" is a self-contained bordered
   * card — used when the directory switches to a tablet grid (see
   * `useGridColumns()` in the directory screens).
   */
  variant?: "row" | "card";
  /** Position within the current page — drives a subtle staggered entrance. */
  index?: number;
}

export function StudentListItem({ student, onPress, variant = "row", index = 0 }: StudentListItemProps) {
  // Cap the stagger so a long page doesn't leave the last rows waiting.
  const delay = Math.min(index, 8) * 35;

  if (variant === "card") {
    return (
      <MotiView
        from={{ opacity: 0, translateY: 8 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 220, delay }}
        className="flex-1"
      >
        <Pressable
          onPress={onPress}
          className="flex-1 rounded-xl border border-slate-200 bg-white p-4 active:bg-slate-50"
        >
          <View className="flex-row items-start justify-between">
            <View className="flex-1 flex-row items-center gap-3 pr-3">
              <StudentAvatar name={student.fullName} level={student.level} />
              <View className="flex-1">
                <Text className="font-body-semibold text-base text-slate-900">{student.fullName}</Text>
                <Text variant="muted">
                  {LEVEL_LABELS[student.level]}
                  {student.admissionNo ? ` · #${student.admissionNo}` : ""}
                </Text>
              </View>
            </View>
            {student.feeStatus ? <FeeStatusBadge status={student.feeStatus} /> : null}
          </View>
          {student.pendingSync ? (
            <View className="mt-2">
              <PendingSyncBadge />
            </View>
          ) : null}
        </Pressable>
      </MotiView>
    );
  }

  return (
    <MotiView
      from={{ opacity: 0, translateY: 6 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 200, delay }}
    >
      <Pressable
        onPress={onPress}
        className="flex-row items-center justify-between border-b border-slate-100 px-4 py-3 active:bg-slate-50"
      >
        <View className="flex-1 flex-row items-center gap-3 pr-3">
          <StudentAvatar name={student.fullName} level={student.level} />
          <View className="flex-1">
            <Text className="font-body-semibold text-base text-slate-900">{student.fullName}</Text>
            <Text variant="muted">
              {LEVEL_LABELS[student.level]}
              {student.admissionNo ? ` · #${student.admissionNo}` : ""}
            </Text>
            {student.pendingSync ? (
              <View className="mt-1">
                <PendingSyncBadge />
              </View>
            ) : null}
          </View>
        </View>
        <View className="flex-row items-center gap-2">
          {student.feeStatus ? <FeeStatusBadge status={student.feeStatus} /> : null}
          <ChevronRight size={18} color="#cbd5e1" />
        </View>
      </Pressable>
    </MotiView>
  );
}
