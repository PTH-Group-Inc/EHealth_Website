"use client";

interface RevenueData {
    month: string;
    value: number;
}

function formatRevenue(value: number): string {
    if (value >= 1_000_000_000) {
        return `${(value / 1_000_000_000).toFixed(1)} Ty`;
    }
    if (value >= 1_000_000) {
        return `${Math.round(value / 1_000_000)} Tr`;
    }
    return value.toLocaleString("vi-VN");
}

export function RevenueChart({ data }: { data: RevenueData[] }) {
    const maxVal = data.length > 0 ? Math.max(...data.map((item) => item.value), 1) : 1;
    const total = data.reduce((sum, item) => sum + item.value, 0);
    const totalFormatted = formatRevenue(total);

    const lastMonth = data[data.length - 1];
    const prevMonth = data[data.length - 2];
    const changePercent = lastMonth && prevMonth && prevMonth.value > 0
        ? Math.round(((lastMonth.value - prevMonth.value) / prevMonth.value) * 100)
        : 0;
    const isPositive = changePercent >= 0;
    const highlightIdx = Math.max(0, data.length - 2);

    return (
        <div className="flex flex-col rounded-xl border border-[#dde0e4] bg-white shadow-sm dark:border-[#2d353e] dark:bg-[#1e242b]">
            <div className="border-b border-[#f0f1f3] px-4 py-2.5 dark:border-[#2d353e]">
                <div className="flex items-center gap-2.5">
                    <div className="rounded-lg bg-rose-50 p-1.5 dark:bg-rose-900/20">
                        <span className="material-symbols-outlined text-[20px] text-rose-500">bar_chart</span>
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-[#121417] dark:text-white">Doanh thu gan day</h3>
                        <p className="text-xs text-[#687582] dark:text-gray-500">Don vi: VND</p>
                    </div>
                </div>
            </div>

            <div className="px-4 pt-2">
                <div className="flex items-end justify-between gap-2">
                    <div>
                        <p className="mb-0.5 text-xs text-[#687582] dark:text-gray-500">Tổng cộng</p>
                        <p className="text-2xl font-extrabold text-[#121417] dark:text-white">{totalFormatted}</p>
                    </div>
                    <div className={`flex items-center gap-1 text-xs font-bold ${isPositive ? "text-emerald-600" : "text-red-500"}`}>
                        <span className="material-symbols-outlined text-[14px]">{isPositive ? "trending_up" : "trending_down"}</span>
                        {isPositive ? "+" : ""}{changePercent}%
                        <span className="ml-1 font-normal text-[#687582] dark:text-gray-500">ky gan nhat</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 px-4 pb-3 pt-2">
                {data.length === 0 ? (
                    <div className="flex h-28 flex-col items-center justify-center text-center">
                        <span className="material-symbols-outlined mb-2 text-4xl text-gray-300 dark:text-gray-600">inbox</span>
                        <p className="text-sm text-[#687582] dark:text-gray-400">Chưa có dữ liệu</p>
                    </div>
                ) : (
                    <div className="flex h-28 items-end gap-[4px]">
                        {data.map((item, index) => {
                            const pct = (item.value / maxVal) * 100;
                            const isHighlight = index === highlightIdx || index === highlightIdx + 1;

                            return (
                                <div key={item.month} className="group relative flex flex-1 flex-col items-center gap-1.5">
                                    <div className="absolute left-1/2 top-[-2rem] z-10 -translate-x-1/2 whitespace-nowrap rounded bg-[#1e242b] px-1.5 py-0.5 text-[10px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100 dark:bg-white dark:text-[#121417]">
                                        {formatRevenue(item.value)}
                                    </div>
                                    <div
                                        className={`w-full rounded-t-sm transition-all duration-300 ${isHighlight ? "bg-gradient-to-t from-rose-500 to-orange-400 shadow-sm shadow-rose-200 dark:shadow-none" : "bg-rose-500/15 group-hover:bg-rose-500/30"}`}
                                        style={{ height: `${Math.max(pct, 5)}%` }}
                                    />
                                    <span className={`text-[10px] ${isHighlight ? "font-bold text-rose-500 dark:text-rose-400" : "text-[#687582] dark:text-gray-500"}`}>
                                        {item.month}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

export default RevenueChart;
