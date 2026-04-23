"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ROUTES } from "@/constants/routes";
import { resetPassword } from "@/services/authService";

const OTP_LENGTH = 6;

function OTPContent() {
    const t = useTranslations("pages.auth.otp");
    const tForgot = useTranslations("pages.auth.forgotPassword");
    const tLogin = useTranslations("pages.auth.login");
    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams.get("email") || "";

    const [otp, setOtp] = useState<string[]>(new Array(OTP_LENGTH).fill(""));
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [resendTimer, setResendTimer] = useState(60);
    const [isVerified, setIsVerified] = useState(false);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Đếm ngược gửi lại OTP
    useEffect(() => {
        if (resendTimer > 0) {
            const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendTimer]);

    // Focus input đầu tiên khi mount
    useEffect(() => {
        inputRefs.current[0]?.focus();
    }, []);

    // Xử lý nhập OTP
    const handleChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value.slice(-1);
        setOtp(newOtp);
        setError("");

        if (value && index < OTP_LENGTH - 1) {
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
        const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
        const newOtp = [...otp];
        for (let i = 0; i < pastedData.length; i++) {
            newOtp[i] = pastedData[i];
        }
        setOtp(newOtp);
        const lastIndex = Math.min(pastedData.length, OTP_LENGTH) - 1;
        inputRefs.current[lastIndex]?.focus();
    };

    // Xác thực OTP + đặt lại mật khẩu
    const handleVerify = async () => {
        const otpCode = otp.join("");
        if (otpCode.length !== OTP_LENGTH) {
            setError("Vui lòng nhập đầy đủ mã xác thực");
            return;
        }
        if (!newPassword || newPassword.length < 6) {
            setError("Mật khẩu mới tối thiểu 6 ký tự");
            return;
        }
        if (newPassword !== confirmPassword) {
            setError("Mật khẩu xác nhận không khớp");
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            const result = await resetPassword(otpCode, newPassword);
            if (result.success) {
                setIsVerified(true);
            } else {
                setError(result.message || "Mã xác thực không đúng. Vui lòng thử lại.");
            }
        } catch {
            setError("Đã xảy ra lỗi. Vui lòng thử lại.");
        } finally {
            setIsLoading(false);
        }
    };

    // Gửi lại OTP — quay về trang forgot-password để nhập lại email
    const handleResend = () => {
        setResendTimer(60);
        setOtp(new Array(OTP_LENGTH).fill(""));
        setError("");
        setNewPassword("");
        setConfirmPassword("");
        inputRefs.current[0]?.focus();
    };

    return (
        <div className="min-h-screen flex relative overflow-hidden bg-gradient-to-br from-[#0a1628] via-[#0f2744] to-[#1a3a5c]">
            {/* Background */}
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
                        {!isVerified ? (
                            <>
                                {/* Header */}
                                <div className="text-center mb-6">
                                    <div className="w-16 h-16 mx-auto rounded-full bg-[#3C81C6]/20 flex items-center justify-center mb-4">
                                        <span className="material-symbols-outlined text-[#60a5fa]" style={{ fontSize: "32px" }}>
                                            verified_user
                                        </span>
                                    </div>
                                    <h2 className="text-2xl font-bold text-white mb-1">{t("title")}</h2>
                                    <p className="text-[#94a3b8] text-sm">
                                        {t("subtitle")}
                                        {email && (
                                            <span className="block text-[#60a5fa] font-medium mt-1">{email}</span>
                                        )}
                                    </p>
                                </div>

                                {/* Error */}
                                {error && (
                                    <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-red-400" style={{ fontSize: "18px" }}>error</span>
                                        <p className="text-red-400 text-sm">{error}</p>
                                    </div>
                                )}

                                {/* OTP Inputs */}
                                <div className="flex items-center justify-center gap-3 mb-5">
                                    {otp.map((digit, index) => (
                                        <input
                                            key={index}
                                            ref={(el) => { inputRefs.current[index] = el; }}
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={1}
                                            value={digit}
                                            onChange={(e) => handleChange(index, e.target.value)}
                                            onKeyDown={(e) => handleKeyDown(index, e)}
                                            onPaste={handlePaste}
                                            className={`w-12 h-14 text-center text-xl font-bold rounded-xl border transition-all duration-200 focus:outline-none focus:ring-2
                                                ${digit
                                                    ? "bg-[#3C81C6]/20 border-[#3C81C6]/50 text-white focus:ring-[#3C81C6]/50"
                                                    : "bg-white/[0.05] border-white/[0.1] text-white focus:ring-[#3C81C6]/50 focus:border-[#3C81C6]/50"
                                                }
                                                ${error ? "border-red-500/50" : ""}
                                            `}
                                        />
                                    ))}
                                </div>

                                {/* New password fields */}
                                <div className="space-y-3 mb-5">
                                    <div>
                                        <label className="block text-[#94a3b8] text-xs font-semibold uppercase tracking-wider mb-1.5">
                                            Mật khẩu mới
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#64748b]" style={{ fontSize: "20px" }}>lock</span>
                                            <input
                                                type="password"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                placeholder="Tối thiểu 6 ký tự"
                                                className="w-full pl-11 pr-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-xl text-white placeholder-[#475569] focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/50 focus:border-[#3C81C6]/50 transition-all text-sm"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[#94a3b8] text-xs font-semibold uppercase tracking-wider mb-1.5">
                                            Xác nhận mật khẩu mới
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#64748b]" style={{ fontSize: "20px" }}>lock</span>
                                            <input
                                                type="password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                placeholder="Nhập lại mật khẩu mới"
                                                className="w-full pl-11 pr-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-xl text-white placeholder-[#475569] focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/50 focus:border-[#3C81C6]/50 transition-all text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Verify button */}
                                <button
                                    onClick={handleVerify}
                                    disabled={isLoading || otp.join("").length !== OTP_LENGTH}
                                    className="w-full py-3 bg-gradient-to-r from-[#3C81C6] to-[#2563eb] hover:from-[#2a6da8] hover:to-[#1d4ed8] text-white rounded-xl font-semibold text-sm transition-all duration-300 shadow-lg shadow-[#3C81C6]/25 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isLoading ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                            </svg>
                                            <span>{t("verifying")}</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>{t("submit")}</span>
                                            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>check_circle</span>
                                        </>
                                    )}
                                </button>

                                {/* Resend */}
                                <div className="text-center mt-4">
                                    {resendTimer > 0 ? (
                                        <p className="text-[#64748b] text-sm">
                                            {t("resendIn", { seconds: resendTimer })}
                                        </p>
                                    ) : (
                                        <button
                                            onClick={handleResend}
                                            className="text-[#60a5fa] text-sm hover:text-[#93c5fd] font-medium transition-colors"
                                        >
                                            {t("resend")}
                                        </button>
                                    )}
                                </div>
                            </>
                        ) : (
                            /* Success */
                            <div className="text-center py-4">
                                <div className="w-16 h-16 mx-auto rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                                    <span className="material-symbols-outlined text-green-400" style={{ fontSize: "32px" }}>
                                        check_circle
                                    </span>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Đặt lại thành công!</h3>
                                <p className="text-[#94a3b8] text-sm mb-6">
                                    Mật khẩu mới đã được cập nhật. Hãy đăng nhập lại.
                                </p>
                                <button
                                    onClick={() => router.push(ROUTES.PUBLIC.LOGIN)}
                                    className="w-full py-3 bg-gradient-to-r from-[#3C81C6] to-[#2563eb] text-white rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-[#3C81C6]/25"
                                >
                                    <span>Đăng nhập ngay</span>
                                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>arrow_forward</span>
                                </button>
                            </div>
                        )}

                        {/* Back to login */}
                        <div className="mt-5 pt-4 border-t border-white/[0.06] text-center">
                            <button
                                onClick={() => router.push(ROUTES.PUBLIC.LOGIN)}
                                className="text-[#94a3b8] text-sm hover:text-white transition-colors inline-flex items-center gap-1.5"
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>arrow_back</span>
                                {tForgot("backToLogin")}
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

export default function OTPPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-br from-[#0a1628] via-[#0f2744] to-[#1a3a5c] flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-[#3C81C6] border-t-transparent rounded-full" />
            </div>
        }>
            <OTPContent />
        </Suspense>
    );
}
