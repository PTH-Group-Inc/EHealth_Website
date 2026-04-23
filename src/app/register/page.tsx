"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { register } from "@/services/authService";

export default function RegisterPage() {
    const t = useTranslations("pages.auth.register");
    const tLogin = useTranslations("pages.auth.login");
    const router = useRouter();
    const [formData, setFormData] = useState({ name: "", email: "", password: "", confirmPassword: "" });
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
        setError("");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (!formData.name.trim()) { setError("Vui lòng nhập họ tên"); return; }
        if (!formData.email.trim()) { setError("Vui lòng nhập email"); return; }
        if (formData.password.length < 6) { setError("Mật khẩu tối thiểu 6 ký tự"); return; }
        if (formData.password !== formData.confirmPassword) { setError("Mật khẩu xác nhận không khớp"); return; }

        setLoading(true);
        try {
            const result = await register({
                name: formData.name,
                email: formData.email,
                password: formData.password,
            });
            if (result.success) {
                setSuccess("Đăng ký thành công! Đang chuyển đến trang xác thực email...");
                setTimeout(() => router.push(`/verify-email?email=${encodeURIComponent(formData.email)}`), 2000);
            } else {
                setError(result.message || "Đăng ký thất bại");
            }
        } catch {
            setError("Đã xảy ra lỗi. Vui lòng thử lại.");
        }
        finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-screen flex relative overflow-hidden bg-gradient-to-br from-[#0a1628] via-[#0f2744] to-[#1a3a5c]">
            {/* Background */}
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

                    {/* Register card */}
                    <div className="bg-white/[0.07] backdrop-blur-xl rounded-2xl p-6 sm:p-8 border border-white/[0.1] shadow-2xl shadow-black/20">
                        <div className="text-center mb-5">
                            <h2 className="text-2xl font-bold text-white mb-1">{t("title")}</h2>
                            <p className="text-[#94a3b8] text-sm">{t("subtitle")}</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Name */}
                            <div>
                                <label className="block text-[#94a3b8] text-xs font-semibold uppercase tracking-wider mb-1.5">{t("fullNameLabel")}</label>
                                <div className="relative">
                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#64748b]" style={{ fontSize: "20px" }}>person</span>
                                    <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Nguyễn Văn A"
                                        className="w-full pl-11 pr-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-xl text-white placeholder-[#475569] focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/50 focus:border-[#3C81C6]/50 transition-all text-sm" required />
                                </div>
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-[#94a3b8] text-xs font-semibold uppercase tracking-wider mb-1.5">{t("emailLabel")}</label>
                                <div className="relative">
                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#64748b]" style={{ fontSize: "20px" }}>mail</span>
                                    <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="you@ehealth.vn"
                                        className="w-full pl-11 pr-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-xl text-white placeholder-[#475569] focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/50 focus:border-[#3C81C6]/50 transition-all text-sm" required />
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-[#94a3b8] text-xs font-semibold uppercase tracking-wider mb-1.5">{t("passwordLabel")}</label>
                                <div className="relative">
                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#64748b]" style={{ fontSize: "20px" }}>lock</span>
                                    <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Tối thiểu 6 ký tự"
                                        className="w-full pl-11 pr-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-xl text-white placeholder-[#475569] focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/50 focus:border-[#3C81C6]/50 transition-all text-sm" required />
                                </div>
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label className="block text-[#94a3b8] text-xs font-semibold uppercase tracking-wider mb-1.5">{t("confirmPasswordLabel")}</label>
                                <div className="relative">
                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#64748b]" style={{ fontSize: "20px" }}>lock</span>
                                    <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Nhập lại mật khẩu"
                                        className="w-full pl-11 pr-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-xl text-white placeholder-[#475569] focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/50 focus:border-[#3C81C6]/50 transition-all text-sm" required />
                                </div>
                            </div>

                            {/* Error */}
                            {error && (
                                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>error</span>
                                    <span>{error}</span>
                                </div>
                            )}

                            {/* Success */}
                            {success && (
                                <div className="flex items-center gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
                                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>check_circle</span>
                                    <span>{success}</span>
                                </div>
                            )}

                            {/* Submit */}
                            <button type="submit" disabled={loading}
                                className="w-full py-3 bg-gradient-to-r from-[#3C81C6] to-[#2563eb] hover:from-[#2a6da8] hover:to-[#1d4ed8] text-white rounded-xl font-semibold text-sm transition-all duration-300 shadow-lg shadow-[#3C81C6]/25 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.98]">
                                {loading ? (
                                    <><svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> {t("registering")}</>
                                ) : (
                                    <><span className="material-symbols-outlined" style={{ fontSize: "18px" }}>person_add</span> {t("submit")}</>
                                )}
                            </button>
                        </form>

                        {/* Login link */}
                        <div className="mt-6 pt-5 border-t border-white/[0.06] text-center">
                            <p className="text-[#94a3b8] text-sm">
                                {t("hasAccount")}{" "}
                                <a href="/login" className="text-[#60a5fa] hover:text-[#93c5fd] font-semibold transition-colors">
                                    {t("loginLink")}
                                </a>
                            </p>
                        </div>
                    </div>

                    <div className="text-center mt-4">
                        <p className="text-[#475569] text-xs">{tLogin("copyright")}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
