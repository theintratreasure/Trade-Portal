"use client";
import { getFcmToken } from "@/lib/getFcmToken";
import { JSX, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  User,
  Lock,
  Mail,
  KeyRound,
  ArrowLeft,
  LucideIcon,
} from "lucide-react";
import {
  useLogin,
  useForgotPassword,
  useResetPassword,
} from "@/hooks/useAuth";
import { PremiumInput } from "../ui/TextInput";
import { AuthShell } from "../auth/AuthCard";

type Step = "login" | "forgot" | "reset";

type FormState = {
  identity: string;
  password: string;
  otp: string;
  newPassword: string;
};

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();

  const login = useLogin();
  const forgot = useForgotPassword();
  const reset = useResetPassword();

  const tokenFromUrl = params.get("token");

  const [step, setStep] = useState<Step>("login");

  useEffect(() => {
    if (tokenFromUrl) {
      setStep("reset");
    }
  }, [tokenFromUrl]);

  const [toast, setToast] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>({
    identity: "",
    password: "",
    otp: "",
    newPassword: "",
  });

  const updateForm = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  /* ================= ACTIONS ================= */

  const handleLogin = async () => {
    const fcmToken = await getFcmToken();
    console.log("🔥 FCM TOKEN:", fcmToken);
    login.mutate(
      {
        email: form.identity,
        password: form.password,
        fcmToken: fcmToken ?? null,
      },
      {
        onSuccess: (res) => {
          // 🔐 STORE TOKENS
          localStorage.setItem(
            "accessToken",
            res.data.accessToken
          );

          localStorage.setItem(
            "refreshToken",
            res.data.refreshToken
          );
          document.cookie = `accessToken=${res.data.accessToken}; path=/; max-age=86400`;

          setToast("Login successful");
          router.push("/dashboard");
        },
      }
    );
  };


  const handleForgot = () => {
    forgot.mutate(
      { email: form.identity },
      {
        onSuccess: () => {
          setToast("Reset link sent to your email");
        },
      }
    );
  };

 const handleReset = () => {
  if (!tokenFromUrl) return;

  const isStrongPassword =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,16}$/.test(
      form.newPassword
    );

  if (!isStrongPassword) {
    setToast(
      "Password must contain uppercase, lowercase, number & special character"
    );
    return;
  }

  reset.mutate(
  {
    token: tokenFromUrl,
    password: form.newPassword,
  },
  {
    onSuccess: () => {
      setToast("Password updated successfully");

      // 🔥 IMPORTANT FIX
      setStep("login");

      // 🔥 CLEAR URL TOKEN COMPLETELY
      router.replace("/login");
    },
  }
);

};



  /* ================= UI CONFIG ================= */

  const steps: Record<
    Step,
    {
      title: string;
      fields: {
        key: keyof FormState;
        label: string;
        type?: "text" | "email" | "password";
        icon?: LucideIcon;
      }[];
      buttonText: string;
      onSubmit?: () => void;
      footer?: JSX.Element;
      back?: () => void;
    }
  > = {
    login: {
      title: "Sign in to Intra Treasure",
      fields: [
        {
          key: "identity",
          label: "Email or Account ID",
          icon: User,
        },
        {
          key: "password",
          label: "Password",
          type: "password",
          icon: Lock,
        },
      ],
      buttonText: "Login",
      onSubmit: handleLogin,
      footer: (
        <>
          <div className="flex justify-end">
            <button
              onClick={() => setStep("forgot")}
              className="text-sm text-[var(--primary)] hover:underline"
            >
              Forgot password?
            </button>
          </div>

          <p className="text-sm text-center text-[var(--text-muted)]">
            Don’t have an account?{" "}
            <span
              className="text-[var(--primary)] cursor-pointer hover:underline"
              onClick={() => router.push("/signup")}
            >
              Signup now
            </span>
          </p>
        </>
      ),
    },

    forgot: {
      title: "Recover your account",
      back: () => setStep("login"),
      fields: [
        {
          key: "identity",
          label: "Registered Email",
          type: "email",
          icon: Mail,
        },
      ],
      buttonText: "Send reset link",
      onSubmit: handleForgot,
    },

    reset: {
      title: "Set new password",
      back: () => setStep("login"),
      fields: [
        {
          key: "newPassword",
          label: "Create new password",
          type: "password",
          icon: Lock,
        },
      ],
      buttonText: "Update password",
      onSubmit: handleReset,
    },
  };

  const current = steps[step];

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[var(--bg-main)] px-4">
      {/* BACKGROUND GLOW */}
      <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-[var(--primary)] opacity-20 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-indigo-500 opacity-20 blur-3xl" />

      <AuthShell>
        <div className="space-y-8 animate-fadeIn">
          {/* BRAND */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">
              Intra Treasure
            </h1>
            <p className="text-sm text-[var(--text-muted)]">
              Institutional-grade trading platform
            </p>
          </div>

          {/* BACK BUTTON */}
          {current.back && (
            <button
              onClick={current.back}
              className="flex items-center gap-1 text-sm text-[var(--text-muted)] hover:text-[var(--primary)]"
            >
              <ArrowLeft size={16} />
              Back to login
            </button>
          )}

          {/* FORM HEADER */}
          <div className="text-center space-y-1">
            <h2 className="text-xl font-semibold">
              {current.title}
            </h2>
            {step === "login" && (
              <p className="text-sm text-[var(--text-muted)]">
                Sign in to continue to your dashboard
              </p>
            )}
          </div>

          {/* INPUTS */}
          <div className="space-y-6">
            {current.fields.map((field) => (
              <PremiumInput
                key={field.key}
                label={field.label}
                type={field.type}
                value={form[field.key]}
                onChange={(v) =>
                  updateForm(field.key, v)
                }
                icon={field.icon}
              />
            ))}
          </div>

          {/* ACTION BUTTON */}
          <button
            onClick={current.onSubmit}
            className={`w-full rounded-lg py-3 font-medium transition text-white
              ${step === "reset"
                ? "bg-emerald-500 hover:opacity-90"
                : "bg-[var(--primary)] hover:shadow-[0_0_30px_var(--primary-glow)]"
              }`}
          >
            {current.buttonText}
          </button>

          {/* FOOTER */}
          {current.footer}
        </div>
      </AuthShell>

      {/* SUCCESS TOAST */}
      {toast && (
        <div className="fixed bottom-4 right-4 rounded-lg bg-[var(--primary)] text-white px-4 py-2 shadow-xl">
          {toast}
        </div>
      )}
    </div>
  );
}
