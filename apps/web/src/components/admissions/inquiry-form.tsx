"use client";

import { Container } from "@/components/marketing/container";
import { SectionHeading } from "@/components/marketing/section-heading";
import { Reveal } from "@/components/motion/reveal";
import { ACADEMIC_LEVELS, LEVEL_LABELS } from "@/lib/academic-levels";
import { submitInquiry } from "@/lib/api";
import { Button } from "@vva/ui/components/button";
import { Input } from "@vva/ui/components/input";
import { Label } from "@vva/ui/components/label";
import { Textarea } from "@vva/ui/components/textarea";
import { useState } from "react";
import { toast } from "sonner";

type FormState = {
  parentName: string;
  email: string;
  phone: string;
  childName: string;
  level: string;
  message: string;
  /** Honeypot — real users never see or fill this. */
  website: string;
};

const initialState: FormState = {
  parentName: "",
  email: "",
  phone: "",
  childName: "",
  level: "",
  message: "",
  website: "",
};

type FormErrors = Partial<Record<keyof FormState, string>>;

function validate(values: FormState): FormErrors {
  const errors: FormErrors = {};
  if (!values.parentName.trim()) errors.parentName = "Please enter your full name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = "Please enter a valid email address.";
  }
  if (!values.phone.trim()) errors.phone = "Please enter a contact phone number.";
  if (!values.childName.trim()) errors.childName = "Please enter your child's name.";
  if (!values.level) errors.level = "Please select an academic level.";
  return errors;
}

type InquiryFormFieldsProps = {
  onSuccess?: () => void;
  /** Same form/endpoint, tagged so staff can tell tour requests from full applications. Defaults to "APPLICATION". */
  type?: "APPLICATION" | "TOUR_REQUEST";
  submitLabel?: string;
};

/**
 * The actual form — fields, validation, and the real backend submission.
 * This is the single source of truth reused both inline on the admissions
 * page (via `InquiryForm` below) and inside the navbar's `InquiryDialog` and
 * `TourDialog`, so all three surfaces behave identically and hit the same API.
 */
export function InquiryFormFields({
  onSuccess,
  type = "APPLICATION",
  submitLabel = "Submit Inquiry",
}: InquiryFormFieldsProps = {}) {
  const [values, setValues] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  function handleChange<K extends keyof FormState>(key: K, value: FormState[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationErrors = validate(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setSubmitting(true);
    try {
      await submitInquiry({
        parentName: values.parentName.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
        childName: values.childName.trim(),
        level: values.level,
        message: values.message.trim() || undefined,
        website: values.website,
        type,
      });
      toast.success(type === "TOUR_REQUEST" ? "Tour request received" : "Inquiry received", {
        description: "Our admissions team will contact you within 3 working days.",
      });
      setValues(initialState);
      setErrors({});
      onSuccess?.();
    } catch (error) {
      toast.error("Couldn't send your inquiry", {
        description: error instanceof Error ? error.message : "Please try again in a moment.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {/* Honeypot: invisible to real users, often auto-filled by bots. */}
      <div className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
        <Label htmlFor="website">Website</Label>
        <input
          id="website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={values.website}
          onChange={(event) => handleChange("website", event.target.value)}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="parentName">Parent / Guardian Name</Label>
          <Input
            id="parentName"
            className="h-11 rounded-xl text-sm"
            value={values.parentName}
            onChange={(event) => handleChange("parentName", event.target.value)}
            aria-invalid={Boolean(errors.parentName)}
          />
          {errors.parentName ? (
            <p className="text-xs text-destructive">{errors.parentName}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            className="h-11 rounded-xl text-sm"
            value={values.email}
            onChange={(event) => handleChange("email", event.target.value)}
            aria-invalid={Boolean(errors.email)}
          />
          {errors.email ? <p className="text-xs text-destructive">{errors.email}</p> : null}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            type="tel"
            className="h-11 rounded-xl text-sm"
            value={values.phone}
            onChange={(event) => handleChange("phone", event.target.value)}
            aria-invalid={Boolean(errors.phone)}
          />
          {errors.phone ? <p className="text-xs text-destructive">{errors.phone}</p> : null}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="childName">Child's Full Name</Label>
          <Input
            id="childName"
            className="h-11 rounded-xl text-sm"
            value={values.childName}
            onChange={(event) => handleChange("childName", event.target.value)}
            aria-invalid={Boolean(errors.childName)}
          />
          {errors.childName ? (
            <p className="text-xs text-destructive">{errors.childName}</p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="level">Academic Level Applying For</Label>
        <select
          id="level"
          className="h-11 w-full rounded-xl border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 dark:bg-input/30"
          value={values.level}
          onChange={(event) => handleChange("level", event.target.value)}
          aria-invalid={Boolean(errors.level)}
        >
          <option value="">Select a level&hellip;</option>
          {ACADEMIC_LEVELS.map((level) => (
            <option key={level} value={level}>
              {LEVEL_LABELS[level]}
            </option>
          ))}
        </select>
        {errors.level ? <p className="text-xs text-destructive">{errors.level}</p> : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="message">Anything else we should know? (optional)</Label>
        <Textarea
          id="message"
          className="min-h-28 rounded-xl text-sm"
          value={values.message}
          onChange={(event) => handleChange("message", event.target.value)}
        />
      </div>

      <Button
        type="submit"
        disabled={submitting}
        className="h-12 self-start rounded-full bg-primary px-8 text-base text-primary-foreground hover:bg-primary/90"
      >
        {submitting ? "Sending…" : submitLabel}
      </Button>
    </form>
  );
}

/** Page-section wrapper around InquiryFormFields, used inline on /admissions. */
export function InquiryForm() {
  return (
    <section className="bg-secondary/40 py-20 sm:py-28">
      <Container className="flex flex-col gap-12">
        <Reveal>
          <SectionHeading
            align="center"
            eyebrow="Admissions Inquiry"
            title="Start your child's"
            accent="VumbaView journey"
            description="Tell us a little about your child and we'll be in touch to guide you through the next steps."
          />
        </Reveal>

        <Reveal delay={0.1} className="mx-auto w-full max-w-2xl">
          <div className="rounded-3xl border border-border bg-card p-8">
            <InquiryFormFields />
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
