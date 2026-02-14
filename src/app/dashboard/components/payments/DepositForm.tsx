"use client";

import { useState, useEffect } from "react";
import { CheckCircle, AlertCircle, Upload, CreditCard, Banknote, Bitcoin } from "lucide-react";
import { useCreateDeposit } from "@/hooks/deposits/useCreateDeposit";
import { useCloudinaryUpload } from "@/hooks/useCloudinaryUpload";
import { useMyAccounts } from "@/hooks/useMyAccounts";
import { getClientIp } from "../../../../../utils/getClientIp";
import ConfirmModal from "@/app/components/ui/ConfirmModal";
import { Toast } from "@/app/components/ui/Toast";
import { useActivePaymentMethods } from "@/hooks/useActivePaymentMethods";
import { useSearchParams } from "next/navigation";
import Select from "@/app/components/ui/Select";

type DepositMethod = "UPI" | "BANK" | "CRYPTO";
export default function DepositForm() {
    const { data: accounts = [] } = useMyAccounts();
    const createDeposit = useCreateDeposit();
    const upload = useCloudinaryUpload();
    const searchParams = useSearchParams();

    const [method, setMethod] = useState<DepositMethod>("UPI");
    const [accountId, setAccountId] = useState("");
    const [amount, setAmount] = useState<number>(0);
    const { data: paymentMethods = [] } = useActivePaymentMethods();
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState("");
    const [showConfirm, setShowConfirm] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const selectedAccount = accounts.find((a) => a._id === accountId);
    const paymentMethodOptions = paymentMethods.reduce(
        (acc: { value: string; label: string }[], pm: any) => {
            const type = pm?.type;
            if (!type) return acc;
            if (acc.some((o) => o.value === type)) return acc;
            acc.push({
                value: type,
                label: pm?.title || type,
            });
            return acc;
        },
        []
    );
    const methodIcons = {
        UPI: <Banknote className="w-5 h-5" />,
        BANK: <CreditCard className="w-5 h-5" />,
        CRYPTO: <Bitcoin className="w-5 h-5" />
    };

    const resetForm = () => {
        setAccountId("");
        setAmount(0);
        setMethod("UPI");
        setFile(null);
        setError("");
    };

    useEffect(() => {
        if (accountId) return;
        const fromQuery = searchParams.get("account") || searchParams.get("accountId");
        if (!fromQuery) return;
        const exists = accounts.some((a) => a._id === fromQuery);
        if (exists) setAccountId(fromQuery);
    }, [accounts, accountId, searchParams]);

    const handleSubmit = async () => {
        setError("");

        if (!selectedAccount) {
            setError("Please select an account");
            return;
        }

        if (!amount || amount <= 0) {
            setError("Enter valid deposit amount (minimum ₹10)");
            return;
        }

        if (!file) {
            setError("Upload payment proof");
            return;
        }

        setShowConfirm(true);
    };

    const confirmDeposit = async () => {
        setShowConfirm(false);
        setIsSubmitting(true);
        setError("");

        try {
            /* Upload proof */
            const proof = await upload.mutateAsync({
                file: file as File,
                folder: "deposits",
            });

            /*  Fetch client IP */
            const ipAddress = await getClientIp();

            /*  Create deposit */
            await createDeposit.mutateAsync({
                account: selectedAccount!._id,
                amount,
                method,
                proof,
                ipAddress,
            });

            // 🎉 Success - Reset & Show Toast
            resetForm();
            setToast({ message: "Deposit submitted successfully", type: "success" });
            setTimeout(() => setToast(null), 3000);

        } catch (err: any) {
            setError(err?.response?.data?.message || "Deposit failed. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };
    const liveAccounts = accounts.filter(
        (acc) => acc.account_type === "live"
    );

    return (
        <>
        
            <div className="card p-3 md:p-6 max-w-md mx-auto animate-dropdown">
                {/* 🏷️ Header */}
                <div className="text-center mb-5 md:mb-8">
                    <div className="w-16 h-16 bg-[var(--primary-glow)] rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Banknote className="w-8 h-8 text-[var(--primary)]" />
                    </div>
                    <h1 className="text-2xl font-bold text-[var(--text-main)] mb-1">
                        Add Funds
                    </h1>
                    <p className="text-sm text-[var(--text-muted)]">
                        Securely deposit to your account
                    </p>
                </div>

                {/* ⚠️ Error */}
                {error && (
                    <div className="bg-[var(--error)]/10 border border-[var(--error)]/30 text-[var(--error)] p-3 rounded-xl mb-4 md:mb-6 flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <span className="text-sm">{error}</span>
                    </div>
                )}



                {/* 💳 Account Select */
                    <><div className="space-y-2 mb-6">
                        <label className="text-sm font-medium text-[var(--text-main)] flex items-center gap-2">
                            <CreditCard className="w-4 h-4" />
                            Select Account
                        </label>
                        <Select
                            value={accountId}
                            onChange={setAccountId}
                            options={liveAccounts.map((acc) => ({
                                value: acc._id,
                                label: `${acc.account_number} Balance: $${Number(
                                    acc.balance
                                ).toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                })}`,
                            }))}
                        />

                    </div>
                        <div className="space-y-2 mb-6">
                            <label className="text-sm font-medium text-[var(--text-main)] flex items-center gap-2">
                                Payment Method
                            </label>
                            <Select
                                value={method}
                                onChange={(v) => setMethod(v as DepositMethod)}
                                options={paymentMethodOptions} />
                        </div></>

                /* 💰 Amount */}
                <div className="space-y-2 mb-4 md:mb-6">
                    <label className="text-sm font-medium text-[var(--text-main)] flex items-center gap-2">
                        Deposit Amount
                    </label>
                    <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                            $
                        </div>
                        <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            min={10}
                            placeholder="1000"
                            className="w-full input-field pl-10 pr-4 py-2.5 md:py-3 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-glass)] focus:ring-2 focus:ring-[var(--primary-glow)] focus:border-[var(--primary)] transition-all duration-200 text-[var(--text-main)] text-base md:text-lg font-medium"
                            value={amount || ""}
                            onChange={(e) => {
                                const onlyDigits = e.target.value.replace(/[^0-9]/g, "");
                                setAmount(onlyDigits ? Number(onlyDigits) : 0);
                            }}
                            onKeyDown={(e) => {
                                if (["e", "E", "+", "-", ".", ","].includes(e.key)) {
                                    e.preventDefault();
                                }
                            }}
                        />

                    </div>
                </div>

                {/* 📸 Proof */}
                <div className="space-y-2 mb-5 md:mb-8">
                    <label className="text-sm font-medium text-[var(--text-main)] flex items-center gap-2">
                        Payment Proof
                        {file && (
                            <span className="ml-auto px-2 py-1 bg-[var(--success)]/10 text-[var(--success)] text-xs rounded-full border border-[var(--success)]/20">
                                Selected
                            </span>
                        )}
                    </label>
                    <div className="relative border-2 border-dashed border-[var(--border-glass)] rounded-2xl p-4 md:p-6 hover:border-[var(--primary)]/50 transition-all duration-200 hover:bg-[var(--primary-glow)] cursor-pointer group">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="flex flex-col items-center justify-center text-center">
                            <div className="w-12 h-12 bg-[var(--bg-glass)] rounded-2xl flex items-center justify-center mb-3 group-hover:bg-[var(--primary)]/10 transition-all duration-200">
                                <Upload className="w-6 h-6 text-[var(--text-muted)] group-hover:text-[var(--primary)] transition-all duration-200" />
                            </div>
                            <p className="text-sm font-medium text-[var(--text-main)] mb-1">
                                {file ? `✅ ${file.name.slice(0, 20)}${file.name.length > 20 ? "..." : ""}` : "Click to upload screenshot"}
                            </p>
                            <p className="text-xs text-[var(--text-muted)]">
                                PNG, JPG, GIF (Max 5MB)
                            </p>
                        </div>
                    </div>
                </div>



                {/* 🚀 Submit */}
                <button
                    onClick={handleSubmit}
                    disabled={!selectedAccount || amount < 50 || !file || createDeposit.isPending || upload.isPending || isSubmitting}
                    className="w-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--text-invert)] font-semibold py-3 md:py-4 px-4 md:px-6 rounded-2xl text-base md:text-lg shadow-xl hover:shadow-2xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center gap-2 border-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                    {createDeposit.isPending || upload.isPending || isSubmitting
                        ? <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Processing...
                        </>
                        : <>
                            Deposit ${amount.toLocaleString()}
                            <Banknote className="w-5 h-5" />
                        </>
                    }
                </button>
            </div>





            {/* 🔍 Confirm Modal */}
            {showConfirm && (
                <ConfirmModal
                    title="Confirm Deposit"
                    description={`You are about to deposit ₹${amount.toLocaleString()} via ${method} to account ****${selectedAccount?.account_number?.slice(-4)}. This action cannot be undone.`}
                    onConfirm={confirmDeposit}
                    onCancel={() => setShowConfirm(false)}
                    loading={isSubmitting}
                />
            )}

            {/* 🎉 Success Toast */}
            {toast && (
                <Toast message={toast.message} type={toast.type} />
            )}


        </>
    );
}
