import { useEffect, useRef } from "react";
import { Animated, View, type ViewProps } from "react-native";
import { cn } from "@/lib/utils";

export interface SkeletonProps extends ViewProps {
  className?: string;
}

/** A pulsing placeholder block — the base primitive for animated loading
 * skeletons. Compose into card/list-shaped layouts (see SkeletonStatCard,
 * SkeletonRow, SkeletonList below) instead of a bare spinner wherever the
 * eventual content has a predictable shape. */
export function Skeleton({ className, style, ...props }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 650, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 650, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return <Animated.View className={cn("rounded-lg bg-slate-200", className)} style={[{ opacity }, style]} {...props} />;
}

/** Skeleton shaped like a stat/summary Card — icon circle, a big number, a label. */
export function SkeletonStatCard() {
  return (
    <View className="flex-1 rounded-2xl border border-slate-100 bg-white p-4">
      <Skeleton className="mb-3 h-9 w-9 rounded-full" />
      <Skeleton className="mb-2 h-6 w-16" />
      <Skeleton className="h-3 w-24" />
    </View>
  );
}

/** Skeleton shaped like one row in a list — avatar/icon, two lines, a trailing pill. */
export function SkeletonRow() {
  return (
    <View className="flex-row items-center justify-between py-2.5">
      <View className="flex-1 flex-row items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-full" />
        <View className="flex-1 gap-1.5">
          <Skeleton className="h-3.5 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
        </View>
      </View>
      <Skeleton className="h-5 w-14 rounded-full" />
    </View>
  );
}

/** A handful of SkeletonRows stacked — drop-in placeholder for list screens. */
export function SkeletonList({ rows = 4 }: { rows?: number }) {
  return (
    <View>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </View>
  );
}
