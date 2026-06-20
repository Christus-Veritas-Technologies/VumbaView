import { Link, Stack } from "expo-router";
import { View } from "react-native";
import { Text } from "@/components/ui/text";

export default function NotFoundScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white p-6">
      <Stack.Screen options={{ title: "Oops!" }} />
      <Text variant="heading" className="mb-2 text-center">
        This screen doesn&apos;t exist.
      </Text>
      <Link href="/" className="mt-4">
        <Text className="text-base text-slate-600 underline">Go to home screen</Text>
      </Link>
    </View>
  );
}
