import { useState } from "react";
import { Alert, ScrollView, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MotiView } from "moti";
import { KeyRound, Lock, Save, User } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { DecorativeShapes } from "@/components/decorative-shapes";
import { api, ApiClientError } from "@/lib/api";
import { ROOT_ADMIN_USERNAME } from "@/lib/types";

export default function EditStaffScreen() {
  const router = useRouter();
  const { id, username: initialUsername, role } = useLocalSearchParams<{
    id: string;
    username: string;
    role: string;
  }>();

  const [username, setUsername] = useState(initialUsername ?? "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const isRoot = initialUsername === ROOT_ADMIN_USERNAME;

  // Inline validation
  const usernameChanged = username !== initialUsername;
  const usernameError =
    usernameChanged && username.length > 0 && username.length < 3
      ? "Username must be at least 3 characters"
      : null;

  const passwordError =
    password.length > 0 && password.length < 8 ? "Password must be at least 8 characters" : null;

  const confirmError =
    password.length > 0 && confirmPassword.length > 0 && password !== confirmPassword
      ? "Passwords don't match"
      : null;

  const hasChanges = (usernameChanged && username.trim().length >= 3) || password.length >= 8;
  const hasErrors = !!usernameError || !!passwordError || !!confirmError;
  const canSave = hasChanges && !hasErrors;

  async function handleSave() {
    if (!canSave) return;
    if (password && confirmPassword !== password) {
      Alert.alert("Error", "Passwords don't match.");
      return;
    }

    setSaving(true);
    try {
      const payload: { username?: string; password?: string } = {};
      if (usernameChanged && username.trim().length >= 3) payload.username = username.trim();
      if (password.length >= 8) payload.password = password;

      await api.patch(`/staff/${id}`, payload);
      Alert.alert("Saved", "Account updated successfully.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err) {
      Alert.alert("Error", err instanceof ApiClientError ? err.message : "Couldn't update account.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView className="flex-1 bg-slate-50">
      <MotiView
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 260 }}
        className="w-full p-4 md:mx-auto md:max-w-lg md:p-6"
      >
        {/* Identity header */}
        <View className="mb-4 flex-row items-center gap-2">
          <View className="h-10 w-10 items-center justify-center rounded-full bg-info-100">
            <User size={18} color="#2563EB" />
          </View>
          <View>
            <Text className="font-heading-semibold text-base text-slate-900">{initialUsername}</Text>
            <View className="flex-row items-center gap-1.5">
              <Badge variant="default">{role}</Badge>
              {isRoot ? <Badge variant="warning">Root</Badge> : null}
            </View>
          </View>
        </View>

        <Text variant="muted" className="mb-5">
          Update the username and/or password for this account. Leave a field blank to keep it unchanged.
        </Text>

        {/* Username */}
        <Card className="relative mb-4 overflow-hidden">
          <DecorativeShapes tone="info" />
          <CardHeader>
            <View className="flex-row items-center gap-2">
              <View className="h-8 w-8 items-center justify-center rounded-full bg-info-100">
                <User size={15} color="#2563EB" />
              </View>
              <CardTitle>Username</CardTitle>
            </View>
          </CardHeader>
          <CardContent>
            <Label className="mb-1">New username</Label>
            <Input
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder={initialUsername}
            />
            {usernameError ? (
              <Text className="mt-1 text-xs font-body-medium text-danger-600">{usernameError}</Text>
            ) : null}
          </CardContent>
        </Card>

        {/* Password */}
        <Card className="relative mb-6 overflow-hidden">
          <DecorativeShapes tone="violet" />
          <CardHeader>
            <View className="flex-row items-center gap-2">
              <View className="h-8 w-8 items-center justify-center rounded-full bg-violet-100">
                <KeyRound size={15} color="#7C3AED" />
              </View>
              <CardTitle>Password</CardTitle>
            </View>
          </CardHeader>
          <CardContent>
            <Label className="mb-1">New password</Label>
            <Input
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="Min. 8 characters"
              className="mb-3"
            />
            {passwordError ? (
              <Text className="mb-2 text-xs font-body-medium text-danger-600">{passwordError}</Text>
            ) : null}
            <Label className="mb-1">Confirm new password</Label>
            <Input
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              placeholder="Re-enter new password"
            />
            {confirmError ? (
              <Text className="mt-1 text-xs font-body-medium text-danger-600">{confirmError}</Text>
            ) : null}
          </CardContent>
        </Card>

        <Button disabled={!canSave} loading={saving} onPress={handleSave}>
          <Save size={16} color="#fff" />
          <Text className="ml-2 font-body-semibold text-base text-white">Save changes</Text>
        </Button>
      </MotiView>
    </ScrollView>
  );
}
