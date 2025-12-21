"use client";

import { Plus, Minus, ShieldCheck } from "lucide-react";
import { useState } from "react";

type FaqItem = {
  id: number;
  question: string;
  answer: string;
};

const FAQS: FaqItem[] = [
  {
    id: 1,
    question: "What is KYC verification?",
    answer:
      "KYC (Know Your Customer) verification is a process of identity verification and due diligence aimed at verifying a customer's identity information and background to ensure that financial institutions or service providers comply with Anti-Money Laundering (AML) and Countering the Financing of Terrorism (CFT) regulations. It helps protect account security and reduce the risks of fraud and illegal activities.",
  },
  {
    id: 2,
    question: "Why is KYC verification required?",
    answer:
      "KYC verification is to protect your account security and interests. By verifying your identity information and background, it prevents others from impersonating you to commit fraud or illegal activities.",
  },
  {
    id: 3,
    question: "What documents are required for KYC verification?",
    answer:
      "Typically, you will need to provide the following information and documents: identification proof (such as a passport, driver's license, or ID card), a personal photo, address proof (recent bank or credit card statements, utility bills, etc.). In some cases, you may be required to provide additional documents or information to meet specific regulatory requirements. Please note that the KYC verification process is designed to protect your security, and your information will be safeguarded by the institution and used solely for lawful and compliant purposes. If you have questions about a specific institution's KYC requirements, it is recommended that you contact the institution directly for accurate information and guidance.",
  },
];

export default function KycFaq() {
  const [openId, setOpenId] = useState<number | null>(2);

  const handleToggle = (id: number) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <section className="rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-elevated)]/90 p-5 shadow-sm text-md">
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--bg-soft)] ring-1 ring-[var(--border-soft)]/70">
          <ShieldCheck size={18} />
        </div>
        <div>
          <h3 className="text-sm font-semibold tracking-tight">
            KYC FAQs
          </h3>
          <p className="text-[11px] text-[var(--text-muted)]">
            Identity verification & compliance
          </p>
        </div>
      </div>

      {/* FAQ List */}
      <div className="divide-y divide-[var(--border-soft)]/80">
        {FAQS.map((item) => {
          const isOpen = openId === item.id;

          return (
            <div key={item.id} className="py-3">
              {/* Question */}
              <button
                type="button"
                onClick={() => handleToggle(item.id)}
                className="flex w-full items-center justify-between gap-4 text-left"
              >
                <span className="text-xs font-medium text-[var(--text-strong)]">
                  {item.question}
                </span>

                <span
                  className="
                    flex h-7 w-7 items-center justify-center
                    rounded-full border border-[var(--border-soft)]
                    bg-[var(--bg-soft)] text-[var(--text-muted)]
                    transition-transform duration-300
                  "
                >
                  {isOpen ? <Minus size={14} /> : <Plus size={14} />}
                </span>
              </button>

              {/* Answer */}
              <div
                className={`
                  grid transition-all duration-300 ease-in-out
                  ${isOpen ? "grid-rows-[1fr] opacity-100 mt-3" : "grid-rows-[0fr] opacity-0"}
                `}
              >
                <div className="overflow-hidden pl-1 pr-8">
                  <p className="text-[11px] leading-relaxed text-[var(--text-muted)]">
                    {item.answer}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
