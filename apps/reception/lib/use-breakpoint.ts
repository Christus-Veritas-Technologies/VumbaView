import { useWindowDimensions } from "react-native";

/**
 * Mirrors Tailwind's default breakpoints (inherited as-is via
 * `nativewind/preset` in tailwind.config.js) so JS-driven layout decisions
 * (FlatList numColumns, list-vs-grid switches) line up with the className
 * breakpoints used elsewhere on the same screen.
 */
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

export type Breakpoint = "phone" | "tablet" | "desktop";

export interface BreakpointInfo {
  width: number;
  height: number;
  /** width >= md (768) — the general "give it a tablet layout" switch. */
  isTablet: boolean;
  /** width >= lg (1024) — a wide tablet/desktop, room for 3+ columns. */
  isLargeTablet: boolean;
  breakpoint: Breakpoint;
}

export function useBreakpoint(): BreakpointInfo {
  const { width, height } = useWindowDimensions();

  const isTablet = width >= BREAKPOINTS.md;
  const isLargeTablet = width >= BREAKPOINTS.lg;
  const breakpoint: Breakpoint = isLargeTablet ? "desktop" : isTablet ? "tablet" : "phone";

  return { width, height, isTablet, isLargeTablet, breakpoint };
}

/**
 * Column count for a FlatList grid, driven by the same breakpoints. Pass the
 * result as both `numColumns` and as part of the FlatList `key` (e.g.
 * `key={numColumns}`) — React Native doesn't support changing `numColumns`
 * on a live FlatList, so the list must remount when it changes.
 */
export function useGridColumns(max = 2): number {
  const { isTablet } = useBreakpoint();
  return isTablet ? max : 1;
}
