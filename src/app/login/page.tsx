"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import { AUTH_CONFIG } from "@/config";

// Các vai trò đăng nhập
const ROLE_OPTIONS = [
    { value: "admin", label: "Quản trị viên", icon: "admin_panel_settings", route: ROUTES.ADMIN.DASHBOARD },
    { value: "doctor", label: "Bác sĩ", icon: "stethoscope", route: ROUTES.PORTAL.DOCTOR.DASHBOARD },
    { value: "pharmacist", label: "Dược sĩ", icon: "medication", route: ROUTES.PORTAL.PHARMACIST.DASHBOARD },
    { value: "receptionist", label: "Lễ tân", icon: "person_add", route: ROUTES.PORTAL.RECEPTIONIST.DASHBOARD },
];

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [selectedRole, setSelectedRole] = useState("doctor");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Giả lập gọi API
        await new Promise((resolve) => setTimeout(resolve, 1500));

        const role = ROLE_OPTIONS.find((r) => r.value === selectedRole);
        if (role) {
            // Lưu token + user vào localStorage để AuthGuard cho phép truy cập
            const userData = {
                id: "demo-" + role.value,
                email: email || role.value + "@ehealth.vn",
                fullName: email ? email.split("@")[0] : role.label,
                role: role.value,
            };
            localStorage.setItem(AUTH_CONFIG.ACCESS_TOKEN_KEY, "demo-token-" + role.value);
            localStorage.setItem(AUTH_CONFIG.REFRESH_TOKEN_KEY, "demo-refresh-" + role.value);
            localStorage.setItem(AUTH_CONFIG.USER_KEY, JSON.stringify(userData));

            router.push(role.route);
        }
    };

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
                            <p className="text-[#60a5fa]/80 text-sm font-medium">Nền tảng Y tế Số</p>
                        </div>
                    </div>
                </div>

                {/* Main hero content */}
                <div className="flex-1 flex flex-col justify-center max-w-xl">
                    <h2 className="text-5xl font-bold text-white leading-tight mb-5">
                        Nền tảng
                        <br />
                        <span className="bg-gradient-to-r from-[#60a5fa] to-[#06b6d4] bg-clip-text text-transparent">
                            Y tế Số
                        </span>
                        <br />
                        Thông minh
                    </h2>
                    <p className="text-[#94a3b8] text-base leading-relaxed mb-8">
                        Hệ thống quản lý y tế toàn diện, tích hợp AI hỗ trợ chẩn đoán,
                        quản lý lịch hẹn, kê đơn thuốc và theo dõi sức khỏe bệnh nhân.
                    </p>

                    {/* Feature highlights */}
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { icon: "smart_toy", label: "AI Hỗ trợ", desc: "Chẩn đoán thông minh" },
                            { icon: "calendar_month", label: "Lịch hẹn", desc: "Đặt lịch trực tuyến" },
                            { icon: "medication", label: "Kê đơn", desc: "Thuốc điện tử" },
                            { icon: "monitoring", label: "Theo dõi", desc: "Sức khỏe trực tuyến" },
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
                        { value: "10,000+", label: "Bệnh nhân" },
                        { value: "200+", label: "Bác sĩ" },
                        { value: "50+", label: "Chuyên khoa" },
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
                            <h2 className="text-2xl font-bold text-white mb-1">Đăng nhập</h2>
                            <p className="text-[#94a3b8] text-sm">Chào mừng bạn trở lại hệ thống EHealth</p>
                        </div>

                        {/* Role selector */}
                        <div className="mb-4">
                            <label className="block text-[#94a3b8] text-xs font-semibold uppercase tracking-wider mb-2">
                                Vai trò
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {ROLE_OPTIONS.map((role) => (
                                    <button
                                        key={role.value}
                                        type="button"
                                        onClick={() => setSelectedRole(role.value)}
                                        className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all duration-200 text-left ${selectedRole === role.value
                                            ? "bg-[#3C81C6]/20 border-[#3C81C6]/50 text-[#60a5fa] shadow-lg shadow-[#3C81C6]/10"
                                            : "bg-white/[0.03] border-white/[0.08] text-[#94a3b8] hover:bg-white/[0.06] hover:border-white/[0.15]"
                                            }`}
                                    >
                                        <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
                                            {role.icon}
                                        </span>
                                        <span className="text-sm font-medium">{role.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-4">
                            {/* Email */}
                            <div>
                                <label className="block text-[#94a3b8] text-xs font-semibold uppercase tracking-wider mb-1.5">
                                    Địa chỉ email
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
                                    Mật khẩu
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
                                        Ghi nhớ đăng nhập
                                    </span>
                                </label>
                                <a
                                    href={ROUTES.PUBLIC.FORGOT_PASSWORD}
                                    className="text-[#60a5fa] text-sm hover:text-[#93c5fd] transition-colors font-medium"
                                >
                                    Quên mật khẩu?
                                </a>
                            </div>

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
                                        <span>Đang đăng nhập...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Đăng nhập</span>
                                        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                                            arrow_forward
                                        </span>
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Divider */}
                        <div className="flex items-center gap-3 my-4">
                            <div className="flex-1 h-px bg-white/[0.08]" />
                            <span className="text-[#475569] text-xs uppercase tracking-wider font-medium">hoặc</span>
                            <div className="flex-1 h-px bg-white/[0.08]" />
                        </div>

                        {/* Demo accounts */}
                        <div className="space-y-1.5">
                            <p className="text-[#64748b] text-xs text-center mb-2">Tài khoản demo</p>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { email: "admin@ehealth.vn", role: "admin", label: "Quản trị", icon: "admin_panel_settings" },
                                    { email: "doctor@ehealth.vn", role: "doctor", label: "Bác sĩ", icon: "stethoscope" },
                                    { email: "pharma@ehealth.vn", role: "pharmacist", label: "Dược sĩ", icon: "medication" },
                                    { email: "reception@ehealth.vn", role: "receptionist", label: "Lễ tân", icon: "person_add" },
                                ].map((demo) => (
                                    <button
                                        key={demo.role}
                                        type="button"
                                        onClick={() => {
                                            setEmail(demo.email);
                                            setPassword("123456");
                                            setSelectedRole(demo.role);
                                        }}
                                        className="flex items-center gap-2 p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[#94a3b8] hover:bg-white/[0.08] hover:text-white hover:border-white/[0.15] transition-all duration-200 text-xs"
                                    >
                                        <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                                            {demo.icon}
                                        </span>
                                        <span className="font-medium">{demo.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="text-center mt-4">
                        <p className="text-[#475569] text-xs">
                            © 2025 EHealth. Hệ thống Y tế Số — PTH Group
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
