"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ROUTES } from "@/constants/routes";
import { forgotPassword, resetPassword } from "@/services/authService";

type Step = "email" | "reset";

export default function ForgotPasswordPage() {
    const t = useTranslations("pages.auth.forgotPassword");
    const tLogin = useTranslations("pages.auth.login");
    const router = useRouter();
    const [step, setStep] = useState<Step>("email");
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // ─── Bước 1: Gửi email quên mật khẩu ───────────────────────────────────
    const handleSendEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (!email.trim()) { setError("Vui lòng nhập địa chỉ email"); return; }
        setIsLoading(true);
        try {
            const result = await forgotPassword(email.trim());
            if (result.success) {
                setStep("reset");
            } else {
                setError(result.message || "Không thể gửi email. Vui lòng thử lại.");
            }
        } catch {
            setError("Đã xảy ra lỗi. Vui lòng thử lại.");
        } finally {
            setIsLoading(false);
        }
    };

    // ─── Bước 2: Nhập OTP + mật khẩu mới ───────────────────────────────────
    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        if (!otp.trim()) { setError("Vui lòng nhập mã OTP"); return; }
        if (newPassword.length < 6) { setError("Mật khẩu mới tối thiểu 6 ký tự"); return; }
        if (newPassword !== confirmPassword) { setError("Mật khẩu xác nhận không khớp"); return; }
        setIsLoading(true);
        try {
            const result = await resetPassword(otp.trim(), newPassword);
            if (result.success) {
                setSuccess("Đặt lại mật khẩu thành công! Đang chuyển về trang đăng nhập...");
                setTimeout(() => router.push(ROUTES.PUBLIC.LOGIN), 2000);
            } else {
                setError(result.message || "Đặt lại mật khẩu thất bại. Vui lòng kiểm tra lại mã OTP.");
            }
        } catch {
            setError("Đã xảy ra lỗi. Vui lòng thử lại.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex relative overflow-hidden bg-gradient-to-br from-[#0a1628] via-[#0f2744] to-[#1a3a5c]">
            {/* Background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#3C81C6]/20 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#60a5fa]/15 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: "2s" }} />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
            </div>

            {/* Content */}
            <div className="w-full flex items-center justify-center p-4 relative z-10">
                <div className="w-full max-w-md">
                    {/* Logo */}
                    <div className="flex items-center gap-3 mb-8 justify-center">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#3C81C6] to-[#60a5fa] flex items-center justify-center shadow-lg shadow-[#3C81C6]/25">
                            <span className="material-symbols-outlined text-white" style={{ fontSize: "28px" }}>
                                local_hospital
                            </span>
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">EHealth</h1>
                            <p className="text-[#60a5fa]/80 text-sm font-medium">{tLogin("platformTagline")}</p>
                        </div>
                    </div>

                    {/* Card */}
                    <div className="bg-white/[0.07] backdrop-blur-xl rounded-2xl p-6 sm:p-8 border border-white/[0.1] shadow-2xl shadow-black/20">

                        {/* ── Bước 1: Nhập email ── */}
                        {step === "email" && (
                            <>
                                <div className="text-center mb-6">
                                    <div className="w-16 h-16 mx-auto rounded-full bg-[#3C81C6]/20 flex items-center justify-center mb-4">
                                        <span className="material-symbols-outlined text-[#60a5fa]" style={{ fontSize: "32px" }}>
                                            lock_reset
                                        </span>
                                    </div>
                                    <h2 className="text-2xl font-bold text-white mb-1">{t("title")}</h2>
                                    <p className="text-[#94a3b8] text-sm">
                                        {t("subtitle")}
                                    </p>
                                </div>

                                {error && (
                                    <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-red-400" style={{ fontSize: "18px" }}>error</span>
                                        <p className="text-red-400 text-sm">{error}</p>
                                    </div>
                                )}

                                <form onSubmit={handleSendEmail} className="space-y-4">
                                    <div>
                                        <label className="block text-[#94a3b8] text-xs font-semibold uppercase tracking-wider mb-1.5">
                                            {t("emailLabel")}
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#64748b]" style={{ fontSize: "20px" }}>
                                                mail
                                            </span>
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="you@ehealth.vn"
                                                className="w-full pl-11 pr-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-xl text-white placeholder-[#475569] focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/50 focus:border-[#3C81C6]/50 transition-all text-sm"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full py-3 bg-gradient-to-r from-[#3C81C6] to-[#2563eb] hover:from-[#2a6da8] hover:to-[#1d4ed8] text-white rounded-xl font-semibold text-sm transition-all duration-300 shadow-lg shadow-[#3C81C6]/25 hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {isLoading ? (
                                            <>
                                                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                </svg>
                                                <span>{t("sending")}</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>{t("submit")}</span>
                                                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>send</span>
                                            </>
                                        )}
                                    </button>
                                </form>
                            </>
                        )}

                        {/* ── Bước 2: Nhập OTP + mật khẩu mới ── */}
                        {step === "reset" && (
                            <>
                                <div className="text-center mb-6">
                                    <div className="w-16 h-16 mx-auto rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                                        <span className="material-symbols-outlined text-green-400" style={{ fontSize: "32px" }}>
                                            mark_email_read
                                        </span>
                                    </div>
                                    <h2 className="text-2xl font-bold text-white mb-1">Đặt lại mật khẩu</h2>
                                    <p className="text-[#94a3b8] text-sm">
                                        Mã OTP đã được gửi đến <span className="text-[#60a5fa] font-medium">{email}</span>
                                    </p>
                                </div>

                                {error && (
                                    <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-red-400" style={{ fontSize: "18px" }}>error</span>
                                        <p className="text-red-400 text-sm">{error}</p>
                                    </div>
                                )}

                                {success && (
                                    <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-green-400" style={{ fontSize: "18px" }}>check_circle</span>
                                        <p className="text-green-400 text-sm">{success}</p>
                                    </div>
                                )}

                                <form onSubmit={handleResetPassword} className="space-y-4">
                                    <div>
                                        <label className="block text-[#94a3b8] text-xs font-semibold uppercase tracking-wider mb-1.5">
                                            Mã OTP
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#64748b]" style={{ fontSize: "20px" }}>
                                                pin
                                            </span>
                                            <input
                                                type="text"
                                                value={otp}
                                                onChange={(e) => setOtp(e.target.value)}
                                                placeholder="Nhập mã OTP"
                                                className="w-full pl-11 pr-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-xl text-white placeholder-[#475569] focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/50 focus:border-[#3C81C6]/50 transition-all text-sm"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[#94a3b8] text-xs font-semibold uppercase tracking-wider mb-1.5">
                                            Mật khẩu mới
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#64748b]" style={{ fontSize: "20px" }}>
                                                lock
                                            </span>
                                            <input
                                                type="password"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                placeholder="Tối thiểu 6 ký tự"
                                                className="w-full pl-11 pr-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-xl text-white placeholder-[#475569] focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/50 focus:border-[#3C81C6]/50 transition-all text-sm"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[#94a3b8] text-xs font-semibold uppercase tracking-wider mb-1.5">
                                            Xác nhận mật khẩu mới
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#64748b]" style={{ fontSize: "20px" }}>
                                                lock
                                            </span>
                                            <input
                                                type="password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                placeholder="Nhập lại mật khẩu mới"
                                                className="w-full pl-11 pr-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-xl text-white placeholder-[#475569] focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/50 focus:border-[#3C81C6]/50 transition-all text-sm"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full py-3 bg-gradient-to-r from-[#3C81C6] to-[#2563eb] hover:from-[#2a6da8] hover:to-[#1d4ed8] text-white rounded-xl font-semibold text-sm transition-all duration-300 shadow-lg shadow-[#3C81C6]/25 hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {isLoading ? (
                                            <>
                                                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                </svg>
                                                <span>Đang xử lý...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>Đặt lại mật khẩu</span>
                                                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>lock_reset</span>
                                            </>
                                        )}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => { setStep("email"); setError(""); }}
                                        className="w-full py-2.5 text-[#94a3b8] text-sm hover:text-white transition-colors"
                                    >
                                        Gửi lại mã OTP
                                    </button>
                                </form>
                            </>
                        )}

                        {/* Back to login */}
                        <div className="mt-5 pt-4 border-t border-white/[0.06] text-center">
                            <button
                                onClick={() => router.push(ROUTES.PUBLIC.LOGIN)}
                                className="text-[#94a3b8] text-sm hover:text-white transition-colors inline-flex items-center gap-1.5"
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>arrow_back</span>
                                {t("backToLogin")}
                            </button>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="text-center mt-4">
                        <p className="text-[#475569] text-xs">
                            {tLogin("copyright")}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
