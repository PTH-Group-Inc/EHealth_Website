"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ROUTES } from "@/constants/routes";
import { useAuth, getRedirectUrl } from "@/contexts/AuthContext";

export default function LoginPage() {
    const t = useTranslations("pages.auth.login");
    const tErr = useTranslations("errors");
    const { login, isLoading, isAuthenticated, user } = useAuth();
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState("");

    // Redirect nếu đã đăng nhập
    useEffect(() => {
        if (isAuthenticated && user) {
            const redirectUrl = getRedirectUrl(user.role);
            router.replace(redirectUrl);
        }
    }, [isAuthenticated, user, router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        const result = await login(email, password);
        if (!result.success) {
            const hasErrorKey = (key: string) => {
                try { return tErr(key) !== key; } catch { return false; }
            };
            const translated = result.code && hasErrorKey(result.code) ? tErr(result.code) : null;
            setError(translated || result.message || t("errorDefault"));
        }
    };

    // Nếu đang kiểm tra auth hoặc đã đăng nhập, hiện loading
    if (isAuthenticated && user) {
        return (
            <div className="h-screen flex items-center justify-center bg-gradient-to-br from-[#0a1628] via-[#0f2744] to-[#1a3a5c]">
                <div className="flex flex-col items-center gap-4">
                    <svg className="animate-spin h-10 w-10 text-[#60a5fa]" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <p className="text-[#94a3b8] text-sm">{t("redirecting")}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen flex relative overflow-hidden bg-gradient-to-br from-[#0a1628] via-[#0f2744] to-[#1a3a5c]">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Floating medical icons */}
                <div className="absolute top-[10%] left-[5%] animate-float-slow opacity-[0.06]">
                    <span className="material-symbols-outlined text-white" style={{ fontSize: "120px" }}>cardiology</span>
                </div>
                <div className="absolute top-[60%] left-[15%] animate-float-medium opacity-[0.04]">
                    <span className="material-symbols-outlined text-white" style={{ fontSize: "80px" }}>local_pharmacy</span>
                </div>
                <div className="absolute top-[25%] left-[40%] animate-float-fast opacity-[0.05]">
                    <span className="material-symbols-outlined text-white" style={{ fontSize: "60px" }}>medical_services</span>
                </div>
                <div className="absolute top-[75%] left-[60%] animate-float-slow opacity-[0.04]">
                    <span className="material-symbols-outlined text-white" style={{ fontSize: "100px" }}>vaccines</span>
                </div>
                <div className="absolute top-[15%] right-[10%] animate-float-medium opacity-[0.05]">
                    <span className="material-symbols-outlined text-white" style={{ fontSize: "90px" }}>biotech</span>
                </div>
                <div className="absolute bottom-[20%] right-[25%] animate-float-fast opacity-[0.06]">
                    <span className="material-symbols-outlined text-white" style={{ fontSize: "70px" }}>monitor_heart</span>
                </div>

                {/* Gradient orbs */}
                <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#3C81C6]/20 rounded-full blur-[120px] animate-pulse-slow" />
                <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#60a5fa]/15 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: "2s" }} />
                <div className="absolute top-1/2 left-1/3 w-72 h-72 bg-[#06b6d4]/10 rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: "4s" }} />

                {/* Grid pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />

                {/* ECG line animation */}
                <svg className="absolute bottom-0 left-0 w-full h-32 opacity-[0.07]" viewBox="0 0 1200 100" preserveAspectRatio="none">
                    <path
                        d="M0,50 L200,50 L220,50 L230,20 L240,80 L250,10 L260,90 L270,50 L290,50 L500,50 L520,50 L530,20 L540,80 L550,10 L560,90 L570,50 L590,50 L800,50 L820,50 L830,20 L840,80 L850,10 L860,90 L870,50 L890,50 L1200,50"
                        fill="none"
                        stroke="#3C81C6"
                        strokeWidth="2"
                        className="animate-ecg-line"
                    />
                </svg>
            </div>

            {/* Left Panel — Branding */}
            <div className="hidden lg:flex lg:w-[55%] relative z-10 flex-col justify-between px-10 py-8">
                {/* Logo + Tagline */}
                <div>
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#3C81C6] to-[#60a5fa] flex items-center justify-center shadow-lg shadow-[#3C81C6]/25">
                            <span className="material-symbols-outlined text-white" style={{ fontSize: "28px" }}>local_hospital</span>
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-tight">EHealth</h1>
                            <p className="text-[#60a5fa]/80 text-sm font-medium">{t("platformTagline")}</p>
                        </div>
                    </div>
                </div>

                {/* Main hero content */}
                <div className="flex-1 flex flex-col justify-center max-w-xl">
                    <h2 className="text-5xl font-bold text-white leading-tight mb-5">
                        {t("heroLine1")}
                        <br />
                        <span className="bg-gradient-to-r from-[#60a5fa] to-[#06b6d4] bg-clip-text text-transparent">
                            {t("heroLine2")}
                        </span>
                        <br />
                        {t("heroLine3")}
                    </h2>
                    <p className="text-[#94a3b8] text-base leading-relaxed mb-8">
                        {t("heroDescription")}
                    </p>

                    {/* Feature highlights */}
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { icon: "smart_toy", label: t("feature.ai"), desc: t("feature.aiDesc") },
                            { icon: "calendar_month", label: t("feature.appointment"), desc: t("feature.appointmentDesc") },
                            { icon: "medication", label: t("feature.prescription"), desc: t("feature.prescriptionDesc") },
                            { icon: "monitoring", label: t("feature.monitoring"), desc: t("feature.monitoringDesc") },
                        ].map((feature) => (
                            <div
                                key={feature.icon}
                                className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] hover:bg-white/[0.08] transition-all duration-300 group"
                            >
                                <div className="w-9 h-9 rounded-lg bg-[#3C81C6]/20 flex items-center justify-center group-hover:bg-[#3C81C6]/30 transition-colors">
                                    <span className="material-symbols-outlined text-[#60a5fa]" style={{ fontSize: "20px" }}>{feature.icon}</span>
                                </div>
                                <div>
                                    <p className="text-white text-sm font-semibold">{feature.label}</p>
                                    <p className="text-[#64748b] text-xs">{feature.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom stats */}
                <div className="flex items-center gap-6">
                    {[
                        { value: "10,000+", label: t("statPatients") },
                        { value: "200+", label: t("statDoctors") },
                        { value: "50+", label: t("statSpecialties") },
                    ].map((stat) => (
                        <div key={stat.label}>
                            <p className="text-2xl font-bold text-white">{stat.value}</p>
                            <p className="text-[#64748b] text-sm">{stat.label}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right Panel — Login Form */}
            <div className="w-full lg:w-[45%] flex items-center justify-center p-4 sm:p-6 relative z-10">
                <div className="w-full max-w-md">
                    {/* Mobile logo */}
                    <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#3C81C6] to-[#60a5fa] flex items-center justify-center shadow-lg shadow-[#3C81C6]/25">
                            <span className="material-symbols-outlined text-white" style={{ fontSize: "28px" }}>
                                local_hospital
                            </span>
                        </div>
                        <h1 className="text-2xl font-bold text-white">EHealth</h1>
                    </div>

                    {/* Login card */}
                    <div className="bg-white/[0.07] backdrop-blur-xl rounded-2xl p-6 sm:p-8 border border-white/[0.1] shadow-2xl shadow-black/20">
                        <div className="text-center mb-5">
                            <h2 className="text-2xl font-bold text-white mb-1">{t("title")}</h2>
                            <p className="text-[#94a3b8] text-sm">{t("subtitle")}</p>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-4">
                            {/* Email */}
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

                            {/* Password */}
                            <div>
                                <label className="block text-[#94a3b8] text-xs font-semibold uppercase tracking-wider mb-1.5">
                                    {t("passwordLabel")}
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#64748b]" style={{ fontSize: "20px" }}>
                                        lock
                                    </span>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full pl-11 pr-12 py-3 bg-white/[0.05] border border-white/[0.1] rounded-xl text-white placeholder-[#475569] focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/50 focus:border-[#3C81C6]/50 transition-all text-sm"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-[#94a3b8] transition-colors"
                                    >
                                        <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
                                            {showPassword ? "visibility_off" : "visibility"}
                                        </span>
                                    </button>
                                </div>
                            </div>

                            {/* Remember me + Forgot password */}
                            <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <div className="relative">
                                        <input
                                            type="checkbox"
                                            checked={rememberMe}
                                            onChange={(e) => setRememberMe(e.target.checked)}
                                            className="sr-only peer"
                                        />
                                        <div className="w-4 h-4 rounded border border-white/20 bg-white/[0.05] peer-checked:bg-[#3C81C6] peer-checked:border-[#3C81C6] transition-all flex items-center justify-center">
                                            {rememberMe && (
                                                <span className="material-symbols-outlined text-white" style={{ fontSize: "14px" }}>
                                                    check
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <span className="text-[#94a3b8] text-sm group-hover:text-white/80 transition-colors">
                                        {t("rememberMe")}
                                    </span>
                                </label>
                                <a
                                    href={ROUTES.PUBLIC.FORGOT_PASSWORD}
                                    className="text-[#60a5fa] text-sm hover:text-[#93c5fd] transition-colors font-medium"
                                >
                                    {t("forgotPassword")}
                                </a>
                            </div>

                            {/* Error message */}
                            {error && (
                                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>error</span>
                                    <span>{error}</span>
                                </div>
                            )}

                            {/* Login button */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-3 bg-gradient-to-r from-[#3C81C6] to-[#2563eb] hover:from-[#2a6da8] hover:to-[#1d4ed8] text-white rounded-xl font-semibold text-sm transition-all duration-300 shadow-lg shadow-[#3C81C6]/25 hover:shadow-xl hover:shadow-[#3C81C6]/30 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.98]"
                            >
                                {isLoading ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                            />
                                        </svg>
                                        <span>{t("loggingIn")}</span>
                                    </>
                                ) : (
                                    <>
                                        <span>{t("submit")}</span>
                                        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                                            arrow_forward
                                        </span>
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Register link */}
                        <div className="mt-6 pt-5 border-t border-white/[0.06] text-center">
                            <p className="text-[#94a3b8] text-sm">
                                {t("noAccount")}{" "}
                                <a href="/register" className="text-[#60a5fa] hover:text-[#93c5fd] font-semibold transition-colors">
                                    {t("registerNow")}
                                </a>
                            </p>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="text-center mt-4">
                        <p className="text-[#475569] text-xs">
                            {t("copyright")}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
