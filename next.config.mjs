import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
    // Bật Turbopack stable — compile nhanh 3-5x vs webpack trong dev mode
    // (flag --turbo trong script dev đã kích hoạt; config này dùng cho production build)
    images: {
        remotePatterns: [
            { protocol: "https", hostname: "lh3.googleusercontent.com" },
            { protocol: "https", hostname: "i.pravatar.cc" },
            // Avatar/file từ BE server
            { protocol: "http", hostname: "160.250.186.97" },
            { protocol: "https", hostname: "dev.thanhhaishopwebsite.id.vn" },
            // Cloudinary (thanhhai dùng cho avatar upload)
            { protocol: "https", hostname: "res.cloudinary.com" },
        ],
    },

    // Giảm bundle size — stub import không dùng
    modularizeImports: {
        // Tree-shake framer-motion nếu có hunk lớn chưa dùng (optional)
        // Chỉ import những thứ đang dùng trong code
    },

    // Compiler options tăng tốc production build
    compiler: {
        // Xóa console.log trong production (nhưng giữ console.error + console.warn)
        removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
    },

    // Experimental features
    experimental: {
        // Optimize server components
        optimizePackageImports: [
            "framer-motion",
            "axios",
            "next-intl",
        ],
    },

    // Không chặn build khi còn warning lint
    eslint: {
        ignoreDuringBuilds: false,
    },

    // TypeScript strict, không cho qua nếu error
    typescript: {
        ignoreBuildErrors: false,
    },
};

export default withNextIntl(nextConfig);
