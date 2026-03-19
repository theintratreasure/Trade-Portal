"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, Upload, CreditCard, Banknote, Bitcoin } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";

import Select from "@/app/components/ui/Select";
import ConfirmModal from "@/app/components/ui/ConfirmModal";
import { Toast } from "@/app/components/ui/Toast";
import SuccessModal from "@/app/components/ui/SuccessModal";

import { useCreateDeposit } from "@/hooks/deposits/useCreateDeposit";
import { useMyAccounts } from "@/hooks/useMyAccounts";
import { useActivePaymentMethods } from "@/hooks/useActivePaymentMethods";
import { useConversionRates } from "@/hooks/useConversion";
import type { PaymentMethod } from "@/services/paymentMethods.service";
import { uploadToCloudinary, type CloudinaryUploadResult } from "@/services/cloudinary.service";

import { getClientIp } from "../../../../../utils/getClientIp";
import type { CurrencyCode } from "@/services/conversion.service";

type DepositMethod = "UPI" | "BANK" | "CRYPTO" | "USDT" | "INTERNATIONAL";
type PaymentMethodOption = {
  value: string;
  label: string;
  method: DepositMethod;
  sourceCurrency: CurrencyCode;
  network?: string;
  conversionRate?: number;
};

const normalizeType = (value: unknown) => String(value || "").trim().toUpperCase();

