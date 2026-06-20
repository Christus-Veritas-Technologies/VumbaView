import { Redirect } from "expo-router";
import { useAuthStore } from "@/store/auth-store";

export default function Index() {
  const staff = useAuthStore((s) => s.staff);

  if (!staff) {
    return <Redirect href="/login" />;
  }

  return <Redirect href={staff.role === "ADMIN" ? "/admin" : "/receptionist"} />;
}
