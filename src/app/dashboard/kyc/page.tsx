"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Camera,
  CheckCircle,
  Info,
  ScanLine,
  ShieldCheck,
  UploadCloud,
  X,
  XCircle,
} from "lucide-react";
import { useMyKyc, useSubmitKyc } from "@/hooks/useKyc";
import { useCloudinaryUpload } from "@/hooks/useCloudinaryUpload";
import { KycDocumentType, KycImage } from "@/types/kyc";
import { Toast } from "@/app/components/ui/Toast";
import SuccessModal from "@/app/components/ui/SuccessModal";
import KycFaq from "../components/kyc/KycFaq";
import Select from "@/app/components/ui/Select";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

function useObjectUrl(file: File | null): string | undefined {
  const url = useMemo(() => (file ? URL.createObjectURL(file) : undefined), [file]);

  useEffect(() => {
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [url]);

  return url;
}

function refreshIosScrollContainers() {
  if (typeof document === "undefined") return;

  const scrollers = document.querySelectorAll<HTMLElement>(".ios-momentum-scroll");
  scrollers.forEach((el) => {
    const top = el.scrollTop;
    el.style.setProperty("-webkit-overflow-scrolling", "auto");
    void el.offsetHeight;
    el.style.setProperty("-webkit-overflow-scrolling", "touch");
    el.scrollTop = top;
  });
}

export default function KycPage() {
  const { data: myKyc } = useMyKyc();
  const submitKyc = useSubmitKyc();
  const upload = useCloudinaryUpload();

  const [documentType, setDocumentType] = useState<KycDocumentType>("PASSPORT");
  const [front, setFront] = useState<File | null>(null);
  const [back, setBack] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const uploadingRef = useRef(false);

  const frontPreview = useObjectUrl(front);
  const backPreview = useObjectUrl(back);
  const selfiePreview = useObjectUrl(selfie);

  const status = myKyc?.status;

  useEffect(() => {
    const raf1 = window.requestAnimationFrame(() => {
      const raf2 = window.requestAnimationFrame(() => {
        refreshIosScrollContainers();
      });
      return () => window.cancelAnimationFrame(raf2);
    });

    return () => {
      window.cancelAnimationFrame(raf1);
    };
  }, [front, back, selfie]);

  const handleSubmit = useCallback(async () => {
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
          : Promise.resolve<KycImage>({ image_url: "", image_public_id: "" }),
        upload.mutateAsync({ file: selfie, folder: "kyc/selfie" }),
      ]);

      const submittedKyc = await submitKyc.mutateAsync({
        documentType,
        documents: {
          front: frontImg,
          back: backImg,
          selfie: selfieImg,
        },
      });

      setSuccessMessage(
        submittedKyc.status === "PENDING"
          ? "Your KYC was submitted successfully. Verification is now pending."
          : "Your KYC was submitted successfully."
      );
      setFront(null);
      setBack(null);
      setSelfie(null);
    } catch {
      setToast({ message: "Failed to submit KYC", type: "error" });
    } finally {
      uploadingRef.current = false;
      setSubmitting(false);
    }
  }, [back, documentType, front, selfie, submitKyc, upload]);

  const leftView = useMemo(() => {
    if (status === "VERIFIED") {
      return <VerifiedState />;
    }

    if (status === "PENDING") {
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
        frontPreview={frontPreview}
        backPreview={backPreview}
        selfiePreview={selfiePreview}
        setFront={setFront}
        setBack={setBack}
        setSelfie={setSelfie}
        submitting={submitting}
        rejectionReason={myKyc?.rejectionReason}
        onSubmit={handleSubmit}
        onError={(message) => setToast({ message, type: "error" })}
      />
    );
  }, [
    status,
    myKyc,
    documentType,
    front,
    back,
    selfie,
    frontPreview,
    backPreview,
    selfiePreview,
    submitting,
    handleSubmit,
  ]);

  return (
    <div className="mx-auto w-full max-w-6xl px-2 py-1 md:px-4 md:py-6">
      <div className="grid grid-cols-1 gap-3 md:gap-5 lg:grid-cols-[1fr_340px]">
        <section className="relative flex h-[calc(100dvh-9.3rem-env(safe-area-inset-bottom))] min-h-[440px] flex-col overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[linear-gradient(180deg,var(--bg-card),rgba(37,99,235,0.03))] shadow-[0_16px_36px_rgba(15,23,42,0.12)] md:h-auto md:min-h-0">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-r from-[var(--primary)]/8 via-transparent to-[var(--primary)]/6" />

          <div className="relative flex shrink-0 items-center justify-between gap-2 border-b border-[var(--border-soft)] px-3 py-2.5 md:px-5 md:py-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]">Verification</p>
              <h1 className="mt-1 text-base font-semibold tracking-tight md:text-lg">KYC identity check</h1>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-soft)] bg-[var(--bg-glass)] px-2.5 py-1 text-[10px] text-[var(--text-muted)]">
              <Info size={12} />
              <span>2 min avg</span>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-hidden px-3 py-2.5 md:px-5 md:py-5">{leftView}</div>
        </section>

        <aside className="hidden lg:block">
          <KycFaq />
        </aside>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {successMessage && (
        <SuccessModal
          title="KYC Submitted Successfully"
          message={successMessage}
          onClose={() => setSuccessMessage(null)}
        />
      )}
    </div>
  );
}

