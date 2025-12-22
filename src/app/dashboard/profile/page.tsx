"use client";

import { useEffect, useState } from "react";
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
} from "lucide-react";

import {
  DateInput,
  GenderSelect,
  PremiumInput,
} from "@/app/components/ui/TextInput";

import {
  useUserMe,
  useUpdateProfile,
} from "@/hooks/useUser";
import { Toast } from "@/app/components/ui/Toast";

type Gender = "MALE" | "FEMALE";

export default function ProfilePage() {
  const { data, isLoading, error } = useUserMe();
  const updateProfile = useUpdateProfile();

  const [editOpen, setEditOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [form, setForm] = useState<{
    date_of_birth: string;
    gender?: Gender;
    address_line_1: string;
    address_line_2: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
  }>({
    date_of_birth: "",
    gender: undefined,
    address_line_1: "",
    address_line_2: "",
    city: "",
    state: "",
    country: "",
    pincode: "",
  });

  useEffect(() => {
    if (!data) return;

    setForm({
      date_of_birth: data.date_of_birth?.slice(0, 10) || "",
      gender:
        data.gender === "MALE" || data.gender === "FEMALE"
          ? data.gender
          : undefined,
      address_line_1: data.address_line_1 || "",
      address_line_2: data.address_line_2 || "",
      city: data.city || "",
      state: data.state || "",
      country: data.country || "",
      pincode: data.pincode || "",
    });
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-elevated)] px-4 py-2 shadow-sm">
          <span className="h-2 w-2 animate-ping rounded-full bg-[var(--primary)]" />
          <span className="text-sm text-[var(--text-muted)]">
            Loading your profile…
          </span>
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
  
  const handleChange =
    (key: keyof typeof form) => (value: string | Gender | undefined) => {
      setForm((prev) => ({ ...prev, [key]: value as any }));
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
    setToastMsg("Profile updated successfully");

    setTimeout(() => setToastMsg(null), 3000);
  } catch (err) {
    setToastMsg("Failed to update profile");
    setTimeout(() => setToastMsg(null), 3000);
  }
};


  return (
    <>
      {/* ============= PAGE CONTAINER ============= */}
      <div className="mx-auto w-full flex max-w-6xl flex-col gap-6 p-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[var(--bg-glass)] px-3 py-1 text-[10px] font-medium text-[var(--text-muted)] ring-1 ring-[var(--border-soft)]/70">
              <User className="h-3 w-3" />
              <span>Account Settings</span>
            </div>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight">
              Profile & Preferences
            </h1>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Manage your personal info and address details used across billing and orders.
            </p>
          </div>

          <button
            onClick={() => setEditOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--primary)] px-5 py-2 text-xs font-medium text-[var--(--text-invert)] shadow-lg shadow-[var(--primary)]/30 transition hover:-translate-y-[1px] hover:bg-[var(--primary-dark)]"
          >
            <Pencil size={16} />
            Edit profile
          </button>
        </div>

        {/* Content layout */}
        <div className="grid gap-6 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          {/* Left: Personal info */}
          <Card title="Personal information">
            <SettingRow icon={User} label="Full name" value={data.name || "—"} />
            <SettingRow
              icon={Mail}
              label="Email"
              value={data.email}
              action={
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-[2px] text-[10px] font-medium text-emerald-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Verified
                </span>
              }
            />
            <SettingRow
              icon={Phone}
              label="Phone"
              value={data.phone || "Not added"}
            />
            <SettingRow
              icon={Calendar}
              label="Date of birth"
              value={form.date_of_birth || "Not set"}
            />
            <SettingRow
              icon={UserCheck}
              label="Gender"
              value={form.gender || "Not set"}
            />
          </Card>

          {/* Right: Address + meta */}
          <div className="flex flex-col gap-6">
            <Card title="Address information">
              <SettingRow
                icon={MapPin}
                label="Address line 1"
                value={form.address_line_1 || "Not set"}
              />
              <SettingRow
                icon={MapPin}
                label="Address line 2"
                value={form.address_line_2 || "—"}
              />
              <SettingRow
                icon={Building}
                label="City / State"
                value={
                  form.city
                    ? `${form.city}${form.state ? `, ${form.state}` : ""}`
                    : "Not set"
                }
              />
              <SettingRow
                icon={Globe}
                label="Country"
                value={form.country || "Not set"}
              />
              <SettingRow
                icon={Hash}
                label="Pincode"
                value={form.pincode || "Not set"}
              />
            </Card>

            <div className="rounded-2xl border border-dashed border-[var(--border-soft)] bg-[var(--bg-glass)] p-4 text-xs text-[var(--text-muted)]">
              <p className="font-medium text-[11px] uppercase tracking-[0.12em] text-[var(--text-soft)]">
                Tip
              </p>
              <p className="mt-2">
                Keep your profile and address updated to ensure invoices, delivery,
                and GST details are always correct for high-volume orders.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ============= EDIT MODAL ============= */}
      {editOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[var(--bg-main)]/50 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-elevated)]/95 p-6 shadow-2xl shadow-black/40">
            {/* Modal header */}
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold leading-snug">
                  Edit profile
                </h2>
                <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                  These details are used for billing, communication and shipping.
                </p>
              </div>
              <button
                onClick={() => setEditOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--bg-soft)] text-[var(--text-muted)] transition hover:bg-[var(--bg-hover)]"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal body */}
            <div className="max-h-[65vh] space-y-6 overflow-y-auto pr-1 pt-2">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <DateInput
                  label="Date of birth"
                  value={form.date_of_birth}
                  onChange={handleChange("date_of_birth")}
                />
                <GenderSelect value={form.gender} onChange={handleChange("gender")} />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <PremiumInput
                  label="Address line 1"
                  value={form.address_line_1}
                  onChange={handleChange("address_line_1")}
                  icon={MapPin}
                />
                <PremiumInput
                  label="Address line 2"
                  value={form.address_line_2}
                  onChange={handleChange("address_line_2")}
                  icon={MapPin}
                />
                <PremiumInput
                  label="City"
                  value={form.city}
                  onChange={handleChange("city")}
                  icon={Building}
                />
                <PremiumInput
                  label="State"
                  value={form.state}
                  onChange={handleChange("state")}
                  icon={Building}
                />
                <PremiumInput
                  label="Country"
                  value={form.country}
                  onChange={handleChange("country")}
                  icon={Globe}
                />
                <PremiumInput
                  label="Pincode"
                  value={form.pincode}
                  onChange={handleChange("pincode")}
                  icon={Hash}
                />
              </div>
            </div>

            {/* Modal footer */}
            <div className="mt-6 flex items-center justify-between gap-3">
              <p className="text-[11px] text-[var(--text-muted)]">
                Changes apply instantly across your account once saved.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditOpen(false)}
                  className="inline-flex items-center gap-1 rounded-full border border-[var(--border-soft)] bg-[var(--bg-soft)] px-4 py-2 text-xs font-medium text-[var(--text-muted)] hover:bg-[var(--bg-hover)]"
                >
                  <X size={14} />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={updateProfile.isPending}
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--primary)] px-5 py-2 text-xs font-medium text-white shadow-md shadow-[var(--primary)]/30 transition hover:bg-[var(--primary-dark)] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <Save size={14} />
                  {updateProfile.isPending ? "Saving…" : "Save changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
        {toastMsg && <Toast message={toastMsg} />}


         

    </>
  );
}

/* ============= PRESENTATION COMPONENTS ============= */

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-elevated)]/90 p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
      </div>
      <div className="divide-y divide-[var(--border-soft)]/80">{children}</div>
    </section>
  );
}

function SettingRow({
  icon: Icon,
  label,
  value,
  action,
}: {
  icon: any;
  label: string;
  value: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--bg-soft)] text-[var(--text-soft)] ring-1 ring-[var(--border-soft)]/70">
          <Icon size={18} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-[var(--text-strong)]">
            {label}
          </p>
          <p className="truncate text-[11px] text-[var(--text-muted)]">
            {value}
          </p>
        </div>
      </div>
      {action}
    </div>
    
  );
}
