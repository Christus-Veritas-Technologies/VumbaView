import { useState } from "react";
import { Alert, View } from "react-native";
import { useRouter } from "expo-router";
import { MotiView } from "moti";
import { UserPlus } from "lucide-react-native";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
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
    <MotiView
      from={{ opacity: 0, translateY: 10 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 280 }}
      className="w-full flex-1 bg-white p-4 md:mx-auto md:max-w-md md:p-6 lg:max-w-lg"
    >
      <View className="mb-6 flex-row items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
        <View className="h-10 w-10 items-center justify-center rounded-full bg-gold-100">
          <UserPlus size={18} color="#A37A1D" />
        </View>
        <View>
          <Text variant="subheading">New staff account</Text>
          <Text variant="muted">Create sign-in access for a receptionist or admin.</Text>
        </View>
      </View>

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
        <UserPlus size={16} color="#fff" />
        <Text className="ml-2 font-body-semibold text-base text-white">Create account</Text>
      </Button>
    </MotiView>
  );
}
