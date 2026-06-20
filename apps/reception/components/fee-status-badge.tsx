import { Badge } from "@/components/ui/badge";
import type { FeeStatus } from "@/lib/types";

const VARIANT: Record<FeeStatus, "success" | "warning" | "danger"> = {
  PAID: "success",
  PARTIAL: "warning",
  UNPAID: "danger",
};

const LABEL: Record<FeeStatus, string> = {
  PAID: "Paid",
  PARTIAL: "Partial",
  UNPAID: "Unpaid",
};

export function FeeStatusBadge({ status }: { status: FeeStatus }) {
  return <Badge variant={VARIANT[status]}>{LABEL[status]}</Badge>;
}
