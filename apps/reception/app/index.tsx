import { Redirect } from "expo-router";
import { useAuthStore } from "@/store/auth-store";
import { authLog } from "@/lib/debug-log";

export default function Index() {
  const staff = useAuthStore((s) => s.staff);

  if (!staff) {
    authLog("guard:index", "staff=null -> redirect /login");
    return <Redirect href="/login" />;
  }

  authLog("guard:index", "staff=", staff.username, staff.role, "-> redirect", staff.role === "ADMIN" ? "/admin" : "/receptionist");
  return <Redirect href={staff.role === "ADMIN" ? "/admin" : "/receptionist"} />;
}
