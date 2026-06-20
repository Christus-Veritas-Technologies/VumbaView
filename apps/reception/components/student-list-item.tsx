import { Pressable, View } from "react-native";
import { Text } from "@/components/ui/text";
import { FeeStatusBadge } from "@/components/fee-status-badge";
import { PendingSyncBadge } from "@/components/pending-sync-badge";
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
}

export function StudentListItem({ student, onPress, variant = "row" }: StudentListItemProps) {
  if (variant === "card") {
    return (
      <Pressable
        onPress={onPress}
        className="flex-1 rounded-lg border border-slate-200 bg-white p-4 active:bg-slate-50"
      >
        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-base font-medium text-slate-900">{student.fullName}</Text>
            <Text variant="muted">
              {LEVEL_LABELS[student.level]}
              {student.admissionNo ? ` · #${student.admissionNo}` : ""}
            </Text>
          </View>
          {student.feeStatus ? <FeeStatusBadge status={student.feeStatus} /> : null}
        </View>
        {student.pendingSync ? (
          <View className="mt-2">
            <PendingSyncBadge />
          </View>
        ) : null}
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center justify-between border-b border-slate-100 px-4 py-3 active:bg-slate-50"
    >
      <View className="flex-1 pr-3">
        <Text className="text-base font-medium text-slate-900">{student.fullName}</Text>
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
      {student.feeStatus ? <FeeStatusBadge status={student.feeStatus} /> : null}
    </Pressable>
  );
}