function VerifiedState() {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 text-center md:min-h-[400px]">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 ring-2 ring-emerald-500/30">
        <ShieldCheck size={28} className="text-[var(--success)]" />
      </div>

      <div className="max-w-md">
        <h2 className="text-lg font-semibold tracking-tight md:text-xl">Identity verified</h2>
        <p className="mt-2 text-xs leading-relaxed text-[var(--text-muted)] md:text-sm">
          Your verification is complete and your account has full access.
        </p>
      </div>

      <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-[11px] text-emerald-600">
        <CheckCircle size={14} />
        <span>All checks completed</span>
      </div>
    </div>
  );
}

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
    <div className="space-y-4">
      <StatusPill icon={<ScanLine size={14} />} text="Verification in progress" color="warning" />

      <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-glass)] px-3 py-2.5 text-[11px] text-[var(--text-muted)]">
        We are reviewing your uploaded documents. This usually completes in a few minutes.
      </div>

      <UploadRow front={front} back={back} selfie={selfie} readOnly />
    </div>
  );
}

function UploadState(props: {
  documentType: KycDocumentType;
  setDocumentType: (v: KycDocumentType) => void;
  front: File | null;
  back: File | null;
  selfie: File | null;
  frontPreview?: string;
  backPreview?: string;
  selfiePreview?: string;
  setFront: (f: File | null) => void;
  setBack: (f: File | null) => void;
  setSelfie: (f: File | null) => void;
  submitting: boolean;
  rejectionReason?: string;
  onSubmit: () => void;
  onError: (message: string) => void;
}) {
  const completeCount = [props.front, props.back, props.selfie].filter(Boolean).length;

  return (
    <div className="flex h-full min-h-0 flex-col gap-2.5 md:gap-4">
      <div className="ios-momentum-scroll min-h-0 flex-1 space-y-2.5 overflow-y-auto pr-1 md:space-y-4">
        {props.rejectionReason && (
          <div className="space-y-1.5">
            <StatusPill icon={<XCircle size={14} />} text={`Rejected: ${props.rejectionReason}`} color="error" />
            <p className="text-[10px] text-[var(--text-muted)] md:text-[11px]">
              Please upload clear photos with all corners visible.
            </p>
          </div>
        )}

        <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-glass)] p-2">
          <Select
            label="Document type"
            value={props.documentType}
            onChange={(val) => props.setDocumentType(val as KycDocumentType)}
            options={[
              { label: "Passport", value: "PASSPORT" },
              { label: "National ID", value: "NIC" },
              { label: "Driving License", value: "DRIVING_LICENSE" },
            ]}
          />
        </div>

        <UploadRow
          front={props.frontPreview}
          back={props.backPreview}
          selfie={props.selfiePreview}
          setFront={props.setFront}
          setBack={props.setBack}
          setSelfie={props.setSelfie}
          loading={props.submitting}
          onError={props.onError}
        />

        <CompactTips />

        <div className="rounded-xl border border-[var(--border-soft)] bg-[linear-gradient(135deg,rgba(37,99,235,0.08),rgba(15,23,42,0.03))] px-3 py-1.5 text-[10px] text-[var(--text-muted)] md:text-[11px]">
          Uploaded <span className="font-semibold text-[var(--text-main)]">{completeCount}/3</span> | Front and Selfie required
        </div>
      </div>

      <button
        onClick={props.onSubmit}
        disabled={props.submitting}
        className="w-full rounded-xl bg-[linear-gradient(90deg,var(--primary),var(--primary-hover))] px-4 py-2.5 text-sm font-semibold text-[var(--text-invert)] shadow-[0_12px_24px_var(--primary-glow)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {props.submitting ? "Submitting verification..." : "Submit verification"}
      </button>
    </div>
  );
}

