"use client";

import { useState } from "react";
import { ChevronDown, Download, Landmark, QrCode } from "lucide-react";
import CopyField from "./CopyField";
import { PaymentMethod } from "@/services/paymentMethods.service";

export default function PaymentMethodCard({ method }: { method: PaymentMethod }) {
    const [open, setOpen] = useState(false);

    const downloadImage = async () => {
        if (!method.image_url) return;

        const res = await fetch(method.image_url);
        const blob = await res.blob();

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${method.title.replace(/\s+/g, "_")}.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
    };

    return (
        <div className="card overflow-hidden">
            {/* HEADER */}
            <button
                onClick={() => setOpen(!open)}
                className="flex w-full items-center justify-between p-4"
            >
                <div className="flex items-center gap-3">
                    {method.type === "UPI" ? <QrCode size={20} /> : <Landmark size={20} />}
                    <div className="font-medium">{method.title}</div>
                </div>
                <ChevronDown className={`transition ${open ? "rotate-180" : ""}`} />
            </button>

            {/* DETAILS */}
            {open && (
                <div className="animate-dropdown space-y-4 p-4">
                    {method.image_url && (
                        <div className="flex justify-center">
                            <div className="relative flex items-center gap-3">
                                {/* IMAGE */}
                                <img
                                    src={method.image_url}
                                    alt={method.title}
                                    className="h-44 rounded-lg object-contain"
                                />

                                {/* DOWNLOAD BUTTON */}
                                <div className="group relative">
                                    <button
                                        onClick={downloadImage}
                                        className="rounded-lg bg-[var(--bg-glass)] p-2 hover:scale-105 transition"
                                    >
                                        <Download size={18} />
                                    </button>

                                    {/* HOVER LABEL */}
                                    <span
                                        className="
            pointer-events-none absolute left-1/2 top-full mt-1
            -translate-x-1/2 whitespace-nowrap
            rounded-md bg-black px-2 py-1 text-xs text-[var(--text-main)]
            opacity-0 transition group-hover:opacity-100
          "
                                    >
                                        Download
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}


                    {method.type === "UPI" && method.upi_id && (
                        <CopyField label="UPI ID" value={method.upi_id} />
                    )}
                    {method.type === "CRYPTO" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <CopyField label="Crypto Network" value={method.crypto_network!} />
                        <CopyField label="Crypto Address" value={method.crypto_address!} />
                    </div>
                    )}

                    {method.type === "BANK" && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <CopyField label="Account Name" value={method.account_name!} />
                            <CopyField label="Account Number" value={method.account_number!} />
                            <CopyField label="IFSC Code" value={method.ifsc!} />
                        </div>
                    )}

                    {method.type === "INTERNATIONAL" && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {method.international_name ? (
                                <CopyField label="Account Holder Name" value={method.international_name} />
                            ) : null}
                            {method.international_email ? (
                                <CopyField label="Email" value={method.international_email} />
                            ) : null}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
