import { Container } from "@/components/marketing/container";
import { Eyebrow } from "@/components/marketing/eyebrow";
import { LEVEL_LABELS, type AcademicLevel } from "@/lib/academic-levels";
import { verifyPayment } from "@/lib/api";
import { Button } from "@vva/ui/components/button";
import { CheckCircle2, XCircle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Verify Receipt",
  description: "Verify a VumbaView Academy payment receipt.",
};

// Every lookup is unique to the scanned receipt ID and reflects live server
// data — this must never be served from Next's static/data cache.
export const dynamic = "force-dynamic";

const CATEGORY_LABELS: Record<string, string> = {
  FEES: "School Fees",
  UNIFORMS: "Uniforms",
  CUSTOM: "Other Payment",
};

function formatReadableDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Unknown date";
  return d.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-right text-sm font-semibold text-foreground">{value}</span>
    </div>
  );
}

export default async function VerifyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await verifyPayment(id);

  if (!result.ok) {
    return (
      <section className="py-20 sm:py-28">
        <Container>
          <div className="mx-auto flex max-w-md flex-col items-center gap-4 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <XCircle className="size-7" aria-hidden="true" />
            </span>
            <Eyebrow>Receipt Verification</Eyebrow>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {result.status === 404 ? "Receipt Not Found" : "Verification Unavailable"}
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground">{result.message}</p>
            <Button render={<Link href="/" />} className="mt-2 rounded-full bg-primary px-6 text-primary-foreground hover:bg-primary/90">
              Return Home
            </Button>
          </div>
        </Container>
      </section>
    );
  }

  const payment = result.data;
  const level = LEVEL_LABELS[payment.level as AcademicLevel] ?? payment.level;
  const category = CATEGORY_LABELS[payment.category] ?? payment.category;

  return (
    <section className="py-20 sm:py-28">
      <Container>
        <div className="mx-auto flex max-w-md flex-col items-center gap-4 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <CheckCircle2 className="size-7" aria-hidden="true" />
          </span>
          <Eyebrow>Receipt Verification</Eyebrow>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Payment Verified</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            This receipt was issued by {payment.schoolName} and matches our records.
          </p>
        </div>

        <div className="mx-auto mt-8 w-full max-w-md rounded-none bg-card ring-1 ring-foreground/10">
          <div className="flex items-center gap-3 border-b border-border px-6 py-5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              VV
            </span>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-foreground">{payment.schoolName}</span>
              <span className="text-xs text-muted-foreground">
                Receipt #{payment.receiptId.slice(-8).toUpperCase()}
              </span>
            </div>
          </div>

          <div className="divide-y divide-border px-6">
            <Row label="Student" value={payment.studentName} />
            <Row label="Level" value={level} />
            <Row label="Admission #" value={String(payment.admissionNo)} />
            <Row label="Category" value={category} />
            <Row label="Date" value={formatReadableDate(payment.occurredAt)} />
            <Row label="Amount paid" value={`$${payment.amount.toFixed(2)}`} />
            {payment.discount > 0 ? (
              <>
                <Row label="Discount" value={`-$${payment.discount.toFixed(2)}`} />
                <Row label="Net cash collected" value={`$${payment.netAmount.toFixed(2)}`} />
              </>
            ) : null}
          </div>

          <div className="border-t border-border px-6 py-4">
            <p className="text-center text-xs leading-relaxed text-muted-foreground">
              If anything here looks incorrect, please contact {payment.schoolName} directly before relying on
              this receipt.
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
