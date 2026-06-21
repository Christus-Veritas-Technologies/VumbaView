import { View } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from "react-native-svg";

// Full-bleed gold sunset over the Vumba mountains — used as the backdrop on
// the sign-in screen. `preserveAspectRatio="xMidYMid slice"` makes the
// viewBox behave like CSS `background-size: cover`, so it fills the screen
// edge-to-edge on any device without distortion, same idea as an
// `ImageBackground`, just vector instead of a raster asset.
export function AuthBackground() {
  return (
    <View pointerEvents="none" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}>
      <Svg width="100%" height="100%" viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice">
        <Defs>
          <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#F5EBCF" />
            <Stop offset="0.4" stopColor="#C19426" />
            <Stop offset="0.75" stopColor="#624B1A" />
            <Stop offset="1" stopColor="#241D0E" />
          </LinearGradient>
          <LinearGradient id="sun" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#FBF7EC" stopOpacity="0.9" />
            <Stop offset="1" stopColor="#FBF7EC" stopOpacity="0" />
          </LinearGradient>
        </Defs>

        <Rect x={0} y={0} width={400} height={800} fill="url(#sky)" />
        <Circle cx={300} cy={190} r={90} fill="url(#sun)" />
        <Circle cx={300} cy={190} r={46} fill="#FBF7EC" opacity={0.85} />

        {/* Back ridge */}
        <Path
          d="M0,430 L55,365 L120,410 L170,340 L230,400 L280,355 L340,395 L400,360 L400,800 L0,800 Z"
          fill="#3f3115"
          opacity={0.6}
        />
        {/* Mid ridge */}
        <Path
          d="M0,500 L70,440 L140,485 L200,420 L260,470 L330,425 L400,460 L400,800 L0,800 Z"
          fill="#2a2010"
          opacity={0.8}
        />
        {/* Front ridge */}
        <Path
          d="M0,560 L60,515 L130,550 L210,495 L290,540 L400,505 L400,800 L0,800 Z"
          fill="#16110a"
        />
      </Svg>
    </View>
  );
}
