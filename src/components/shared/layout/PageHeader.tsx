"use client";

/**
 * PageHeader — header chuẩn cho mọi admin/portal page.
 * Breadcrumb + title + subtitle + actions.
 */

import Link from "next/link";
import { ReactNode } from "react";

export interface Breadcrumb {
    label: string;
    href?: string;
}

export interface PageHeaderProps {
    title: string;
    subtitle?: string;
    icon?: string;
    breadcrumbs?: Breadcrumb[];
    actions?: ReactNode;
}

export function PageHeader({ title, subtitle, icon, breadcrumbs, actions }: PageHeaderProps) {
    return (
        <div className="mb-6">
            {breadcrumbs && breadcrumbs.length > 0 && (
                <nav className="flex items-center gap-1.5 text-xs text-[#687582] dark:text-gray-500 mb-3" aria-label="Breadcrumb">
                    <span className="material-symbols-outlined text-[14px]">home</span>
                    {breadcrumbs.map((bc, i) => (
                        <span key={i} className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[12px]">chevron_right</span>
                            {bc.href ? (
                                <Link href={bc.href} className="hover:text-[#3C81C6] transition-colors">
                                    {bc.label}
                                </Link>
                            ) : (
                                <span className="text-[#121417] dark:text-white font-medium">{bc.label}</span>
                            )}
                        </span>
                    ))}
                </nav>
            )}
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-start gap-3">
                    {icon && (
                        <div className="p-2.5 bg-gradient-to-br from-[#3C81C6]/[0.12] to-[#3C81C6]/[0.04] rounded-xl text-[#3C81C6]">
                            <span className="material-symbols-outlined text-[24px]">{icon}</span>
                        </div>
                    )}
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-[#121417] dark:text-white">{title}</h1>
                        {subtitle && <p className="text-sm text-[#687582] dark:text-gray-400 mt-0.5">{subtitle}</p>}
                    </div>
                </div>
                {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
            </div>
        </div>
    );
}

export default PageHeader;
