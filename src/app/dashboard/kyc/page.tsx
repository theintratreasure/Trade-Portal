"use client";

import { useMemo, useRef, useState } from "react";
import {
  ShieldCheck,
  UploadCloud,
  ScanLine,
  CheckCircle,
  XCircle,
  Info,
} from "lucide-react";
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
import { useMyKyc, useSubmitKyc } from "@/hooks/useKyc";
import { useCloudinaryUpload } from "@/hooks/useCloudinaryUpload";
import { KycDocumentType, KycImage } from "@/types/kyc";
import { Toast } from "@/app/components/ui/Toast";
import KycFaq from "../components/kyc/KycFaq";
import Select from "@/app/components/ui/Select";

export default function KycPage() {
  const { data: myKyc } = useMyKyc();
  const submitKyc = useSubmitKyc();
  const upload = useCloudinaryUpload();

  const [documentType, setDocumentType] =
    useState<KycDocumentType>("PASSPORT");

  const [front, setFront] = useState<File | null>(null);
  const [back, setBack] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const uploadingRef = useRef(false);

  const status = myKyc?.status; // VERIFIED | PENDING | REJECTED | undefined

  const handleSubmit = async () => {
    if (!front || !selfie) {
      setToast({ message: "Front image and selfie are required", type: "error" });
      return;
    }

    if (uploadingRef.current) return;

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

      submitKyc.mutate({
        documentType,
        documents: {
          front: frontImg,
          back: backImg,
          selfie: selfieImg,
        },
      });

      setToast({ message: "KYC submitted successfully", type: "success" });
      setFront(null);
      setBack(null);
      setSelfie(null);
    } catch {
      setToast({ message: "Failed to submit KYC", type: "error" });
    } finally {
      uploadingRef.current = false;
      setSubmitting(false);
    }
  };

  const leftView = useMemo(() => {
    if (status === "VERIFIED") {
      return <VerifiedState />;
    }

    if (status === "PENDING") {
      // yaha backend se aayi LAST SUBMITTED images ka preview
      return (
        <PendingState
          front={myKyc?.documents?.front?.image_url || undefined}
          back={myKyc?.documents?.back?.image_url || undefined}
          selfie={myKyc?.documents?.selfie?.image_url || undefined}
        />
      );
    }

    return (
      <UploadState
        documentType={documentType}
        setDocumentType={setDocumentType}
        front={front}
        back={back}
        selfie={selfie}
        setFront={setFront}
        setBack={setBack}
        setSelfie={setSelfie}
        submitting={submitting}
        rejectionReason={myKyc?.rejectionReason}
        onSubmit={handleSubmit}
      />
    );
  }, [status, myKyc, documentType, front, back, selfie, submitting]);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 md:gap-8 px-2 md:px-4 lg:px-6 py-4 md:py-10 lg:py-14 min-w-0">
      {/* LEFT PANEL */}
      <section
        className="
          flex-1 rounded-3xl border border-[var(--border-soft)]
          bg-[var(--bg-card)] shadow-[0_18px_45px_rgba(15,23,42,0.10)]
          relative overflow-hidden
        "
      >
        {/* subtle top gradient strip */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[var(--primary)]/40 via-[var(--primary)] to-[var(--primary)]/40" />

        <div className="flex items-center justify-between gap-3 border-b border-[var(--border-soft)] px-3 md:px-6 py-3 md:py-5">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
              Account verification
            </p>
            <h1 className="mt-1 text-lg font-semibold tracking-tight">
              Verify your identity
            </h1>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-[var(--bg-glass)] px-3 py-1 text-[10px] text-[var(--text-muted)]">
            <Info size={13} />
            <span>Usually takes under 2 minutes</span>
          </div>
        </div>

        <div className="px-3 md:px-6 pb-4 md:pb-6 pt-4 md:pt-5 min-w-0">{leftView}</div>
      </section>

      {/* RIGHT PANEL */}
      <aside className="w-full md:w-[320px] lg:w-[360px]">
        <KycFaq />
      </aside>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

/* VERIFIED */

function VerifiedState() {
  return (
    <div className="flex min-h-[440px] flex-col items-center justify-center gap-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 ring-2 ring-emerald-500/40">
        <ShieldCheck size={32} className="text-[var(--success)]" />
      </div>
      <div className="max-w-md">
        <h2 className="text-xl font-semibold tracking-tight">
          Identity verified
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
          Your account has been fully verified and is now trusted for all
          platform operations with higher limits and fewer interruptions.
        </p>
      </div>
      <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-[var(--bg-glass)] px-4 py-2 text-[11px] text-[var(--text-muted)]">
        <CheckCircle size={14} className="text-[var(--success)]" />
        <span>All verification checks completed</span>
      </div>
    </div>
  );
}

/* PENDING */

function PendingState({
  front,
  back,
  selfie,
}: {
  front?: string;
  back?: string;
  selfie?: string;
}) {
  return (
    <div className="space-y-6">
      <StatusPill
        icon={<ScanLine size={14} />}
        text="Verification in progress"
        color="warning"
      />

      <div className="rounded-2xl bg-[var(--bg-glass)] px-4 py-3 text-[11px] text-[var(--text-muted)]">
        <p>
          We are reviewing your documents. This usually takes a few minutes, but
          can sometimes take longer during peak times.
        </p>
      </div>

      {/* yaha LAST SUBMITTED preview dikh raha hai */}
      <UploadRow
        front={front}
        back={back}
        selfie={selfie}
        // loading
        readOnly
      />
    </div>
  );
}

/* UPLOAD */

function UploadState(props: {
  documentType: KycDocumentType;
  setDocumentType: (v: KycDocumentType) => void;
  front: File | null;
  back: File | null;
  selfie: File | null;
  setFront: (f: File | null) => void;
  setBack: (f: File | null) => void;
  setSelfie: (f: File | null) => void;
  submitting: boolean;
  rejectionReason?: string;
  onSubmit: () => void;
}) {
  const { documentType, setDocumentType } = props;

  return (
    <div className="space-y-8">
      {props.rejectionReason && (
        <div className="space-y-3">
          <StatusPill
            icon={<XCircle size={14} />}
            text={`Rejected: ${props.rejectionReason}`}
            color="error"
          />
          <p className="text-[11px] text-[var(--text-muted)]">
            Please upload clear photos that match your legal document. Make sure
            all corners are visible and text is readable.
          </p>
        </div>
      )}

     <div className="space-y-2">
  <Select
    label="Document type"
    value={documentType}
    onChange={(val) => setDocumentType(val as KycDocumentType)}
    options={[
      // { label: "Select document type", value: "" },
      { label: "Passport", value: "PASSPORT" },
      { label: "National ID", value: "NIC" },
      { label: "Driving License", value: "DRIVING_LICENSE" },
    ]}
  />
</div>


      {/* Upload mode: local File → object URL preview */}
      <UploadRow
        front={props.front ? URL.createObjectURL(props.front) : undefined}
        back={props.back ? URL.createObjectURL(props.back) : undefined}
        selfie={props.selfie ? URL.createObjectURL(props.selfie) : undefined}
        setFront={props.setFront}
        setBack={props.setBack}
        setSelfie={props.setSelfie}
        loading={props.submitting}
      />

      <div className="flex items-center justify-between gap-3 text-[11px] text-[var(--text-muted)]">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--primary)]/10 text-[var(--primary)] text-[10px]">
            1
          </span>
          <span>Upload front, back (optional) and selfie</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--primary)]/10 text-[var(--primary)] text-[10px]">
            2
          </span>
          <span>Submit and wait for review</span>
        </div>
      </div>

      <button
        onClick={props.onSubmit}
        disabled={props.submitting}
        className="
          relative mt-2 w-full overflow-hidden rounded-full
          bg-[var(--primary)] py-3 text-sm font-medium
          text-[var(--text-invert)] shadow-[0_12px_30px_var(--primary-glow)]
          transition hover:bg-[var(--primary-hover)]
          disabled:cursor-not-allowed disabled:opacity-60
        "
      >
        <span className="relative z-10">
          {props.submitting ? "Submitting verification…" : "Submit verification"}
        </span>
        <span
          className="
            pointer-events-none absolute inset-y-0 left-0 w-1/3
            translate-x-[-100%] bg-gradient-to-r from-white/40 to-transparent
            opacity-0 transition-all duration-700
            group-hover:translate-x-[250%] group-hover:opacity-100
          "
        />
      </button>
    </div>
  );
}

