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

type TourDialogProps = {
  trigger: React.ReactElement;
};

/**
 * Same underlying form/endpoint as InquiryDialog, tagged `type="TOUR_REQUEST"`
 * so it lands in the same admissions pipeline but is distinguishable from a
 * full application once staff-facing triage views exist.
 */
export function TourDialog({ trigger }: TourDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="max-w-xl rounded-3xl border border-border bg-card p-6 sm:p-8">
        <DialogHeader className="mb-6">
          <DialogTitle className="text-2xl font-bold">Book a campus tour</DialogTitle>
          <DialogDescription>
            Tell us a little about your child and we&apos;ll be in touch to schedule your visit.
          </DialogDescription>
        </DialogHeader>
        <InquiryFormFields
          type="TOUR_REQUEST"
          submitLabel="Request a Tour"
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
