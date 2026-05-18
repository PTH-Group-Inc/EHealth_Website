import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// BE origin — dev mode gọi trực tiếp, prod mode proxy qua Next.js server (same-origin HTTPS)
const BE_ORIGIN = process.env.BACKEND_ORIGIN || "http://160.250.186.97:3000";

/** @type {import('next').NextConfig} */
const nextConfig = {
    // Tin cậy proxy (Cloudflare / Nginx) — lấy đúng client IP + protocol
    // Cần cho next-intl detect locale khi đứng sau reverse proxy
    poweredByHeader: false,
    compress: true,

    images: {
        remotePatterns: [
            { protocol: "https", hostname: "lh3.googleusercontent.com" },
            { protocol: "https", hostname: "i.pravatar.cc" },
            // Avatar/file từ BE server (dev mode — prod đi qua rewrites)
            { protocol: "http", hostname: "160.250.186.97" },
            { protocol: "https", hostname: "dev.thanhhaishopwebsite.id.vn" },
            // Cloudinary (avatar upload)
            { protocol: "https", hostname: "res.cloudinary.com" },
            // Avatar fallback (booking page)
            { protocol: "https", hostname: "ui-avatars.com" },
            // QR code service (booking confirmation)
            { protocol: "https", hostname: "api.qrserver.com" },
        ],
    },

    modularizeImports: {},

    compiler: {
        // Production: xoá console.log (giữ error + warn để debug lỗi thật)
        removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
    },

    experimental: {
        optimizePackageImports: ["framer-motion", "axios", "next-intl"],
    },

    eslint: { ignoreDuringBuilds: true },
    typescript: { ignoreBuildErrors: false },

    // Same-origin proxy: browser gọi /api/... (HTTPS cùng domain), Next.js server chuyển tiếp sang BE HTTP
    // → Tránh mixed-content block khi FE HTTPS + BE HTTP
    async rewrites() {
        return [
            { source: "/api/:path*", destination: `${BE_ORIGIN}/api/:path*` },
        ];
    },

    async headers() {
        return [
            {
                source: "/:path*",
                headers: [
                    { key: "X-Content-Type-Options", value: "nosniff" },
                    { key: "X-Frame-Options", value: "SAMEORIGIN" },
                    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
                    { key: "Permissions-Policy", value: "camera=(self), microphone=(self), geolocation=(self)" },
                ],
            },
            {
                // Không cache API (Cloudflare + browser)
                source: "/api/:path*",
                headers: [
                    { key: "Cache-Control", value: "no-store, max-age=0" },
                ],
            },
        ];
    },
};

export default withNextIntl(nextConfig);