/* UPLOAD ROW */

function UploadRow({
  front,
  back,
  selfie,
  setFront,
  setBack,
  setSelfie,
  loading,
  readOnly,
}: {
  front?: string;
  back?: string;
  selfie?: string;
  setFront?: (f: File | null) => void;
  setBack?: (f: File | null) => void;
  setSelfie?: (f: File | null) => void;
  loading?: boolean;
  readOnly?: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">Upload photos</h3>
          <p className="mt-1 text-[11px] text-[var(--text-muted)]">
            Use a clear camera, avoid glare and reflections. All text should be
            readable.
          </p>
        </div>
        <span className="rounded-full bg-[var(--bg-glass)] px-3 py-1 text-[10px] text-[var(--text-muted)]">
          JPG, PNG • max 5 MB
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <UploadCard
          label="Front"
          helper="Front side of your document"
          image={front}
          loading={loading}
          disabled={readOnly}
          onChange={setFront}
          required
        />
        <UploadCard
          label="Back"
          helper="Back side (if applicable)"
          image={back}
          loading={loading}
          disabled={readOnly}
          onChange={setBack}
        />
        <UploadCard
          label="Selfie"
          helper="Selfie matching your document"
          image={selfie}
          loading={loading}
          disabled={readOnly}
          onChange={setSelfie}
          required
        />
      </div>
    </div>
  );
}

