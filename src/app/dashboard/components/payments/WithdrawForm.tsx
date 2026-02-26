"use client";

import { useState, useEffect } from "react";
import { useCreateWithdrawal } from "@/hooks/useCreateWithdrawal";
import { useMyAccounts } from "@/hooks/useMyAccounts";
import Select from "@/app/components/ui/Select";
import { PremiumInput } from "@/app/components/ui/TextInput";
import ConfirmModal from "@/app/components/ui/ConfirmModal";
import { Toast } from "@/app/components/ui/Toast";
import SuccessModal from "@/app/components/ui/SuccessModal";
import { useSearchParams } from "next/navigation";

export default function WithdrawForm() {
    const { data: accounts = [] } = useMyAccounts();
    const { mutateAsync, isPending } = useCreateWithdrawal();
    const searchParams = useSearchParams();
    const liveAccounts = accounts.filter((acc: any) => acc.account_type === "live");

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    const [form, setForm] = useState<any>({
        accountId: "",
        amount: "",
        method: "UPI",
        payout: {},
    });

    // Auto hide toast after 3 seconds
    useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(() => setToast(null), 3000);
        return () => clearTimeout(timer);
    }, [toast]);

    useEffect(() => {
        if (form.accountId) return;
        const fromQuery = searchParams.get("account") || searchParams.get("accountId");
        if (!fromQuery) return;
        const exists = liveAccounts.some((a: any) => a._id === fromQuery);
        if (exists) {
            setForm((prev: any) => ({ ...prev, accountId: fromQuery }));
        }
    }, [liveAccounts, form.accountId, searchParams]);

    useEffect(() => {
        if (!form.accountId) return;
        const stillLive = liveAccounts.some((a: any) => a._id === form.accountId);
        if (!stillLive) {
            setForm((prev: any) => ({ ...prev, accountId: "" }));
        }
    }, [liveAccounts, form.accountId]);

    const handleSubmit = async () => {
        // Close modal immediately
        setConfirmOpen(false);

        try {
            await mutateAsync({
                ...form,
                amount: Number(form.amount),
            });

            setShowSuccessModal(true);

            setForm({ accountId: "", amount: "", method: "UPI", payout: {} });

        } catch (err: any) {
            const message =
                err?.response?.data?.message ||
                err?.message ||
                "Something went wrong. Please try again.";

            setToast({
                message,
                type: "error",
            });
        }
    };

    return (
        <div className="card p-3 md:p-6 space-y-4 md:space-y-5 w-full">
            {/* ACCOUNT */}
            <Select
                label="Select Account"
                value={form.accountId}
                onChange={(v) => setForm({ ...form, accountId: v })}
                options={
                    liveAccounts.map((acc: any) => ({
                        label: `${acc.account_number} | $${Number(acc.balance).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                        })}`,
                        value: acc._id,
                    }))
                }
            />

            <PremiumInput
                label="Amount"
                value={form.amount}
                required
                onChange={(v) => {
                    // Remove everything except digits
                    const numericValue = v.replace(/[^0-9]/g, "");

                    // Prevent more than 100000
                    if (Number(numericValue) > 100000) return;

                    setForm({ ...form, amount: numericValue });
                }}
            />


            <Select
                label="Withdrawal Method"
                value={form.method}
                onChange={(v) =>
                    setForm({ ...form, method: v, payout: {} })
                }
                options={[
                    { label: "UPI Transfer", value: "UPI" },
                    { label: "Bank Transfer", value: "BANK" },
                    { label: "Crypto Transfer", value: "CRYPTO" },
                ]}
            />

            {/* Dynamic Fields */}
            {form.method === "UPI" && (
                <PremiumInput
                    label="UPI ID"
                    required
                    value={form.payout?.upi_id || ""}
                    onChange={(v) =>
                        setForm({ ...form, payout: { upi_id: v } })
                    }
                />
            )}

            {form.method === "BANK" && (
                <div className="space-y-4">
                    <PremiumInput
                        label="Bank Name"
                        value={form.payout?.bank_name || ""}
                        onChange={(v) =>
                            setForm({ ...form, payout: { ...form.payout, bank_name: v } })
                        }
                    />
                    <PremiumInput
                        label="Account Holder Name"
                        value={form.payout?.account_holder_name || ""}
                        onChange={(v) =>
                            setForm({ ...form, payout: { ...form.payout, account_holder_name: v } })
                        }
                    />
                    <PremiumInput
                        label="Account Number"
                        value={form.payout?.account_number || ""}
                        onChange={(v) =>
                            setForm({ ...form, payout: { ...form.payout, account_number: v } })
                        }
                    />
                    <PremiumInput
                        label="IFSC Code"
                        value={form.payout?.ifsc || ""}
                        onChange={(v) =>
                            setForm({ ...form, payout: { ...form.payout, ifsc: v } })
                        }
                    />
                </div>
            )}

            {form.method === "CRYPTO" && (
                <div className="space-y-4">
                    <PremiumInput
                        label="Network"
                        value={form.payout?.crypto_network || ""}
                        onChange={(v) =>
                            setForm({ ...form, payout: { ...form.payout, crypto_network: v } })
                        }
                    />
                    <PremiumInput
                        label="Wallet Address"
                        value={form.payout?.crypto_address || ""}
                        onChange={(v) =>
                            setForm({ ...form, payout: { ...form.payout, crypto_address: v } })
                        }
                    />
                </div>
            )}

            <button
                onClick={() => setConfirmOpen(true)}
                disabled={isPending}
                className="w-full rounded-xl bg-[var(--primary)] py-3 text-sm font-medium text-[var(--text-main)] hover:bg-[var(--primary-hover)] transition"
            >
                Submit Withdrawal
            </button>

            {confirmOpen && (
                <ConfirmModal
                    title="Confirm Withdrawal"
                    description="Please confirm that your payout details are correct."
                    onCancel={() => setConfirmOpen(false)}
                    onConfirm={handleSubmit}
                    loading={isPending}
                />
            )}

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            {showSuccessModal && (
                <SuccessModal
                    title="Withdrawal Submitted Successfully"
                    message="Your withdrawal request has been submitted successfully. Funds will be transferred to your selected payout method once approved."
                    actionLabel="Okay"
                    onAction={() => setShowSuccessModal(false)}
                    onClose={() => setShowSuccessModal(false)}
                />
            )}
        </div>
    );
}