export default function DepositForm() {
  const { data: accounts = [] } = useMyAccounts();
  const { data: paymentMethods = [] } = useActivePaymentMethods();
  const { data: ratesData } = useConversionRates();

  const createDeposit = useCreateDeposit();

  const searchParams = useSearchParams();
  const router = useRouter();

  const [selectedMethodKey, setSelectedMethodKey] = useState("");
  const [accountId, setAccountId] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [proofCache, setProofCache] = useState<CloudinaryUploadResult | null>(null);
  const [isProofUploading, setIsProofUploading] = useState(false);
  const [ipAddress, setIpAddress] = useState("UNKNOWN");
  const [error, setError] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const proofUploadPromiseRef = useRef<Promise<CloudinaryUploadResult> | null>(null);

  const selectedAccount = accounts.find((a) => a._id === accountId);
  const methodOptions = useMemo<PaymentMethodOption[]>(() => {
    const options = paymentMethods
      .map((pm: PaymentMethod, index) => {
        const t = normalizeType(pm?.type);
        const fallbackValue = `${t || "METHOD"}-${index}`;
        const network = String(pm?.crypto_network || "").trim().toUpperCase();
        const title = String(pm?.title || "").trim();

        if (t === "UPI") {
          return {
            value: pm._id || fallbackValue,
            label: title || "UPI",
            method: "UPI" as const,
            sourceCurrency: "INR" as const,
          };
        }

        if (t === "BANK") {
          const rate = Number(pm?.conversion_rate);
          const hasRate = Number.isFinite(rate) && rate > 0;
          return {
            value: pm._id || fallbackValue,
            label: title || "Bank Transfer",
            method: "BANK" as const,
            sourceCurrency: (hasRate ? "LOCAL" : "INR") as CurrencyCode,
            conversionRate: hasRate ? rate : undefined,
          };
        }

        const isCryptoLike = t === "CRYPTO" || t === "BTC" || !!pm?.crypto_address || !!pm?.crypto_network;
        if (isCryptoLike) {
          const refText = `${title} ${network}`.toUpperCase();
          const cryptoCurrency: CurrencyCode =
            refText.includes("USDT") || refText.includes("TETHER") ? "USDT" : "BTC";
          return {
            value: pm._id || fallbackValue,
            label: title || (network ? `Crypto (${network})` : "Crypto"),
            method: "CRYPTO" as const,
            sourceCurrency: cryptoCurrency,
            network,
          };
        }

        const intlRate = Number(pm?.conversion_rate);
        const intlHasRate = Number.isFinite(intlRate) && intlRate > 0;
        return {
          value: pm._id || fallbackValue,
          label: title || "International",
          method: "INTERNATIONAL" as const,
          sourceCurrency: (intlHasRate ? "LOCAL" : "USDT") as CurrencyCode,
          conversionRate: intlHasRate ? intlRate : undefined,
        };
      })
      .filter(Boolean);

    if (options.length > 0) return options;
    return [
      {
        value: "fallback-usdt",
        label: "International",
        method: "INTERNATIONAL",
        sourceCurrency: "USDT",
      },
    ];
  }, [paymentMethods]);

  const selectedMethodOption = useMemo(
    () => methodOptions.find((opt) => opt.value === selectedMethodKey) || methodOptions[0],
    [methodOptions, selectedMethodKey]
  );
  const selectedPaymentMethod = useMemo(
    () => paymentMethods.find((pm: PaymentMethod) => pm._id === selectedMethodOption?.value),
    [paymentMethods, selectedMethodOption?.value]
  );

  const method = selectedMethodOption?.method || "INTERNATIONAL";
  const sourceCurrency: CurrencyCode = selectedMethodOption?.sourceCurrency || "USDT";
  const manualRate =
    typeof selectedMethodOption?.conversionRate === "number" &&
    Number.isFinite(selectedMethodOption.conversionRate) &&
    selectedMethodOption.conversionRate > 0
      ? selectedMethodOption.conversionRate
      : null;
  const selectedMethodLabel = selectedMethodOption?.label || method;

  useEffect(() => {
    if (!methodOptions.length) return;
    const exists = methodOptions.some((opt) => opt.value === selectedMethodKey);
    if (exists) return;
    setSelectedMethodKey(methodOptions[0].value);
  }, [methodOptions, selectedMethodKey]);

  useEffect(() => {
    if (accountId) return;
    const fromQuery = searchParams.get("account") || searchParams.get("accountId");
    if (!fromQuery) return;
    const exists = accounts.some((a) => a._id === fromQuery);
    if (exists) setAccountId(fromQuery);
  }, [accounts, accountId, searchParams]);

  const numericAmount = Number(amountInput || 0);
  const isValidAmount = Number.isFinite(numericAmount) && numericAmount > 0;
  const isConversionRequired = sourceCurrency !== "USDT";

  useEffect(() => {
    if (!isValidAmount) {
      setConvertedAmount(null);
      return;
    }

    if (sourceCurrency === "USDT") {
      setConvertedAmount(numericAmount);
      return;
    }

    if (manualRate) {
      const usdt = numericAmount / manualRate;
      setConvertedAmount(Number(usdt.toFixed(8)));
      return;
    }

    const rates = ratesData?.data;
    if (!rates) {
      setConvertedAmount(null);
      return;
    }

    if (sourceCurrency === "INR") {
      const usdt = numericAmount / Number(rates.usdtInr || 1);
      setConvertedAmount(Number(usdt.toFixed(8)));
      return;
    }

    if (sourceCurrency === "BTC") {
      const usdt = numericAmount * Number(rates.btcUsdt || 0);
      setConvertedAmount(Number(usdt.toFixed(8)));
      return;
    }

    setConvertedAmount(null);
  }, [isValidAmount, manualRate, numericAmount, ratesData, sourceCurrency]);

  const convertedUsdt = convertedAmount ?? 0;

  const canSubmit =
    !!selectedAccount &&
    isValidAmount &&
    !!file &&
    !createDeposit.isPending &&
    !isSubmitting &&
    (!isConversionRequired || convertedUsdt > 0) &&
    !!convertedAmount;

  const resetForm = () => {
    setAccountId("");
    setSelectedMethodKey(methodOptions[0]?.value || "");
    setAmountInput("");
    setConvertedAmount(null);
    setFile(null);
    setProofCache(null);
    proofUploadPromiseRef.current = null;
    setIsProofUploading(false);
    setError("");
  };

  const handleSubmit = () => {
    setError("");

    if (!selectedAccount) {
      setError("Please select an account");
      return;
    }

    if (!isValidAmount) {
      setError("Enter valid amount");
      return;
    }

    if (isConversionRequired && convertedUsdt <= 0) {
      setError("Unable to convert amount right now. Please try again.");
      return;
    }

    if (!file) {
      setError("Upload payment proof");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Image is too large. Please upload file under 10MB.");
      return;
    }

    setShowConfirm(true);
  };

  const compressImage = useCallback(async (srcFile: File): Promise<File> => {
    if (srcFile.size <= 1.2 * 1024 * 1024) return srcFile;

    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(srcFile);

      img.onload = () => {
        const maxSide = 1280;
        const ratio = Math.min(maxSide / img.width, maxSide / img.height, 1);
        const targetW = Math.round(img.width * ratio);
        const targetH = Math.round(img.height * ratio);

        const canvas = document.createElement("canvas");
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          URL.revokeObjectURL(url);
          resolve(srcFile);
          return;
        }

        ctx.drawImage(img, 0, 0, targetW, targetH);
        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(url);
            if (!blob) {
              resolve(srcFile);
              return;
            }
            resolve(new File([blob], srcFile.name.replace(/\.(png|jpg|jpeg|webp)$/i, "") + ".jpg", { type: "image/jpeg" }));
          },
          "image/jpeg",
          0.78
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(srcFile);
      };
      img.src = url;
    });
  }, []);

  const uploadProofNow = useCallback(async (currentFile: File): Promise<CloudinaryUploadResult> => {
    const optimized = await compressImage(currentFile);
    return uploadToCloudinary(optimized, "deposits");
  }, [compressImage]);

  const getProofWithTimeout = useCallback(
    async (currentFile: File): Promise<CloudinaryUploadResult> => {
      if (proofCache) return proofCache;

      if (!proofUploadPromiseRef.current) {
        proofUploadPromiseRef.current = uploadProofNow(currentFile);
      }

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(
          () => reject(new Error("Upload is slow. Please check internet and try again.")),
          25000
        );
      });

      const proof = await Promise.race([proofUploadPromiseRef.current, timeoutPromise]);
      setProofCache(proof as CloudinaryUploadResult);
      return proof as CloudinaryUploadResult;
    },
    [proofCache, uploadProofNow]
  );

  useEffect(() => {
    let cancelled = false;
    if (!file) return;

    setProofCache(null);
    setIsProofUploading(true);
    const p = uploadProofNow(file);
    proofUploadPromiseRef.current = p;

    p
      .then((proof) => {
        if (!cancelled) setProofCache(proof);
      })
      .catch(() => {
        if (!cancelled) setProofCache(null);
      })
      .finally(() => {
        if (!cancelled) setIsProofUploading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [file, uploadProofNow]);

  useEffect(() => {
    let cancelled = false;
    getClientIp()
      .then((ip) => {
        if (!cancelled && ip) setIpAddress(ip);
      })
      .catch(() => {
        if (!cancelled) setIpAddress("UNKNOWN");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const confirmDeposit = async () => {
    setShowConfirm(false);
    setIsSubmitting(true);
    setError("");

    try {
      const proof = await getProofWithTimeout(file as File);

      await createDeposit.mutateAsync({
        account: selectedAccount!._id,
        amount: Number(convertedUsdt.toFixed(8)),
        method,
        proof,
        ipAddress,
      });

      resetForm();
      setShowSuccessModal(true);
    } catch (err: unknown) {
      const row = err as { response?: { data?: { message?: string } }; message?: string };
      setError(row?.response?.data?.message || row?.message || "Deposit failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const liveAccounts = accounts.filter((acc) => acc.account_type === "live");

  return (
    <>
      <div className="card mx-auto max-w-md animate-dropdown p-3 md:p-6">
        <div className="mb-5 text-center md:mb-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--primary-glow)]">
            <Banknote className="h-8 w-8 text-[var(--primary)]" />
          </div>
          <h1 className="mb-1 text-2xl font-bold text-[var(--text-main)]">Add Funds</h1>
          <p className="text-sm text-[var(--text-muted)]">Deposit with live conversion preview</p>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-3 rounded-xl border border-[var(--error)]/30 bg-[var(--error)]/10 p-3 text-[var(--error)] md:mb-6">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <div className="mb-6 space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-[var(--text-main)]">
            <CreditCard className="h-4 w-4" />
            Select Account
          </label>
          <Select
            value={accountId}
            onChange={setAccountId}
            options={liveAccounts.map((acc) => ({
              value: acc._id,
              label: `${acc.account_number} Balance: $${Number(acc.balance).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`,
            }))}
          />
        </div>

        <div className="mb-6 space-y-2">
          <label className="text-sm font-medium text-[var(--text-main)]">Payment Method</label>
          <Select value={selectedMethodOption?.value || ""} onChange={setSelectedMethodKey} options={methodOptions} />
        </div>

        {method === "BANK" && selectedPaymentMethod && (
          <div className="mb-4 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-glass)] p-3 text-xs text-[var(--text-muted)]">
            <p className="mb-2 font-semibold text-[var(--text-main)]">Bank Transfer Details</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {selectedPaymentMethod.bank_name ? (
                <p>
                  Bank: <span className="font-medium text-[var(--text-main)]">{selectedPaymentMethod.bank_name}</span>
                </p>
              ) : null}
              {selectedPaymentMethod.account_name ? (
                <p>
                  A/C Name: <span className="font-medium text-[var(--text-main)]">{selectedPaymentMethod.account_name}</span>
                </p>
              ) : null}
              {selectedPaymentMethod.account_number ? (
                <p>
                  A/C No: <span className="font-medium text-[var(--text-main)]">{selectedPaymentMethod.account_number}</span>
                </p>
              ) : null}
              {selectedPaymentMethod.ifsc ? (
                <p>
                  IFSC: <span className="font-medium text-[var(--text-main)]">{selectedPaymentMethod.ifsc}</span>
                </p>
              ) : null}
              {selectedPaymentMethod.swift_code ? (
                <p>
                  Swift: <span className="font-medium text-[var(--text-main)]">{selectedPaymentMethod.swift_code}</span>
                </p>
              ) : null}
            </div>
          </div>
        )}

        {method === "CRYPTO" && (
          <div className="mb-4 rounded-lg border border-[var(--border-soft)] bg-[var(--bg-glass)] px-3 py-2 text-xs text-[var(--text-muted)]">
            {sourceCurrency === "BTC" ? (
              <p className="inline-flex items-center gap-2">
                <Bitcoin className="h-4 w-4" />
                Crypto pair: <span className="font-semibold text-[var(--text-main)]">BTCUSDT</span>
              </p>
            ) : (
              <p className="inline-flex items-center gap-2">
                <Bitcoin className="h-4 w-4" />
                USDT wallet deposit (no conversion)
                {selectedMethodOption?.network ? (
                  <span className="font-semibold text-[var(--text-main)]">- {selectedMethodOption.network}</span>
                ) : null}
              </p>
            )}
          </div>
        )}

        <div className="mb-4 space-y-2 md:mb-6">
          <label className="text-sm font-medium text-[var(--text-main)]">
            Amount {sourceCurrency === "LOCAL" ? "(Bank Currency)" : `(${sourceCurrency})`}
          </label>
          <div className="relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
              {sourceCurrency === "LOCAL"
                ? ""
                : sourceCurrency === "INR"
                ? "INR"
                : sourceCurrency === "BTC"
                ? "BTC"
                : "USDT"}
            </div>
            <input
              type="text"
              inputMode="decimal"
              placeholder={
                sourceCurrency === "LOCAL"
                  ? "Amount"
                  : sourceCurrency === "BTC"
                  ? "0.01"
                  : sourceCurrency === "USDT"
                  ? "100"
                  : "20000"
              }
              className="w-full rounded-xl border border-[var(--border-soft)] bg-[var(--bg-glass)] py-2.5 pl-10 pr-4 text-base font-medium text-[var(--text-main)] transition-all duration-200 focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-glow)] md:py-3 md:text-lg"
              value={amountInput}
              onChange={(e) => {
                const cleaned = e.target.value.replace(/[^0-9.]/g, "");
                const dotCount = (cleaned.match(/\./g) || []).length;
                if (dotCount > 1) return;
                setAmountInput(cleaned);
              }}
            />
          </div>

          <div className="rounded-lg border border-[var(--border-soft)] bg-[var(--bg-glass)] px-3 py-2 text-xs text-[var(--text-muted)]">
            {!ratesData?.data && isConversionRequired && !manualRate ? (
              <span>Loading conversion rates...</span>
            ) : (
              <>
                <p>
                  You entered {numericAmount || 0} {sourceCurrency}.{" "}
                  {isConversionRequired ? "Converted deposit amount:" : "Deposit amount:"}{" "}
                  <span className="font-semibold text-[var(--text-main)]">{convertedUsdt.toFixed(4)} USDT</span>
                </p>
                {manualRate && isConversionRequired ? (
                  <p className="mt-1 text-[10px] opacity-80">
                    Rate: 1 USDT = {manualRate} (bank currency)
                  </p>
                ) : ratesData?.data && isConversionRequired ? (
                  <p className="mt-1 text-[10px] opacity-80">
                    Rate: 1 USDT = INR {ratesData.data.usdtInr} | 1 BTC = {ratesData.data.btcUsdt} USDT
                  </p>
                ) : null}
              </>
            )}
          </div>
        </div>

        <div className="mb-5 space-y-2 md:mb-8">
          <label className="flex items-center gap-2 text-sm font-medium text-[var(--text-main)]">
            Payment Proof
            {file && (
              <span className="ml-auto rounded-full border border-[var(--success)]/20 bg-[var(--success)]/10 px-2 py-1 text-xs text-[var(--success)]">
                Selected
              </span>
            )}
          </label>
          <div className="group relative cursor-pointer rounded-2xl border-2 border-dashed border-[var(--border-glass)] p-4 transition-all duration-200 hover:border-[var(--primary)]/50 hover:bg-[var(--primary-glow)] md:p-6">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
            <div className="flex flex-col items-center justify-center text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--bg-glass)] transition-all duration-200 group-hover:bg-[var(--primary)]/10">
                <Upload className="h-6 w-6 text-[var(--text-muted)] transition-all duration-200 group-hover:text-[var(--primary)]" />
              </div>
              <p className="mb-1 text-sm font-medium text-[var(--text-main)]">
                {file ? `${file.name.slice(0, 20)}${file.name.length > 20 ? "..." : ""}` : "Click to upload screenshot"}
              </p>
              <p className="text-xs text-[var(--text-muted)]">PNG, JPG, GIF (Max 5MB)</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-0 bg-[var(--primary)] px-4 py-3 text-base font-semibold text-[var(--text-invert)] shadow-xl transition-all duration-200 hover:-translate-y-0.5 hover:bg-[var(--primary-hover)] hover:shadow-2xl disabled:cursor-not-allowed disabled:opacity-50 disabled:transform-none md:px-6 md:py-4 md:text-lg"
        >
          {createDeposit.isPending || isSubmitting ? (
            <>
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Processing...
            </>
          ) : (
            <>
              Deposit ${convertedUsdt.toFixed(2)}
              <Banknote className="h-5 w-5" />
            </>
          )}
        </button>
        {isProofUploading && (
          <p className="mt-2 text-center text-[11px] text-[var(--text-muted)]">
            Uploading screenshot in background... You can proceed meanwhile.
          </p>
        )}
        {!isProofUploading && file && proofCache && (
          <p className="mt-2 text-center text-[11px] text-[var(--success)]">
            Screenshot uploaded. Ready to proceed.
          </p>
        )}
      </div>

      {showConfirm && (
        <ConfirmModal
          title="Confirm Deposit"
          description={`Entered ${numericAmount || 0} ${sourceCurrency} -> ${convertedUsdt.toFixed(4)} USDT via ${selectedMethodLabel} to account ****${selectedAccount?.account_number?.slice(-4)}.`}
          onConfirm={confirmDeposit}
          onCancel={() => setShowConfirm(false)}
          loading={isSubmitting}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {showSuccessModal && (
        <SuccessModal
          title="Deposit Submitted Successfully"
          message="Your deposit request has been submitted. It will be added and credited to your account once approved."
          actionLabel="Okay"
          onAction={() => router.push("/dashboard/accounts")}
          onClose={() => router.push("/dashboard/accounts")}
        />
      )}
    </>
  );
}
