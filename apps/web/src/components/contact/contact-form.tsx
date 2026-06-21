"use client";

import { Container } from "@/components/marketing/container";
import { SectionHeading } from "@/components/marketing/section-heading";
import { Reveal } from "@/components/motion/reveal";
import { submitContactMessage } from "@/lib/api";
import { Button } from "@vva/ui/components/button";
import { Input } from "@vva/ui/components/input";
import { Label } from "@vva/ui/components/label";
import { Textarea } from "@vva/ui/components/textarea";
import { useState } from "react";
import { toast } from "sonner";

type FormState = {
  name: string;
  phone: string;
  subject: string;
  message: string;
  /** Honeypot — real users never see or fill this. */
  website: string;
};

const initialState: FormState = { name: "", phone: "", subject: "", message: "", website: "" };

type FormErrors = Partial<Record<keyof FormState, string>>;

function validate(values: FormState): FormErrors {
  const errors: FormErrors = {};
  if (!values.name.trim()) errors.name = "Please enter your name.";
  if (!values.phone.trim()) errors.phone = "Please enter a contact phone number.";
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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationErrors = validate(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setSubmitting(true);
    try {
      await submitContactMessage({
        name: values.name.trim(),
        phone: values.phone.trim(),
        subject: values.subject.trim(),
        message: values.message.trim(),
        website: values.website,
      });
      toast.success("Message sent", {
        description: "Thanks for reaching out — we'll reply within 2 working days.",
      });
      setValues(initialState);
      setErrors({});
    } catch (error) {
      toast.error("Couldn't send your message", {
        description: error instanceof Error ? error.message : "Please try again in a moment.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="py-20 sm:py-28">
      <Container className="flex flex-col gap-12">
        <Reveal>
          <SectionHeading
            align="center"
            eyebrow="Get In Touch"
            title="Send us a"
            accent="message"
          />
        </Reveal>

        <Reveal delay={0.1} className="mx-auto w-full max-w-2xl">
        <form
          onSubmit={handleSubmit}
          noValidate
          className="flex flex-col gap-5 rounded-3xl border border-border bg-card p-8"
        >
          {/* Honeypot: invisible to real users, often auto-filled by bots. */}
          <div
            className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden"
            aria-hidden="true"
          >
            <Label htmlFor="contact-website">Website</Label>
            <input
              id="contact-website"
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
              <Label htmlFor="contact-phone">Phone Number</Label>
              <Input
                id="contact-phone"
                type="tel"
                className="h-11 rounded-xl text-sm"
                value={values.phone}
                onChange={(event) => handleChange("phone", event.target.value)}
                aria-invalid={Boolean(errors.phone)}
              />
              {errors.phone ? <p className="text-xs text-destructive">{errors.phone}</p> : null}
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
        </Reveal>
      </Container>
    </section>
  );
}
