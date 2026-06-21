import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import type { ActivityItem } from "./types";

// Local-only notifications (no push token, no remote server round-trip) —
// these just surface dashboard activity the admin would otherwise only see
// by opening the app. Works fine in Expo Go: only *remote* push requires a
// development build on recent SDKs, local scheduling is unaffected.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

let permissionRequested = false;

async function ensurePermission() {
  if (permissionRequested || Platform.OS === "web") return;
  permissionRequested = true;
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") {
      await Notifications.requestPermissionsAsync();
    }
  } catch {
    // No-op — if permissions can't be requested (e.g. unsupported runtime),
    // notifications are simply skipped elsewhere; the dashboard itself
    // should never fail because of this.
  }
}

const TITLES: Record<ActivityItem["type"], string> = {
  STUDENT_ADDED: "New student enrolled",
  PAYMENT_RECORDED: "Payment recorded",
  INQUIRY_RECEIVED: "New admissions inquiry",
};

/** Fires one local notification per new activity item (capped at 5 so a
 * big batch — e.g. after being offline — doesn't spam the notification
 * tray). Call with only the items the caller hasn't seen yet. */
export async function notifyNewActivity(items: ActivityItem[]) {
  if (Platform.OS === "web" || items.length === 0) return;
  await ensurePermission();
  for (const item of items.slice(0, 5)) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: { title: TITLES[item.type], body: item.summary },
        trigger: null,
      });
    } catch {
      // Best-effort — a notification failure should never break the
      // dashboard load it was triggered from.
    }
  }
}
