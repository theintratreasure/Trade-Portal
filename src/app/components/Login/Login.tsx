"use client";
import { getFcmToken } from "@/lib/getFcmToken";
import { JSX, KeyboardEvent, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  User,
  Lock,
  Mail,
  ArrowLeft,
  Home,
  LucideIcon,
} from "lucide-react";
import {
  useLogin,
  useForgotPassword,
  useResetPassword,
} from "@/hooks/useAuth";
import { PremiumInput } from "../ui/TextInput";
import { AuthShell } from "../auth/AuthCard";
import { useResendVerifyEmail } from "@/hooks/useUser";
import BackButton from "../ui/BackButton";
import { useSaveDeviceToken } from "@/hooks/useDevice";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import SuccessModal from "../ui/SuccessModal";

type Step = "login" | "forgot" | "reset" | "verify";

type FormState = {
  identity: string;
  password: string;
  otp: string;
  newPassword: string;
};

function setAuthCookie(token: string) {
  if (typeof document === "undefined") return;
  const secure =
    typeof window !== "undefined" && window.location.protocol === "https:"
      ? "; secure"
      : "";
  document.cookie = `accessToken=${encodeURIComponent(
    token
  )}; path=/; max-age=86400; samesite=lax${secure}`;
}

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();

  const login = useLogin();
  const forgot = useForgotPassword();
  const reset = useResetPassword();
  const resendVerifyEmail = useResendVerifyEmail();

  const tokenFromUrl = params.get("token");

  const [step, setStep] = useState<Step>(() => (tokenFromUrl ? "reset" : "login"));

  const [toast, setToast] = useState<string | null>(null);
  const [showForgotSuccessModal, setShowForgotSuccessModal] = useState(false);

  const [form, setForm] = useState<FormState>({
    identity: "",
    password: "",
    otp: "",
    newPassword: "",
  });
  const identityInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

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
  const saveDevice = useSaveDeviceToken();

  const handleLogin = () => {
    // ✅ LOGIN FIRST (NO WAIT)
    login.mutate(
      {
        email: form.identity,
        password: form.password,
        fcmToken: null, // initially null
      },
      {
        onSuccess: async (res) => {
          const payload = res?.data?.data ?? res?.data ?? res;
          const { accessToken, refreshToken, isMailVerified } = payload ?? {};

          if (!accessToken || !refreshToken) {
            setToast("Login response invalid. Please try again.");
            return;
          }

          if (!isMailVerified) {
            setToast("Please verify your email first");
            setStep("verify");
            return;
          }

          localStorage.setItem("accessToken", accessToken);
          localStorage.setItem("refreshToken", refreshToken);
          setAuthCookie(accessToken);

          setToast("Login successful");

          // 🔥 UNIVERSAL FCM LOGIC
          try {
            let fcmToken: string | null = null;

            if (Capacitor.isNativePlatform()) {
              const perm = await PushNotifications.requestPermissions();
              if (perm.receive === "granted") {
                await PushNotifications.register();

                PushNotifications.addListener("registration", (token) => {
                  fcmToken = token.value;

                  saveDevice.mutate({
                    fcmToken: token.value,
                    platform: "android",
                  });
                });
              }
            } else {
              fcmToken = await getFcmToken();

              if (fcmToken) {
                saveDevice.mutate({
                  fcmToken,
                  platform: "web",
                });
              }
            }
          } catch (err) {
            console.log("FCM error:", err);
          }

          router.replace("/dashboard");
          router.refresh();
        },
        onError: () => {
          setToast("Invalid email or password");
        },
      }
    );
  };


  const handleForgot = () => {
    forgot.mutate(
      { email: form.identity },
      {
        onSuccess: () => {
          setShowForgotSuccessModal(true);
        },
      }
    );
  };

  const handleForgotSuccessClose = () => {
    setShowForgotSuccessModal(false);
    setStep("login");
    router.replace("/login");
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
  const handleVerifyEmail = () => {
    if (!form.identity) {
      setToast("Please enter your email");
      return;
    }

    resendVerifyEmail.mutate(form.identity, {
      onSuccess: () => {
        setToast("Verification email sent successfully");
        setStep("login");
      },
      onError: (err: unknown) => {
        const message =
          typeof err === "object" &&
            err !== null &&
            "response" in err &&
            typeof (err as { response?: { data?: { message?: string } } }).response?.data?.message === "string"
            ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
            : "Failed to send verification email";
        
      },
    });
  };

  const handleLoginFieldEnter =
    (fieldKey: keyof FormState) =>
      (e: KeyboardEvent<HTMLInputElement>) => {
        if (step !== "login" || e.key !== "Enter") return;

        e.preventDefault();

        if (fieldKey === "identity") {
          passwordInputRef.current?.focus();
          return;
        }

        if (fieldKey === "password" && !isSubmitting) {
          handleLogin();
        }
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
      title: "Welcome back",
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

    verify: {
      title: "Verify your email",
      back: () => setStep("login"),
      fields: [
        {
          key: "identity",
          label: "Email address",
          type: "email",
          icon: Mail,
        },
      ],
      buttonText: "Send verification email",
      onSubmit: handleVerifyEmail,
    },


  };

  const current = steps[step];
  const isSubmitting =
    (step === "login" && login.isPending) ||
    (step === "forgot" && forgot.isPending) ||
    (step === "reset" && reset.isPending) ||
    (step === "verify" && resendVerifyEmail.isPending);

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[var(--bg-main)] px-4 py-8 overflow-hidden">

      {/* Ambient Light Layers */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-[560px] w-[560px] rounded-full bg-[var(--primary)] opacity-20 blur-[170px] animate-auth-orb-a" />
      <div className="pointer-events-none absolute bottom-[-220px] right-[-220px] h-[640px] w-[640px] rounded-full bg-[var(--primary)] opacity-12 blur-[190px] animate-auth-orb-b" />

      <AuthShell>
        <div className="relative overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-4 sm:p-6 shadow-[0_24px_64px_rgba(15,23,42,0.14)] animate-auth-card-in">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[linear-gradient(180deg,var(--primary-glow),transparent)] opacity-50" />

          <div className="relative z-10 space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between gap-2">
              <BackButton to="/" />
              <button
                onClick={() => router.push("/")}
                className="inline-flex items-center justify-center rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] text-[var(--text-main)] h-10 w-10 transition hover:bg-[var(--bg-glass)]"
                aria-label="Go home"
              >
                <Home size={18} />
              </button>
            </div>

            {/* BRAND */}
            <div className="text-center space-y-2">
              <h1 className="text-[28px] leading-tight font-semibold tracking-wide text-[var(--text-main)]">
                ALS Trades
              </h1>

              <p className="text-sm text-[var(--text-muted)]">
                Secure client access
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
            <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-glass)] px-4 py-3 text-center space-y-1">
              <h2 className="text-xl font-semibold text-[var(--text-main)]">
                {current.title}
              </h2>
              {step === "login" && (
                <p className="text-sm text-[var(--text-muted)]">
                  Sign in to continue to your dashboard
                </p>
              )}
            </div>

            {/* INPUTS */}
            <div className="space-y-5">
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
                  inputRef={
                    step === "login"
                      ? field.key === "identity"
                        ? identityInputRef
                        : field.key === "password"
                        ? passwordInputRef
                        : undefined
                      : undefined
                  }
                  onKeyDown={
                    step === "login"
                      ? handleLoginFieldEnter(field.key)
                      : undefined
                  }
                />
              ))}
            </div>

            {/* ACTION BUTTON */}
            <button
              onClick={current.onSubmit}
              disabled={isSubmitting}
              className={`w-full rounded-xl py-3.5 font-medium transition text-[var(--text-invert)]
              ${step === "reset"
                  ? "bg-emerald-600 hover:opacity-90"
                  : "bg-[var(--primary)] hover:shadow-[0_0_32px_var(--primary-glow)]"
                }
              disabled:opacity-60 disabled:cursor-not-allowed`}
            >
              {isSubmitting ? "Please wait..." : current.buttonText}
            </button>


            {/* FOOTER */}
            {current.footer}
          </div>
        </div>
      </AuthShell>

      {/* SUCCESS TOAST */}
      {toast && (
        <div className="fixed bottom-4 right-4 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] text-[var(--text-main)] px-4 py-2 shadow-xl">
          {toast}
        </div>
      )}

      {showForgotSuccessModal && (
        <SuccessModal
          title="Reset Link Sent"
          message="A password reset link has been sent to your registered email address. Please check your inbox and reset your password."
          actionLabel="OK"
          onAction={handleForgotSuccessClose}
          onClose={handleForgotSuccessClose}
        />
      )}
    </div>
  );
}
