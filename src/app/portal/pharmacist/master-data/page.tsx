"use client";

/**
 * Master Data Hub — Phase K.3 (Nhóm 3: kho + danh mục thuốc).
 * Spec: dòng 8899-9421.
 *
 * 5 tab: drugs / categories / suppliers / warehouses / instructions.
 */

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { PageHeader, EmptyState, StatCard } from "@/components/shared/layout";
import axiosClient from "@/api/axiosClient";

const TABS = [
    { key: "drugs", label: "Danh mục thuốc", icon: "medication" },
    { key: "categories", label: "Nhóm thuốc", icon: "category" },
    { key: "suppliers", label: "Nhà cung cấp", icon: "local_shipping" },
    { key: "warehouses", label: "Kho thuốc", icon: "warehouse" },
    { key: "instructions", label: "Hướng dẫn dùng thuốc", icon: "menu_book" },
] as const;

type TabKey = typeof TABS[number]["key"];

async function fetchList(url: string) {
    try {
        const r = await axiosClient.get(url);
        const d = r?.data?.data ?? r?.data ?? [];
        return Array.isArray(d) ? d : [];
    } catch { return []; }
}

function DrugsTab() {
    const [items, setItems] = useState<any[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchList("/api/pharmacy/drugs").then(d => { setItems(d); setLoading(false); }); }, []);

    const filtered = items.filter((d: any) => !search || (d.name ?? "").toLowerCase().includes(search.toLowerCase()) || (d.code ?? "").toLowerCase().includes(search.toLowerCase()));

    return (
        <div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <StatCard label="Tổng thuốc" value={items.length} icon="medication" color="blue" loading={loading} />
                <StatCard label="Đang hoạt động" value={items.filter((d: any) => d.is_active || d.status === "ACTIVE").length} icon="check_circle" color="emerald" loading={loading} />
                <StatCard label="Tạm ngưng" value={items.filter((d: any) => !d.is_active && d.status !== "ACTIVE").length} icon="block" color="red" loading={loading} />
            </div>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm theo tên / mã thuốc…" className="w-full px-3 py-2 text-sm rounded-lg border border-[#e5e7eb] dark:border-[#2d353e] bg-white dark:bg-[#121417] mb-3" />
            <div className="bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl overflow-hidden">
                {loading ? <p className="p-8 text-center text-sm text-[#687582]">Đang tải…</p>
                : filtered.length === 0 ? <EmptyState icon="medication" title="Không có thuốc" />
                : (
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-[#687582]">
                            <tr><th className="text-left px-4 py-3">Tên thuốc</th><th className="text-left px-4 py-3">Mã</th><th className="text-left px-4 py-3">Nhóm</th><th className="text-left px-4 py-3">Trạng thái</th></tr>
                        </thead>
                        <tbody className="divide-y divide-[#e5e7eb] dark:divide-[#2d353e]">
                            {filtered.slice(0, 100).map((d: any) => (
                                <tr key={d.id}>
                                    <td className="px-4 py-3 font-medium">{d.name}</td>
                                    <td className="px-4 py-3 font-mono text-xs">{d.code ?? "—"}</td>
                                    <td className="px-4 py-3">{d.category_name ?? d.category?.name ?? "—"}</td>
                                    <td className="px-4 py-3">{d.is_active || d.status === "ACTIVE" ? <span className="text-emerald-600 text-xs">Hoạt động</span> : <span className="text-rose-600 text-xs">Ngưng</span>}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

function SimpleListTab({ endpoint, nameField = "name", extraFields = [] as string[] }: { endpoint: string; nameField?: string; extraFields?: string[] }) {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchList(endpoint).then(d => { setItems(d); setLoading(false); }); }, [endpoint]);

    return (
        <div className="bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl overflow-hidden">
            {loading ? <p className="p-8 text-center text-sm text-[#687582]">Đang tải…</p>
            : items.length === 0 ? <EmptyState icon="inbox" title="Không có dữ liệu" />
            : (
                <ul className="divide-y divide-[#e5e7eb] dark:divide-[#2d353e]">
                    {items.map((it: any, i: number) => (
                        <li key={it.id ?? i} className="px-4 py-3 text-sm flex items-start justify-between">
                            <div>
                                <p className="font-medium">{it[nameField] ?? it.name ?? "—"}</p>
                                <p className="text-xs text-[#687582]">
                                    {extraFields.map(f => it[f]).filter(Boolean).join(" · ")}
                                </p>
                            </div>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${it.is_active ?? true ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-700"}`}>
                                {it.is_active ?? true ? "Hoạt động" : "Ngưng"}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

function InstructionsTab() {
    const [tab, setTab] = useState<"templates" | "drugs">("templates");
    const [templates, setTemplates] = useState<any[]>([]);
    const [drugInst, setDrugInst] = useState<any[]>([]);

    useEffect(() => {
        fetchList("/api/medication-instructions/templates").then(setTemplates);
        fetchList("/api/medication-instructions/drugs").then(setDrugInst);
    }, []);

    return (
        <div>
            <div className="flex gap-2 mb-3">
                <button onClick={() => setTab("templates")} className={`px-3 py-1.5 text-sm rounded-lg border ${tab === "templates" ? "bg-[#3C81C6] text-white border-[#3C81C6]" : "bg-white dark:bg-[#1e242b] border-[#e5e7eb] dark:border-[#2d353e]"}`}>
                    Templates ({templates.length})
                </button>
                <button onClick={() => setTab("drugs")} className={`px-3 py-1.5 text-sm rounded-lg border ${tab === "drugs" ? "bg-[#3C81C6] text-white border-[#3C81C6]" : "bg-white dark:bg-[#1e242b] border-[#e5e7eb] dark:border-[#2d353e]"}`}>
                    Theo thuốc ({drugInst.length})
                </button>
            </div>
            <div className="bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl overflow-hidden">
                {(tab === "templates" ? templates : drugInst).length === 0 ? <EmptyState icon="menu_book" title="Chưa có hướng dẫn" />
                : (
                    <ul className="divide-y divide-[#e5e7eb] dark:divide-[#2d353e]">
                        {(tab === "templates" ? templates : drugInst).map((it: any, i: number) => (
                            <li key={it.id ?? i} className="p-4 text-sm">
                                <p className="font-medium">{it.name ?? it.title ?? it.drug_name ?? "—"}</p>
                                <p className="text-xs text-[#687582] mt-1">{it.content ?? it.instruction ?? "—"}</p>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

export default function PharmacyMasterDataPage() {
    const sp = useSearchParams();
    const router = useRouter();
    const initialTab = (sp.get("tab") as TabKey) ?? "drugs";
    const [tab, setTab] = useState<TabKey>(initialTab);

    const onTab = (t: TabKey) => {
        setTab(t);
        const url = new URL(window.location.href);
        url.searchParams.set("tab", t);
        router.replace(url.pathname + url.search);
    };

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
            <PageHeader
                title="Master Data — Kho & danh mục thuốc"
                subtitle="Danh mục thuốc, nhóm thuốc, nhà cung cấp, kho thuốc, hướng dẫn dùng thuốc."
                icon="database"
                breadcrumbs={[
                    { label: "Portal", href: "/portal/pharmacist" },
                    { label: "Master data" },
                ]}
            />

            <div className="flex flex-wrap gap-2 mb-4 border-b border-[#e5e7eb] dark:border-[#2d353e]">
                {TABS.map(t => (
                    <button key={t.key} onClick={() => onTab(t.key)} className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t.key ? "border-[#3C81C6] text-[#3C81C6]" : "border-transparent text-[#687582] hover:text-[#121417] dark:hover:text-white"}`}>
                        <span className="material-symbols-outlined text-[16px] mr-1 align-middle">{t.icon}</span>
                        {t.label}
                    </button>
                ))}
            </div>

            {tab === "drugs" && <DrugsTab />}
            {tab === "categories" && <SimpleListTab endpoint="/api/pharmacy/categories" extraFields={["description"]} />}
            {tab === "suppliers" && <SimpleListTab endpoint="/api/suppliers" extraFields={["phone", "email"]} />}
            {tab === "warehouses" && <SimpleListTab endpoint="/api/warehouses" extraFields={["code", "description"]} />}
            {tab === "instructions" && <InstructionsTab />}
        </div>
    );
}