function UploadRow({
  front,
  back,
  selfie,
  setFront,
  setBack,
  setSelfie,
  loading,
  readOnly,
  onError,
}: {
  front?: string;
  back?: string;
  selfie?: string;
  setFront?: (f: File | null) => void;
  setBack?: (f: File | null) => void;
  setSelfie?: (f: File | null) => void;
  loading?: boolean;
  readOnly?: boolean;
  onError?: (message: string) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2 text-[10px] text-[var(--text-muted)] md:text-[11px]">
        <h3 className="text-xs font-semibold text-[var(--text-main)] md:text-sm">Upload photos</h3>
        <span className="rounded-full border border-[var(--border-soft)] bg-[var(--bg-glass)] px-2 py-0.5">
          JPG/PNG up to 5 MB
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <UploadCard
          index={0}
          label="Front"
          helper="Document front side"
          image={front}
          loading={loading}
          disabled={readOnly}
          onChange={setFront}
          onClear={setFront}
          required
          onError={onError}
        />
        <UploadCard
          index={1}
          label="Back"
          helper="Optional back side"
          image={back}
          loading={loading}
          disabled={readOnly}
          onChange={setBack}
          onClear={setBack}
          onError={onError}
        />
        <UploadCard
          index={2}
          label="Selfie"
          helper="Match face with document"
          image={selfie}
          loading={loading}
          disabled={readOnly}
          onChange={setSelfie}
          onClear={setSelfie}
          required
          onError={onError}
        />
      </div>

    </div>
  );
}

function validateImageFile(file: File): string | null {
  if (!file.type.startsWith("image/")) {
    return "Only image files are allowed (JPG/PNG).";
  }

  if (file.size > MAX_IMAGE_SIZE) {
    return "Image size must be less than 5 MB.";
  }

  return null;
}

