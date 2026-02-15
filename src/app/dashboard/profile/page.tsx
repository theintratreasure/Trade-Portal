"use client";

import { useState, type ComponentType } from "react";
import {
  User,
  Mail,
  Phone,
  Calendar,
  UserCheck,
  MapPin,
  Building,
  Globe,
  Hash,
  Pencil,
  X,
  Save,
  ShieldCheck,
  Sparkles,
  BadgeCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";

import {
  DateInput,
  GenderSelect,
  PremiumInput,
} from "@/app/components/ui/TextInput";
import { useUserMe, useUpdateProfile } from "@/hooks/useUser";
import { Toast } from "@/app/components/ui/Toast";

type Gender = "MALE" | "FEMALE";
type KycStatus = "VERIFIED" | "REJECTED" | "PENDING" | "NOT_STARTED" | string;
type FormState = {
  date_of_birth: string;
  gender?: Gender;
  address_line_1: string;
  address_line_2: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
};

const INITIAL_FORM: FormState = {
  date_of_birth: "",
  gender: undefined,
  address_line_1: "",
  address_line_2: "",
  city: "",
  state: "",
  country: "",
  pincode: "",
};

function shouldShowKycButton(status?: string) {
  return !status || status.toUpperCase() === "REJECTED" || status.toUpperCase() === "NOT_STARTED";
}

function getKycBadge(status?: KycStatus) {
  switch (status?.toUpperCase()) {
    case "VERIFIED":
      return {
        text: "Verified",
        wrapper: "bg-emerald-500/12 text-emerald-400 border-emerald-500/20",
        dot: "bg-emerald-400",
      };
    case "REJECTED":
      return {
        text: "Rejected",
        wrapper: "bg-red-500/10 text-red-400 border-red-500/20",
        dot: "bg-red-400",
      };
    case "PENDING":
      return {
        text: "Pending",
        wrapper: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        dot: "bg-amber-400",
      };
    default:
      return {
        text: "Not submitted",
        wrapper: "bg-slate-500/10 text-slate-300 border-slate-500/20",
        dot: "bg-slate-300",
      };
  }
}

export default function ProfilePage() {
  const router = useRouter();
  const { data, isLoading, error } = useUserMe();
  const updateProfile = useUpdateProfile();

  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="inline-flex items-center gap-3 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] px-4 py-2 text-sm text-[var(--text-muted)]">
          <span className="h-2 w-2 animate-ping rounded-full bg-[var(--primary)]" />
          Loading profile...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-[var(--error)]">
        Failed to load profile. Please try again.
      </div>
    );
  }

  if (!data) return null;

  const kycBadge = getKycBadge(data.kycStatus);

  const handleChange =
    <K extends keyof FormState>(key: K) =>
    (value: FormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    };

  const openEditor = () => {
    setForm({
      date_of_birth: data.date_of_birth?.slice(0, 10) || "",
      gender: data.gender === "MALE" || data.gender === "FEMALE" ? data.gender : undefined,
      address_line_1: data.address_line_1 || "",
      address_line_2: data.address_line_2 || "",
      city: data.city || "",
      state: data.state || "",
      country: data.country || "",
      pincode: data.pincode || "",
    });
    setEditOpen(true);
  };

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync({
        date_of_birth: form.date_of_birth,
        gender: form.gender,
        address_line_1: form.address_line_1,
        address_line_2: form.address_line_2,
        city: form.city,
        state: form.state,
        country: form.country,
        pincode: form.pincode,
      });

      setEditOpen(false);
      setToast({ message: "Profile updated successfully", type: "success" });
      setTimeout(() => setToast(null), 3000);
    } catch {
      setToast({ message: "Failed to update profile", type: "error" });
      setTimeout(() => setToast(null), 3000);
    }
  };

  return (
    <>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 p-1.5 md:gap-5 md:p-6">
        <section className="relative overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-3 md:p-5">
          <div className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-[var(--primary)]/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-cyan-400/10 blur-3xl" />

          <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-soft)] bg-[var(--bg-glass)] px-2.5 py-1 text-[10px] text-[var(--text-muted)]">
                <Sparkles size={12} />
                Identity Hub
              </div>
              <h1 className="mt-2 truncate text-lg font-semibold md:text-2xl">Profile Command</h1>
              <p className="mt-1 text-[11px] text-[var(--text-muted)] md:text-xs">
                Secure profile, KYC status and address details in one place.
              </p>
            </div>

            <button
              onClick={openEditor}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2 text-xs font-semibold text-[var(--text-invert)] shadow-lg shadow-[var(--primary)]/30 md:w-auto"
            >
              <Pencil size={15} />
              Edit Profile
            </button>
          </div>

          <div className="relative z-10 mt-4 grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3">
            <MetricTile label="KYC" value={kycBadge.text} icon={ShieldCheck} />
            <MetricTile label="Country" value={data.country || "Not set"} icon={Globe} />
            <MetricTile label="City" value={data.city || "Not set"} icon={Building} />
            <MetricTile
              label="Profile"
              value={data.date_of_birth && data.gender ? "Complete" : "Pending"}
              icon={BadgeCheck}
            />
          </div>
        </section>

        <div className="grid gap-3 md:grid-cols-[1.1fr_0.9fr] md:gap-5">
          <Panel title="Identity" subtitle="Personal and compliance information">
            <InfoRow icon={User} label="Full Name" value={data.name || "-"} />
            <InfoRow
              icon={Mail}
              label="Email"
              value={data.email || "-"}
              action={
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Verified
                </span>
              }
            />
            <InfoRow icon={Phone} label="Phone" value={data.phone || "Not added"} />
            <InfoRow icon={Calendar} label="Date of Birth" value={data.date_of_birth?.slice(0, 10) || "Not set"} />
            <InfoRow icon={UserCheck} label="Gender" value={data.gender || "Not set"} />
            <InfoRow
              icon={ShieldCheck}
              label="KYC"
              value={data.kycStatus || "Not submitted"}
              action={
                shouldShowKycButton(data.kycStatus) ? (
                  <button
                    onClick={() => router.push("/dashboard/kyc")}
                    className="rounded-lg bg-[var(--primary)] px-2.5 py-1 text-[10px] font-medium text-[var(--text-main)]"
                  >
                    Complete KYC
                  </button>
                ) : (
                  <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] ${kycBadge.wrapper}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${kycBadge.dot}`} />
                    {kycBadge.text}
                  </span>
                )
              }
            />
          </Panel>

          <div className="flex flex-col gap-3 md:gap-5">
            <Panel title="Address" subtitle="Default communication address">
              <InfoRow icon={MapPin} label="Address 1" value={data.address_line_1 || "Not set"} />
              <InfoRow icon={MapPin} label="Address 2" value={data.address_line_2 || "-"} />
              <InfoRow
                icon={Building}
                label="City / State"
                value={data.city ? `${data.city}${data.state ? `, ${data.state}` : ""}` : "Not set"}
              />
              <InfoRow icon={Globe} label="Country" value={data.country || "Not set"} />
              <InfoRow icon={Hash} label="Pincode" value={data.pincode || "Not set"} />
            </Panel>

            <section className="rounded-xl border border-dashed border-[var(--border-soft)] bg-[var(--bg-glass)] p-3 text-[11px] text-[var(--text-muted)]">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em]">Note</p>
              <p className="mt-2 leading-relaxed">
                Keep details current so transactions, KYC verification and support responses remain accurate.
              </p>
            </section>
          </div>
        </div>
      </div>

      {editOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/25 p-2 backdrop-blur-sm">
          <div className="w-full max-w-[calc(100vw-1rem)] md:max-w-3xl rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-3 md:p-5">
            <div className="mb-3 flex items-start justify-between gap-3 md:mb-4">
              <div>
                <h2 className="text-sm font-semibold md:text-base">Edit Profile</h2>
                <p className="mt-1 text-[11px] text-[var(--text-muted)]">Update personal details and address information.</p>
              </div>
              <button
                onClick={() => setEditOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border-soft)] bg-[var(--bg-glass)]"
              >
                <X size={15} />
              </button>
            </div>

            <div className="max-h-[74vh] space-y-3 overflow-y-auto pr-1 md:max-h-[66vh] md:space-y-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <DateInput label="Date of birth" value={form.date_of_birth} onChange={handleChange("date_of_birth")} />
                <GenderSelect value={form.gender} onChange={handleChange("gender")} />
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <PremiumInput label="Address line 1" value={form.address_line_1} onChange={handleChange("address_line_1")} icon={MapPin} />
                <PremiumInput label="Address line 2" value={form.address_line_2} onChange={handleChange("address_line_2")} icon={MapPin} />
                <PremiumInput label="City" value={form.city} onChange={handleChange("city")} icon={Building} />
                <PremiumInput label="State" value={form.state} onChange={handleChange("state")} icon={Building} />
                <PremiumInput label="Country" value={form.country} onChange={handleChange("country")} icon={Globe} />
                <PremiumInput label="Pincode" value={form.pincode} onChange={handleChange("pincode")} icon={Hash} />
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[11px] text-[var(--text-muted)]">Changes apply instantly after save.</p>
              <div className="flex gap-2 sm:w-auto">
                <button
                  onClick={() => setEditOpen(false)}
                  className="inline-flex w-1/2 items-center justify-center gap-1 rounded-lg border border-[var(--border-soft)] bg-[var(--bg-glass)] px-3 py-2 text-xs sm:w-auto"
                >
                  <X size={14} />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={updateProfile.isPending}
                  className="inline-flex w-1/2 items-center justify-center gap-1 rounded-lg bg-[var(--primary)] px-3.5 py-2 text-xs font-semibold text-[var(--text-main)] disabled:opacity-70 sm:w-auto"
                >
                  <Save size={14} />
                  {updateProfile.isPending ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-3 md:p-4">
      <div className="mb-2.5 md:mb-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-main)] md:text-sm">{title}</h2>
        <p className="mt-0.5 text-[10px] text-[var(--text-muted)] md:text-[11px]">{subtitle}</p>
      </div>
      <div className="divide-y divide-[var(--border-soft)]">{children}</div>
    </section>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  action,
}: {
  icon: ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <div className="flex min-w-0 items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border-soft)] bg-[var(--bg-glass)] text-[var(--text-soft)] md:h-9 md:w-9">
          <Icon size={15} />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--text-muted)] md:text-[11px]">{label}</p>
          <p className="truncate text-[11px] text-[var(--text-main)] md:text-xs">{value}</p>
        </div>
      </div>
      {action}
    </div>
  );
}

function MetricTile({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: ComponentType<{ size?: number; className?: string }>;
}) {
  return (
    <div className="rounded-lg border border-[var(--border-soft)] bg-[var(--bg-glass)] p-2.5">
      <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)]">
        <span className="truncate">{label}</span>
        <Icon size={13} />
      </div>
      <p className="mt-1 truncate text-xs font-semibold md:text-sm">{value}</p>
    </div>
  );
}
