"use client";

import { Container } from "@/components/marketing/container";
import { SectionHeading } from "@/components/marketing/section-heading";
import { Button } from "@vva/ui/components/button";
import { Input } from "@vva/ui/components/input";
import { Label } from "@vva/ui/components/label";
import { Textarea } from "@vva/ui/components/textarea";
import { useState } from "react";
import { toast } from "sonner";

type FormState = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

const initialState: FormState = { name: "", email: "", subject: "", message: "" };

type FormErrors = Partial<Record<keyof FormState, string>>;

function validate(values: FormState): FormErrors {
  const errors: FormErrors = {};
  if (!values.name.trim()) errors.name = "Please enter your name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = "Please enter a valid email address.";
  }
  if (!values.subject.trim()) errors.subject = "Please enter a subject.";
  if (!values.message.trim()) errors.message = "Please enter a message.";
  return errors;
}

export function ContactForm() {
  const [values, setValues] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  function handleChange<K extends keyof FormState>(key: K, value: FormState[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationErrors = validate(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      toast.success("Message sent", {
        description: "Thanks for reaching out — we'll reply within 2 working days.",
      });
      setValues(initialState);
    }, 600);
  }

  return (
    <section className="py-20 sm:py-28">
      <Container className="flex flex-col gap-12">
        <SectionHeading
          align="center"
          eyebrow="Get In Touch"
          title="Send us a"
          accent="message"
        />

        <form
          onSubmit={handleSubmit}
          noValidate
          className="mx-auto flex w-full max-w-2xl flex-col gap-5 rounded-3xl border border-border bg-card p-8"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="contact-name">Your Name</Label>
              <Input
                id="contact-name"
                className="h-11 rounded-xl text-sm"
                value={values.name}
                onChange={(event) => handleChange("name", event.target.value)}
                aria-invalid={Boolean(errors.name)}
              />
              {errors.name ? <p className="text-xs text-destructive">{errors.name}</p> : null}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="contact-email">Email Address</Label>
              <Input
                id="contact-email"
                type="email"
                className="h-11 rounded-xl text-sm"
                value={values.email}
                onChange={(event) => handleChange("email", event.target.value)}
                aria-invalid={Boolean(errors.email)}
              />
              {errors.email ? <p className="text-xs text-destructive">{errors.email}</p> : null}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="contact-subject">Subject</Label>
            <Input
              id="contact-subject"
              className="h-11 rounded-xl text-sm"
              value={values.subject}
              onChange={(event) => handleChange("subject", event.target.value)}
              aria-invalid={Boolean(errors.subject)}
            />
            {errors.subject ? <p className="text-xs text-destructive">{errors.subject}</p> : null}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="contact-message">Message</Label>
            <Textarea
              id="contact-message"
              className="min-h-32 rounded-xl text-sm"
              value={values.message}
              onChange={(event) => handleChange("message", event.target.value)}
              aria-invalid={Boolean(errors.message)}
            />
            {errors.message ? <p className="text-xs text-destructive">{errors.message}</p> : null}
          </div>

          <Button
            type="submit"
            disabled={submitting}
            className="h-12 self-start rounded-full bg-primary px-8 text-base text-primary-foreground hover:bg-primary/90"
          >
            {submitting ? "Sending…" : "Send Message"}
          </Button>
        </form>
      </Container>
    </section>
  );
}