function UploadCard({
  index,
  label,
  helper,
  image,
  onChange,
  onClear,
  loading,
  disabled,
  required,
  onError,
}: {
  index: number;
  label: string;
  helper: string;
  image?: string;
  onChange?: (f: File | null) => void;
  onClear?: (f: File | null) => void;
  loading?: boolean;
  disabled?: boolean;
  required?: boolean;
  onError?: (message: string) => void;
}) {
  const hasImage = Boolean(image);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const isDraggingRef = useRef(false);

  const openPicker = () => {
    if (disabled) return;
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      return;
    }
    inputRef.current?.click();
  };

  return (
    <div
      role={disabled ? undefined : "button"}
      tabIndex={disabled ? -1 : 0}
      onPointerDown={(e) => {
        dragStartRef.current = { x: e.clientX, y: e.clientY };
        isDraggingRef.current = false;
      }}
      onPointerMove={(e) => {
        if (!dragStartRef.current) return;
        const dx = Math.abs(e.clientX - dragStartRef.current.x);
        const dy = Math.abs(e.clientY - dragStartRef.current.y);
        if (dx > 8 || dy > 8) isDraggingRef.current = true;
      }}
      onPointerUp={() => {
        dragStartRef.current = null;
      }}
      onClick={openPicker}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openPicker();
        }
      }}
      className={`group relative flex aspect-[1/1] flex-col overflow-hidden rounded-2xl border bg-[var(--bg-glass)] transition ${
        disabled
          ? "cursor-default border-[var(--border-soft)] opacity-70"
          : "cursor-pointer border-[var(--border-soft)] touch-pan-y hover:-translate-y-0.5 hover:border-[var(--primary)] hover:shadow-[0_12px_20px_var(--primary-glow)]"
      }`}
      style={{
        animation: "fadeUp 0.36s ease forwards",
        animationDelay: `${index * 70}ms`,
        opacity: 0,
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(165deg,rgba(255,255,255,0.3),rgba(255,255,255,0.04)_42%,rgba(37,99,235,0.06))]" />
      <div className="pointer-events-none absolute inset-[1px] rounded-[15px] border border-white/20" />

      {hasImage && !loading && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image}
            alt={`${label} preview`}
            className="absolute inset-0 h-full w-full bg-[var(--bg-card)] object-contain object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/58 via-black/8 to-transparent" />
          <div className="absolute left-1.5 top-1.5 rounded-md bg-black/45 px-1.5 py-0.5 text-[9px] font-semibold text-white">
            {label}
          </div>
          {!disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClear?.(null);
              }}
              className="absolute right-1.5 top-1.5 z-10 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/90 text-black shadow"
              aria-label={`Remove ${label} image`}
            >
              <X size={12} />
            </button>
          )}
        </>
      )}

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg-card)]/80 backdrop-blur-sm">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-[var(--border-soft)] border-t-[var(--primary)]" />
        </div>
      )}

      {!hasImage && !loading && (
        <div className="flex flex-1 flex-col items-center justify-center gap-1.5 px-1 text-[var(--text-muted)]">
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-sm">
            {label === "Selfie" ? <Camera size={14} /> : <UploadCloud size={14} />}
          </div>
          <div className="text-center">
            <p className="text-[11px] font-semibold text-[var(--text-main)] mb-9 md:mb-0">
              {label}
              {required && <span className="text-[var(--error)]"> *</span>}
            </p>
            <p className="mt-0.5 px-1 text-[8px] leading-tight text-[var(--text-muted)] hidden md:block">{helper}</p>
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-1.5 bottom-1.5 rounded-md border border-white/25 bg-black/30 px-1.5 py-0.5 text-center text-[9px] font-medium text-white backdrop-blur-sm">
        {hasImage ? "Replace" : "Upload"}
      </div>

      {!disabled && (
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;

            const error = validateImageFile(file);
            if (error) {
              onError?.(error);
              e.target.value = "";
              return;
            }

            onChange?.(file);
            e.target.blur();
          }}
        />
      )}
    </div>
  );
}

function CompactTips() {
  return (
    <div className="rounded-xl border border-[var(--border-soft)] bg-[linear-gradient(135deg,rgba(37,99,235,0.07),rgba(255,255,255,0.02))] px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-main)] md:text-[11px]">
        Quick Tips
      </p>
      <div className="mt-1.5 grid grid-cols-2 gap-1.5 text-[10px] text-[var(--text-muted)] md:text-[11px]">
        <p className="rounded-md bg-[var(--bg-glass)] px-2 py-1">Good lighting</p>
        <p className="rounded-md bg-[var(--bg-glass)] px-2 py-1">No blur or glare</p>
        <p className="rounded-md bg-[var(--bg-glass)] px-2 py-1">All corners visible</p>
        <p className="rounded-md bg-[var(--bg-glass)] px-2 py-1">Face clearly visible</p>
      </div>
    </div>
  );
}

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
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] ${
        isWarning
          ? "border-amber-400/50 bg-amber-50/80 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"
          : "border-red-400/50 bg-red-50/80 text-red-700 dark:bg-red-500/10 dark:text-red-300"
      }`}
    >
      {icon}
      <span className="font-medium">{text}</span>
    </div>
  );
}
