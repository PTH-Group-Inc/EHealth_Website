"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { verifyEmail } from "@/services/authService";

function VerifyEmailContent() {
    const t = useTranslations("pages.auth.verifyEmail");
    const router = useRouter();
    const searchParams = useSearchParams();
    const emailFromQuery = searchParams.get("email") || "";

    const [email, setEmail] = useState(emailFromQuery);
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        inputRefs.current[0]?.focus();
    }, []);

    const handleOtpChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value.slice(-1);
        setOtp(newOtp);
        setError("");
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
        if (pasted.length > 0) {
            const newOtp = [...otp];
            for (let i = 0; i < 6; i++) newOtp[i] = pasted[i] || "";
            setOtp(newOtp);
            inputRefs.current[Math.min(pasted.length, 5)]?.focus();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        const code = otp.join("");
        if (!email.trim()) { setError("Vui lòng nhập email"); return; }
        if (code.length !== 6) { setError("Vui lòng nhập đủ 6 số OTP"); return; }

        setLoading(true);
        try {
            const result = await verifyEmail(email, code);
            if (result.success) {
                setSuccess(t("success"));
                setTimeout(() => router.push("/login"), 2000);
            } else {
                setError(result.message || "Mã OTP không đúng hoặc đã hết hạn");
            }
        } catch {
            setError("Đã xảy ra lỗi. Vui lòng thử lại.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-screen flex relative overflow-hidden bg-gradient-to-br from-[#0a1628] via-[#0f2744] to-[#1a3a5c]">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#3C81C6]/20 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: "6s" }} />
                <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#60a5fa]/15 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: "6s", animationDelay: "2s" }} />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
            </div>

            <div className="w-full flex items-center justify-center p-4 sm:p-6 relative z-10">
                <div className="w-full max-w-md">
                    {/* Logo */}
                    <div className="flex items-center gap-3 mb-8 justify-center">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#3C81C6] to-[#60a5fa] flex items-center justify-center shadow-lg shadow-[#3C81C6]/25">
                            <span className="material-symbols-outlined text-white" style={{ fontSize: "28px" }}>local_hospital</span>
                        </div>
                        <h1 className="text-2xl font-bold text-white">EHealth</h1>
                    </div>

                    <div className="bg-white/[0.07] backdrop-blur-xl rounded-2xl p-6 sm:p-8 border border-white/[0.1] shadow-2xl shadow-black/20">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 rounded-full bg-[#3C81C6]/20 flex items-center justify-center mx-auto mb-4">
                                <span className="material-symbols-outlined text-[#60a5fa]" style={{ fontSize: "32px" }}>mark_email_read</span>
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-1">{t("title")}</h2>
                            <p className="text-[#94a3b8] text-sm">
                                {t("subtitle")}
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Email (if not from query) */}
                            {!emailFromQuery && (
                                <div>
                                    <label className="block text-[#94a3b8] text-xs font-semibold uppercase tracking-wider mb-1.5">Email đăng ký</label>
                                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@ehealth.vn"
                                        className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-xl text-white placeholder-[#475569] focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/50 text-sm" required />
                                </div>
                            )}
                            {emailFromQuery && (
                                <p className="text-center text-sm text-[#94a3b8]">
                                    Email: <span className="text-white font-semibold">{emailFromQuery}</span>
                                </p>
                            )}

                            {/* OTP inputs */}
                            <div className="flex justify-center gap-3" onPaste={handlePaste}>
                                {otp.map((digit, i) => (
                                    <input
                                        key={i}
                                        ref={(el) => { inputRefs.current[i] = el; }}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => handleOtpChange(i, e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(i, e)}
                                        className="w-12 h-14 text-center text-xl font-bold bg-white/[0.08] border border-white/[0.15] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/50 focus:border-[#3C81C6]/50 transition-all"
                                    />
                                ))}
                            </div>

                            {error && (
                                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>error</span>
                                    <span>{error}</span>
                                </div>
                            )}

                            {success && (
                                <div className="flex items-center gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
                                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>check_circle</span>
                                    <span>{success}</span>
                                </div>
                            )}

                            <button type="submit" disabled={loading}
                                className="w-full py-3 bg-gradient-to-r from-[#3C81C6] to-[#2563eb] hover:from-[#2a6da8] hover:to-[#1d4ed8] text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-[#3C81C6]/25 disabled:opacity-70 flex items-center justify-center gap-2 active:scale-[0.98]">
                                {loading ? (
                                    <><svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> {t("verifying")}</>
                                ) : (
                                    <><span className="material-symbols-outlined" style={{ fontSize: "18px" }}>verified</span> {t("goToLogin")}</>
                                )}
                            </button>
                        </form>

                        <div className="mt-6 pt-5 border-t border-white/[0.06] text-center">
                            <p className="text-[#94a3b8] text-sm">
                                <a href="/login" className="text-[#60a5fa] hover:text-[#93c5fd] font-semibold transition-colors">
                                    Quay lại đăng nhập
                                </a>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-[#3C81C6] border-t-transparent rounded-full animate-spin" /></div>}>
            <VerifyEmailContent />
        </Suspense>
    );
}
