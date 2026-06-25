import { useState } from "react";
import { ScrollView, View } from "react-native";
import { MotiView } from "moti";
import { GraduationCap, Users } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  ACADEMIC_LEVELS,
  ENROLLMENT_STATUSES,
  LEVEL_LABELS,
  type AcademicLevel,
  type EnrollmentStatus,
} from "@/lib/types";
import { optionalEmail, optionalPhone, requiredText } from "@/lib/validation";

export interface StudentFormValues {
  fullName: string;
  level: AcademicLevel;
  status: EnrollmentStatus;
  guardianName: string;
  guardianPhone: string;
  guardianEmail: string;
  guardianAddress: string;
}

interface StudentFormProps {
  initial?: Partial<StudentFormValues>;
  submitLabel: string;
  submitting?: boolean;
  showStatus?: boolean;
  onSubmit: (values: StudentFormValues) => void;
}

const LEVEL_OPTIONS = ACADEMIC_LEVELS.map((level) => ({ label: LEVEL_LABELS[level], value: level }));
const STATUS_OPTIONS = ENROLLMENT_STATUSES.map((status) => ({ label: status, value: status }));

export function StudentForm({ initial, submitLabel, submitting, showStatus, onSubmit }: StudentFormProps) {
  const [fullName, setFullName] = useState(initial?.fullName ?? "");
  const [level, setLevel] = useState<AcademicLevel>(initial?.level ?? "FORM_1");
  const [status, setStatus] = useState<EnrollmentStatus>(initial?.status ?? "ACTIVE");
  const [guardianName, setGuardianName] = useState(initial?.guardianName ?? "");
  const [guardianPhone, setGuardianPhone] = useState(initial?.guardianPhone ?? "");
  const [guardianEmail, setGuardianEmail] = useState(initial?.guardianEmail ?? "");
  const [guardianAddress, setGuardianAddress] = useState(initial?.guardianAddress ?? "");
  const [errors, setErrors] = useState<{ fullName?: string; guardianPhone?: string; guardianEmail?: string }>({});

  function handleSubmit() {
    const nextErrors = {
      fullName: requiredText(fullName, "Full name"),
      guardianPhone: optionalPhone(guardianPhone, "Guardian phone"),
      guardianEmail: optionalEmail(guardianEmail, "Guardian email"),
    };
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    onSubmit({
      fullName: fullName.trim(),
      level,
      status,
      guardianName: guardianName.trim(),
      guardianPhone: guardianPhone.trim(),
      guardianEmail: guardianEmail.trim(),
      guardianAddress: guardianAddress.trim(),
    });
  }

  return (
    <ScrollView className="flex-1 bg-white" keyboardShouldPersistTaps="handled">
      {/* Full-width on phone; centered, fixed-width column on tablet so the
          form doesn't stretch edge-to-edge on larger screens. */}
      <MotiView
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 280 }}
        className="w-full p-4 md:mx-auto md:max-w-md md:p-6 lg:max-w-lg"
      >
        <View className="mb-3 flex-row items-center gap-2">
          <GraduationCap size={18} color="#A37A1D" />
          <Text variant="label" className="text-slate-500">
            Student details
          </Text>
        </View>

        <View className="mb-4 flex-col gap-4 md:flex-row">
          <View className="flex-1">
            <Label>Full name</Label>
            <Input value={fullName} onChangeText={setFullName} placeholder="Student's full name" />
            {errors.fullName ? (
              <Text className="mt-1 text-xs font-body-medium text-danger-600">{errors.fullName}</Text>
            ) : null}
          </View>

          <View className="flex-1">
            <Label>Academic level</Label>
            <Select
              options={LEVEL_OPTIONS}
              value={level}
              onValueChange={(v) => setLevel(v as AcademicLevel)}
              placeholder="Select level"
            />
          </View>
        </View>

        {showStatus ? (
          <View className="mb-4">
            <Label>Enrollment status</Label>
            <Select
              options={STATUS_OPTIONS}
              value={status}
              onValueChange={(v) => setStatus(v as EnrollmentStatus)}
              placeholder="Select status"
            />
          </View>
        ) : null}

        <View className="mb-3 mt-2 flex-row items-center gap-2">
          <Users size={18} color="#A37A1D" />
          <Text variant="label" className="text-slate-500">
            Guardian contact
          </Text>
        </View>

        <View className="mb-4 flex-col gap-4 md:flex-row">
          <View className="flex-1">
            <Label>Guardian name</Label>
            <Input value={guardianName} onChangeText={setGuardianName} placeholder="Optional" />
          </View>

          <View className="flex-1">
            <Label>Guardian phone</Label>
            <Input
              value={guardianPhone}
              onChangeText={setGuardianPhone}
              placeholder="Optional"
              keyboardType="phone-pad"
            />
            {errors.guardianPhone ? (
              <Text className="mt-1 text-xs font-body-medium text-danger-600">{errors.guardianPhone}</Text>
            ) : null}
          </View>
        </View>

        <View className="mb-4 flex-col gap-4 md:flex-row">
          <View className="flex-1">
            <Label>Guardian email</Label>
            <Input
              value={guardianEmail}
              onChangeText={setGuardianEmail}
              placeholder="Optional"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {errors.guardianEmail ? (
              <Text className="mt-1 text-xs font-body-medium text-danger-600">{errors.guardianEmail}</Text>
            ) : null}
          </View>

          <View className="flex-1">
            <Label>Guardian address</Label>
            <Input value={guardianAddress} onChangeText={setGuardianAddress} placeholder="Optional" />
          </View>
        </View>

        <Button loading={submitting} disabled={!fullName.trim()} onPress={handleSubmit} className="mt-2">
          {submitLabel}
        </Button>
      </MotiView>
    </ScrollView>
  );
}
