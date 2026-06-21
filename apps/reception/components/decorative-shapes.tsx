import { View } from "react-native";
import Svg, { Circle, Polygon, Rect } from "react-native-svg";
import { cn } from "@/lib/utils";

export type ShapeTone = "gold" | "info" | "violet" | "success";

const TONE_COLORS: Record<ShapeTone, string> = {
  gold: "#A37A1D",
  info: "#2563EB",
  violet: "#7C3AED",
  success: "#059669",
};

export interface DecorativeShapesProps {
  tone?: ShapeTone;
  className?: string;
}

/**
 * Sparse, low-opacity geometric accents (circle, square, triangle) meant to
 * sit behind a header/hero area — the "vectors at the back" treatment from
 * the design reference. Absolutely fills its parent and ignores touches;
 * the parent should clip with `overflow-hidden` so shapes don't bleed past
 * rounded corners.
 */
export function DecorativeShapes({ tone = "gold", className }: DecorativeShapesProps) {
  const color = TONE_COLORS[tone];

  return (
    <View pointerEvents="none" className={cn("absolute inset-0", className)}>
      <Svg width="100%" height="100%" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice">
        <Circle cx={368} cy={18} r={72} fill={color} opacity={0.16} />
        <Rect
          x={296}
          y={108}
          width={64}
          height={64}
          rx={14}
          fill={color}
          opacity={0.12}
          transform="rotate(20 328 140)"
        />
        <Polygon points="36,6 78,86 -6,86" fill={color} opacity={0.1} />
        <Circle cx={26} cy={150} r={26} fill={color} opacity={0.14} />
      </Svg>
    </View>
  );
}