function validateImageFile(file: File): string | null {
  if (!file.type.startsWith("image/")) {
    return "Only image files are allowed (JPG, PNG)";
  }

  if (file.size > MAX_IMAGE_SIZE) {
    return "Image size must be less than 5 MB";
  }

  return null;
}

/* UPLOAD CARD */

function UploadCard({
  label,
  helper,
  image,
  onChange,
  loading,
  disabled,
  required,
}: {
  label: string;
  helper?: string;
  image?: string;
  onChange?: (f: File | null) => void;
  loading?: boolean;
  disabled?: boolean;
  required?: boolean;
}) {
  const hasImage = !!image;

  return (
    <label
      className={`
        group relative flex h-48 flex-col overflow-hidden
        rounded-2xl border border-[var(--border-soft)]
        bg-[var(--bg-glass)] p-3 transition
        ${disabled
          ? "cursor-default opacity-60"
          : "cursor-pointer hover:border-[var(--primary)] hover:shadow-[0_14px_30px_rgba(15,23,42,0.14)]"
        }
      `}
    >
      {/* preview image */}
      {hasImage && !loading && (
        <>
          <img
            src={image}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
          <CheckCircle className="absolute right-3 top-3 text-[var(--success)] drop-shadow-md" />
        </>
      )}

      {/* loading overlay */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg-card)]/80 backdrop-blur">
          <div className="relative h-20 w-20 overflow-hidden rounded-2xl border border-[var(--border-soft)]">
            <div className="absolute inset-x-0 top-0 h-1 animate-scan bg-[var(--primary)]" />
          </div>
        </div>
      )}

      {/* empty state */}
      {!hasImage && !loading && (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-[var(--text-muted)]">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--bg-card)] shadow-sm ring-1 ring-[var(--border-soft)]">
            <UploadCloud size={18} />
          </div>
          <span className="text-xs font-medium">
            Upload {label}
            {required && <span className="text-[var(--error)]"> *</span>}
          </span>
          <span className="text-[10px]">{helper}</span>
        </div>
      )}

      {/* bottom label bar */}
      <div
        className="
          pointer-events-none absolute inset-x-2 bottom-2 flex items-center justify-between
          rounded-full bg-[var(--bg-card)]/85 px-3 py-[4px] text-[10px]
          text-[var(--text-muted)] shadow-sm backdrop-blur
        "
      >
        <span className="font-medium">{label}</span>
        {hasImage && !loading && (
          <span className="text-[9px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
            Preview
          </span>
        )}
      </div>

      {!disabled && (
        <input
          type="file"
          hidden
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;

            const error = validateImageFile(file);
            if (error) {
              alert(error); // OR Toast (see step 4)
              e.target.value = "";
              return;
            }

            onChange?.(file);
          }}
        />
      )}
    </label>
  );
}

/* STATUS PILL */

function StatusPill({
  text,
  color,
  icon,
}: {
  text: string;
  color: "warning" | "error";
  icon: React.ReactNode;
}) {
  const isWarning = color === "warning";

  return (
    <div
      className={`
        inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px]
        ${isWarning
          ? "border-amber-400/60 bg-amber-50/80 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"
          : "border-red-400/60 bg-red-50/80 text-red-700 dark:bg-red-500/10 dark:text-red-300"
        }
      `}
    >
      {icon}
      <span className="font-medium">{text}</span>
    </div>
  );
}
