"use client";

import { useRef, useState } from "react";
import { ShieldCheck, UploadCloud } from "lucide-react";
import { useMyKyc, useSubmitKyc } from "@/hooks/useKyc";
import { useCloudinaryUpload } from "@/hooks/useCloudinaryUpload";
import { KycDocumentType, KycImage } from "@/types/kyc";
import { Toast } from "@/app/components/ui/Toast";
import KycFaq from "../components/kyc/KycFaq";

export default function KycPage() {
  const { data: myKyc } = useMyKyc();
  const submitKyc = useSubmitKyc();
  const upload = useCloudinaryUpload();

  const [documentType, setDocumentType] =
    useState<KycDocumentType>("PASSPORT");

  const [front, setFront] = useState<File | null>(null);
  const [back, setBack] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);

  const [toast, setToast] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const uploadingRef = useRef(false);
  const uploadedRef = useRef(false);

  const isPending = myKyc?.status === "PENDING";
  const isVerified = myKyc?.status === "VERIFIED";
  const isRejected = myKyc?.status === "REJECTED";

  /* ================= VERIFIED ================= */
  if (isVerified) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-elevated)] p-10 text-center shadow-sm">
          <ShieldCheck className="mx-auto mb-4 text-[var(--success)]" />
          <h2 className="text-xl font-semibold">KYC Approved</h2>
          <p className="mt-2 text-xs text-[var(--text-muted)]">
            Your identity has been successfully verified.
          </p>
        </div>
      </div>
    );
  }

  /* ================= SUBMIT ================= */
  const handleSubmit = async () => {
    if (!front || !selfie) {
      setToast("Front image and selfie are required");
      return;
    }

    if (uploadingRef.current || uploadedRef.current) return;

    uploadingRef.current = true;
    setSubmitting(true);

    try {
      const [frontImg, backImg, selfieImg] = await Promise.all([
        upload.mutateAsync({ file: front, folder: "kyc/front" }),
        back
          ? upload.mutateAsync({ file: back, folder: "kyc/back" })
          : Promise.resolve<KycImage>({
              image_url: "",
              image_public_id: "",
            }),
        upload.mutateAsync({ file: selfie, folder: "kyc/selfie" }),
      ]);

      uploadedRef.current = true;

      submitKyc.mutate({
        documentType,
        documents: {
          front: frontImg,
          back: backImg,
          selfie: selfieImg,
        },
      });

      setToast("KYC submitted successfully");
    } catch {
      setToast("Failed to upload documents");
      uploadingRef.current = false;
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full grid max-w-6xl gap-8 px-6 py-12 md:grid-cols-3">
      {/* ================= LEFT ================= */}
      <section className="md:col-span-2 rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-elevated)] p-6 shadow-sm">
        {/* Header */}
        <div className="mb-6 flex items-start gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--bg-soft)] ring-1 ring-[var(--border-soft)]/70">
            <UploadCloud size={18} />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-tight">
              Identity verification
            </h2>
            <p className="mt-1 text-[11px] text-[var(--text-muted)]">
              Upload your documents to complete KYC
            </p>
          </div>
        </div>

        {/* STATUS */}
        {isPending && (
          <StatusBanner
            color="warning"
            text="Your KYC is currently under review"
          />
        )}

        {isRejected && (
          <StatusBanner
            color="error"
            text={`Rejected: ${myKyc?.rejectionReason}`}
          />
        )}

        {/* DOCUMENT TYPE */}
        <div className="mt-6">
          <label className="text-[11px] font-medium text-[var(--text-muted)]">
            Document type
          </label>
          <select
            disabled={isPending}
            value={documentType}
            onChange={(e) =>
              setDocumentType(e.target.value as KycDocumentType)
            }
            className="mt-2 w-full rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] px-4 py-3 text-sm"
          >
            <option value="PASSPORT">Passport</option>
            <option value="NIC">National ID</option>
            <option value="DRIVING_LICENSE">Driving license</option>
          </select>
        </div>

        {/* UPLOADS */}
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <FileBox label="Front image" onChange={setFront} disabled={isPending} />
          <FileBox label="Back image" onChange={setBack} disabled={isPending} />
          <FileBox label="Selfie" onChange={setSelfie} disabled={isPending} />
        </div>

        {/* SUBMIT */}
        <button
          onClick={handleSubmit}
          disabled={isPending || submitting}
          className="mt-8 w-full rounded-full bg-[var(--primary)] px-6 py-3 text-sm font-medium text-white shadow-lg shadow-[var(--primary)]/30 transition hover:bg-[var(--primary-hover)] disabled:opacity-60"
        >
          {submitting ? "Submitting…" : "Submit KYC"}
        </button>
      </section>

      {/* ================= RIGHT ================= */}
      <div className="flex flex-col gap-6">
        <KycFaq />
      </div>

      {toast && <Toast message={toast} />}
    </div>
  );
}

/* ================= HELPERS ================= */

function FileBox({
  label,
  onChange,
  disabled,
}: {
  label: string;
  onChange: (f: File | null) => void;
  disabled?: boolean;
}) {
  return (
    <label
      className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--border-soft)] bg-[var(--bg-soft)] px-4 py-6 text-center transition hover:border-[var(--primary)]
      ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
    >
      <UploadCloud size={18} className="text-[var(--text-muted)]" />
      <p className="text-xs font-medium">{label}</p>
      <p className="text-[10px] text-[var(--text-muted)]">
        Click to upload
      </p>
      <input
        type="file"
        disabled={disabled}
        onChange={(e) => onChange(e.target.files?.[0] || null)}
        className="hidden"
      />
    </label>
  );
}

function StatusBanner({
  text,
  color,
}: {
  text: string;
  color: "warning" | "error";
}) {
  return (
    <div
      className={`mt-4 rounded-xl border px-4 py-3 text-xs
        ${
          color === "warning"
            ? "border-[var(--warning)] text-[var(--warning)]"
            : "border-[var(--error)] text-[var(--error)]"
        }`}
    >
      {text}
    </div>
  );
}
