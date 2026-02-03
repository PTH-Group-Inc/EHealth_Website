import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "E-Health Admin",
    description: "Hệ thống quản trị Y tế Số",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="vi">
            <head>
                <link
                    rel="stylesheet"
                    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap"
                />
                <link
                    rel="stylesheet"
                    href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0"
                />
            </head>
            <body className="antialiased">{children}</body>
        </html>
    );
}
