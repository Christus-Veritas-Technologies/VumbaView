import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, View } from "react-native";
import { Redirect } from "expo-router";
import { MotiView } from "moti";
import { Eye, EyeOff, GraduationCap, Lock, LogIn, User } from "lucide-react-native";
import { useAuthStore } from "@/store/auth-store";
import { useSyncStore } from "@/store/sync-store";
import { Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AuthBackground } from "@/components/auth-background";
import { authLog } from "@/lib/debug-log";

export default function LoginScreen() {
  const staff = useAuthStore((s) => s.staff);
  const login = useAuthStore((s) => s.login);
  const loading = useAuthStore((s) => s.loading);
  const error = useAuthStore((s) => s.error);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  if (staff) {
    authLog("guard:login", "staff already set (", staff.username, ") -> redirect away from login screen");
    return <Redirect href={staff.role === "ADMIN" ? "/admin" : "/receptionist"} />;
  }

  authLog("guard:login", "rendering sign-in form (staff=null)");

  async function handleSubmit() {
    authLog("login-screen:handleSubmit:start", username.trim());
    const ok = await login(username.trim(), password);
    authLog("login-screen:handleSubmit:login() resolved", ok, "staff now=", useAuthStore.getState().staff?.username ?? "(none)");
    if (ok) {
      // Fire-and-forget — NOT awaited. If this pull's response resolves
      // late and races a later 401-handling branch, the timing shows up
      // here as a request:start without a matching request:done before
      // the redirect-to-login is observed.
      authLog("login-screen:handleSubmit:firing background runSync()");
      useSyncStore.getState().runSync();
    }
  }

  return (
    <View className="flex-1">
      <AuthBackground />

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
        {/* Top quarter — background stays visible through here. */}
        <View className="flex-1" />

        {/* Bottom three-quarters — the form card, slid up from offscreen. */}
        <MotiView
          from={{ translateY: 600 }}
          animate={{ translateY: 0 }}
          transition={{ type: "timing", duration: 420 }}
          className="flex-[3] overflow-hidden rounded-t-3xl bg-white px-6 pt-9"
        >
          <View className="items-center">
            <MotiView
              from={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", delay: 150 }}
              className="mb-4 h-14 w-14 items-center justify-center rounded-2xl bg-gold-100"
            >
              <GraduationCap size={26} color="#A37A1D" />
            </MotiView>

            <Text variant="heading" className="mb-1 text-center">
              VumbaView Academy
            </Text>
            <Text variant="muted" className="mb-8 text-center">
              Sign in with your staff account
            </Text>
          </View>

          <View className="mb-4">
            <View className="relative">
              <View className="absolute left-3 top-0 z-10 h-11 w-5 items-center justify-center">
                <User size={16} color="#94a3b8" />
              </View>
              <Input
                autoCapitalize="none"
                autoCorrect={false}
                value={username}
                onChangeText={setUsername}
                placeholder="Username"
                className="pl-9"
              />
            </View>
          </View>

          <View className="mb-2">
            <View className="relative">
              <View className="absolute left-3 top-0 z-10 h-11 w-5 items-center justify-center">
                <Lock size={16} color="#94a3b8" />
              </View>
              <Input
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                onSubmitEditing={handleSubmit}
                className="pl-9 pr-9"
              />
              <Pressable
                onPress={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-0 z-10 h-11 w-5 items-center justify-center"
              >
                {showPassword ? <EyeOff size={16} color="#94a3b8" /> : <Eye size={16} color="#94a3b8" />}
              </Pressable>
            </View>
          </View>

          {error ? (
            <Text className="mb-4 text-center text-sm font-body-medium text-danger-600">{error}</Text>
          ) : null}

          <Button className="mt-4" loading={loading} disabled={!username.trim() || !password} onPress={handleSubmit}>
            <LogIn size={16} color="#fff" />
            <Text className="ml-2 font-body-semibold text-base text-white">Sign in</Text>
          </Button>
        </MotiView>
      </KeyboardAvoidingView>
    </View>
  );
}
