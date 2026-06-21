import { useState } from "react";
import { KeyboardAvoidingView, Platform, View } from "react-native";
import { Redirect } from "expo-router";
import { MotiView } from "moti";
import { GraduationCap, LogIn } from "lucide-react-native";
import { useAuthStore } from "@/store/auth-store";
import { useSyncStore } from "@/store/sync-store";
import { Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function LoginScreen() {
  const staff = useAuthStore((s) => s.staff);
  const login = useAuthStore((s) => s.login);
  const loading = useAuthStore((s) => s.loading);
  const error = useAuthStore((s) => s.error);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  if (staff) {
    return <Redirect href={staff.role === "ADMIN" ? "/admin" : "/receptionist"} />;
  }

  async function handleSubmit() {
    const ok = await login(username.trim(), password);
    if (ok) {
      useSyncStore.getState().runSync();
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 justify-center bg-slate-50 px-6"
    >
      {/* Capped, centered card on tablet/desktop instead of a full-bleed
          column — the form looks lost stretched across a wide screen. */}
      <MotiView
        from={{ opacity: 0, translateY: 16, scale: 0.97 }}
        animate={{ opacity: 1, translateY: 0, scale: 1 }}
        transition={{ type: "timing", duration: 320 }}
        className="w-full self-center md:max-w-sm md:rounded-xl md:border md:border-slate-200 md:bg-white md:p-8 md:shadow-sm"
      >
        <MotiView
          from={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", delay: 80 }}
          className="mb-5 h-14 w-14 items-center justify-center rounded-2xl bg-gold-100"
        >
          <GraduationCap size={26} color="#A37A1D" />
        </MotiView>

        <Text variant="heading" className="mb-1">
          VumbaView Academy
        </Text>
        <Text variant="muted" className="mb-8">
          Sign in with your staff account
        </Text>

        <View className="mb-4">
          <Label>Username</Label>
          <Input
            autoCapitalize="none"
            autoCorrect={false}
            value={username}
            onChangeText={setUsername}
            placeholder="e.g. reception"
          />
        </View>

        <View className="mb-2">
          <Label>Password</Label>
          <Input
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            onSubmitEditing={handleSubmit}
          />
        </View>

        {error ? <Text className="mb-4 text-sm font-body-medium text-danger-600">{error}</Text> : null}

        <Button className="mt-4" loading={loading} disabled={!username.trim() || !password} onPress={handleSubmit}>
          <LogIn size={16} color="#fff" />
          <Text className="ml-2 font-body-semibold text-base text-white">Sign in</Text>
        </Button>
      </MotiView>
    </KeyboardAvoidingView>
  );
}
