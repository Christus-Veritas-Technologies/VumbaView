"use client";

import { InquiryFormFields } from "@/components/admissions/inquiry-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@vva/ui/components/dialog";
import * as React from "react";
import { useState } from "react";

type InquiryDialogProps = {
  /** The element that opens the dialog when clicked — usually an "Apply Now" Button. */
  trigger: React.ReactElement;
};

/**
 * Wraps the exact same `InquiryFormFields` used inline on /admissions in a
 * modal, so "Apply Now" anywhere on the site (navbar, future CTAs) can
 * collect an application without leaving the current page.
 */
export function InquiryDialog({ trigger }: InquiryDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="max-w-xl rounded-3xl border border-border bg-card p-6 sm:p-8">
        <DialogHeader className="mb-6">
          <DialogTitle className="text-2xl font-bold">
            Start your child&apos;s VumbaView journey
          </DialogTitle>
          <DialogDescription>
            Tell us a little about your child and we&apos;ll be in touch to guide you through the
            next steps.
          </DialogDescription>
        </DialogHeader>
        <InquiryFormFields onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
