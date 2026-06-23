import { Redirect } from "expo-router";

/** Bare /receptionist has no screen of its own — the Students tab now lives
 * at /receptionist/students (see students/_layout.tsx) so it can have its
 * own nested Stack for proper back navigation between the list and detail
 * screens. This file just sends anyone landing on the bare path to that
 * tab. Hidden from the tab bar via `href: null` in the parent Tabs layout. */
export default function ReceptionistIndexRedirect() {
  return <Redirect href="/receptionist/students" />;
}
