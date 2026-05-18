"use client";

import Link from "next/link";
import { ROUTES } from "@/constants/routes";

interface MedicineAlert {
    id: string;
    name: string;
    code: string;
    stock: number;
    unit: string;
    alertType: string;
    alertLabel: string;
    expiryDate: string;
}

const ALERT_STYLES: Record<string, { bg: string; text: string; icon: string }> = {
    low_stock: { bg: "bg-amber-50 dark:bg-amber-900/20", text: "text-amber-700 dark:text-amber-400", icon: "trending_down" },
    expiring: { bg: "bg-orange-50 dark:bg-orange-900/20", text: "text-orange-700 dark:text-orange-400", icon: "schedule" },
    low_stock_and_expiring: { bg: "bg-red-50 dark:bg-red-900/20", text: "text-red-700 dark:text-red-400", icon: "warning" },
    out_of_stock: { bg: "bg-red-50 dark:bg-red-900/20", text: "text-red-700 dark:text-red-400", icon: "close" },
};

export function MedicineAlerts({ data }: { data: MedicineAlert[] }) {
    return (
        <div className="flex flex-col rounded-xl border border-[#dde0e4] bg-white shadow-sm dark:border-[#2d353e] dark:bg-[#1e242b]">
            <div className="flex items-center justify-between border-b border-[#f0f1f3] px-4 py-2.5 dark:border-[#2d353e]">
                <div className="flex items-center gap-2.5">
                    <div className="rounded-lg bg-red-50 p-1.5 dark:bg-red-900/20">
                        <span className="material-symbols-outlined text-[20px] text-red-500">medication</span>
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-[#121417] dark:text-white">Canh bao thuoc</h3>
                        <p className="text-xs text-[#687582] dark:text-gray-500">{data.length} mat hang can chu y</p>
                    </div>
                </div>
                <Link href={ROUTES.ADMIN.MEDICINES_STOCK} className="text-xs font-medium text-[#3C81C6] hover:underline">
                    Xem ton kho
                </Link>
            </div>

            <div className="flex-1 divide-y divide-[#f0f1f3] overflow-y-auto dark:divide-[#2d353e]">
                {data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                        <span className="material-symbols-outlined mb-2 text-4xl text-gray-300 dark:text-gray-600">inbox</span>
                        <p className="text-sm text-[#687582] dark:text-gray-400">Chưa có dữ liệu</p>
                    </div>
                ) : data.map((item) => {
                    const style = ALERT_STYLES[item.alertType] || ALERT_STYLES.low_stock;

                    return (
                        <div key={item.id} className="px-5 py-3 transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                            <div className="flex items-start gap-3">
                                <div className={`mt-0.5 rounded-md p-1 ${style.bg}`}>
                                    <span className={`material-symbols-outlined text-[16px] ${style.text}`}>{style.icon}</span>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="truncate text-sm font-medium text-[#121417] dark:text-white">{item.name}</p>
                                        <span className={`inline-flex flex-shrink-0 items-center rounded px-1.5 py-0.5 text-[10px] font-semibold ${style.bg} ${style.text}`}>
                                            {item.alertLabel}
                                        </span>
                                    </div>
                                    <div className="mt-1 flex items-center gap-3 text-[11px] text-[#687582] dark:text-gray-500">
                                        <span>Ma: {item.code}</span>
                                        <span>•</span>
                                        <span>Ton: <b className={item.stock === 0 ? "text-red-500" : "text-[#121417] dark:text-white"}>{item.stock}</b> {item.unit}</span>
                                        {item.expiryDate && item.expiryDate !== "-" && (
                                            <>
                                                <span>•</span>
                                                <span>HSD: {item.expiryDate}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default MedicineAlerts;
