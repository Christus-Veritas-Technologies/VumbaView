import { useState } from "react";
import { Alert, View } from "react-native";
import { useRouter } from "expo-router";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { api, ApiClientError } from "@/lib/api";
import type { StaffRole } from "@/lib/types";

const ROLE_OPTIONS = [
  { label: "Receptionist", value: "RECEPTIONIST" },
  { label: "Admin", value: "ADMIN" },
];

export default function NewStaffScreen() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<StaffRole>("RECEPTIONIST");
  const [submitting, setSubmitting] = useState(false);

  const isValid = username.trim().length > 0 && password.length >= 6;

  async function handleSubmit() {
    if (!isValid) return;
    setSubmitting(true);
    try {
      await api.post("/staff", { username: username.trim(), password, role });
      router.back();
    } catch (err) {
      Alert.alert("Error", err instanceof ApiClientError ? err.message : "Couldn't create staff account.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View className="w-full flex-1 bg-white p-4 md:mx-auto md:max-w-md md:p-6 lg:max-w-lg">
      <View className="mb-4">
        <Label>Username</Label>
        <Input
          autoCapitalize="none"
          autoCorrect={false}
          value={username}
          onChangeText={setUsername}
          placeholder="e.g. jsmith"
        />
      </View>

      <View className="mb-4">
        <Label>Temporary password</Label>
        <Input secureTextEntry value={password} onChangeText={setPassword} placeholder="At least 6 characters" />
      </View>

      <View className="mb-6">
        <Label>Role</Label>
        <Select
          options={ROLE_OPTIONS}
          value={role}
          onValueChange={(v) => setRole(v as StaffRole)}
          placeholder="Select role"
        />
      </View>

      <Button disabled={!isValid} loading={submitting} onPress={handleSubmit}>
        Create account
      </Button>
    </View>
  );
}
