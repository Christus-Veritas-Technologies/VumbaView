import { Link, Stack } from "expo-router";
import { View } from "react-native";
import { MotiView } from "moti";
import { Compass } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { BrandMark } from "@/components/brand-mark";

export default function NotFoundScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white p-6">
      <Stack.Screen options={{ title: "Oops!" }} />
      <MotiView
        from={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "timing", duration: 280 }}
        className="items-center"
      >
        <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-gold-100">
          <Compass size={28} color="#A37A1D" />
        </View>
        <Text variant="heading" className="mb-1 text-center">
          This screen doesn&apos;t exist.
        </Text>
        <BrandMark className="mb-2" />
        <Link href="/" className="mt-4">
          <Text className="text-base font-body-medium text-gold-700 underline">Go to home screen</Text>
        </Link>
      </MotiView>
    </View>
  );
}
