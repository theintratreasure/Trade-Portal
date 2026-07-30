"use client";

import { useState } from "react";
import {
  Mail,
  Send,
  HelpCircle,
  MessageCircleCodeIcon,
} from "lucide-react";
import Select from "@/app/components/ui/Select";
import TipBanner from "@/app/components/ui/TipBanner";
import { useUserMe } from "@/hooks/useUser";
import { useCreateInquiry } from "@/hooks/useInquiry";
import { Toast } from "@/app/components/ui/Toast";

function getErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null) {
    const row = error as { response?: { data?: { message?: string } }; message?: string };
    return row.response?.data?.message || row.message || "Failed to submit ticket.";
  }
  return "Failed to submit ticket.";
}

export default function Support() {
  const { data: user } = useUserMe();
  const createInquiry = useCreateInquiry();
  const [issue, setIssue] = useState("");
  const [message, setMessage] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const handleSubmit = () => {
    if (!issue.trim()) {
      setToast({ message: "Please select issue type.", type: "error" });
      return;
    }

    if (!message.trim()) {
      setToast({ message: "Please enter issue description.", type: "error" });
      return;
    }

    if (!user?.name || !user?.email || !user?.phone) {
      setToast({ message: "Profile data missing. Please update profile first.", type: "error" });
      return;
    }

    const titleMap: Record<string, string> = {
      deposit: "Deposit issue",
      withdraw: "Withdrawal issue",
      trading: "Trading issue",
      other: "Other issue",
    };

    createInquiry.mutate(
      {
        name: user.name,
        email: user.email,
        phone: user.phone,
        title: titleMap[issue] || "Support issue",
        description: message.trim(),
      },
      {
        onSuccess: () => {
          setToast({ message: "Ticket submitted successfully.", type: "success" });
          setMessage("");
          setIssue("");
        },
        onError: (error: unknown) => {
          setToast({ message: getErrorMessage(error), type: "error" });
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-[var(--bg-main)] p-2 md:p-6 lg:p-8 space-y-5 md:space-y-8">

      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-semibold">Support Center</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Need help? Contact us or raise a support ticket.
        </p>
      </div>

      {/* CONTACT CARDS */}
      <div className="grid gap-3 md:gap-4 sm:grid-cols-2">
        {/* WhatsApp */}
        <div className="card p-3 md:p-5 flex items-start gap-3 md:gap-4 hover:shadow-lg transition">
          <div className="h-11 w-11 flex items-center justify-center rounded-xl bg-green-500/10 text-green-500">
            <MessageCircleCodeIcon size={22} />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold">Live Chat Support</h3>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              Coming Soon
            </p>

            {/* <a
              href="https://wa.me/1234567890"
              target="_blank"
              className="inline-flex items-center mt-3 text-sm font-medium text-[var(--primary)] hover:underline"
            >
              Connect now →
            </a> */}
          </div>
        </div>

        {/* Email */}
        <div className="card p-3 md:p-5 flex items-start gap-3 md:gap-4 hover:shadow-lg transition">
          <div className="h-11 w-11 flex items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
            <Mail size={22} />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold">Email Support</h3>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              Send us an email and we’ll respond within 24 hours.
            </p>

            <a
              href="mailto:support@FP.com"
              className="inline-flex items-center mt-3 text-sm font-medium text-[var(--primary)] hover:underline"
            >
              support@FP.com →
            </a>
          </div>
        </div>
      </div>

      {/* MAIN GRID (Ticket + Tips) */}
      <div className="grid gap-4 md:gap-6 lg:grid-cols-12">

        {/* LEFT SIDE – RAISE TICKET (col-6 feel) */}
        <div className="lg:col-span-6">
          <div className="card p-3 md:p-6 rounded-2xl space-y-4 md:space-y-6 h-full">

            <div className="flex items-center gap-3">
              <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-[var(--bg-glass)] text-[var(--primary)]">
                <HelpCircle size={20} />
              </div>
              <h2 className="text-lg font-semibold">Raise a Ticket</h2>
            </div>

            {/* ISSUE SELECT */}
            <Select
              label="Issue Type"
              value={issue}
              onChange={setIssue}
              options={[
                { label: "Deposit issue", value: "deposit" },
                { label: "Withdrawal issue", value: "withdraw" },
                { label: "Trading issue", value: "trading" },
                { label: "Other", value: "other" },
              ]}
            />

            {/* MESSAGE */}
            <textarea
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="
                w-full rounded-xl border border-[var(--border-soft)]
                bg-[var(--bg-card)] px-4 py-3 text-sm resize-none
                outline-none focus:ring-2 focus:ring-[var(--primary)]/30
              "
              placeholder="Explain your issue in detail..."
            />

            {/* SUBMIT */}
            <button
              onClick={handleSubmit}
              disabled={createInquiry.isPending}
              className="
                w-full rounded-xl py-3 text-sm font-medium
                bg-[var(--primary)] text-[var(--text-invert)]
                shadow-[0_10px_25px_var(--primary-glow)]
                transition hover:bg-[var(--primary-hover)]
                disabled:opacity-60
              "
            >
              {createInquiry.isPending ? (
                "Submitting..."
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Send size={16} />
                  Submit Ticket
                </span>
              )}
            </button>
          </div>
        </div>

        {/* RIGHT SIDE – TIPS PANEL */}
        <div className="lg:col-span-6 space-y-4">

          <TipBanner
            title="Before submitting"
            message="Make sure you select the correct issue type and provide your account number inside the message for faster resolution."
          />

          <TipBanner
            title="Response time"
            message="Tickets are usually reviewed within 1–12 hours depending on volume."
          />

          <TipBanner
            title="Priority cases"
            message="Withdrawal and trading issues are handled with high priority."
          />

        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
