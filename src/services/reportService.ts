import axiosClient from '@/api/axiosClient';
import { REPORT_ENDPOINTS } from '@/api/endpoints';
import {
    normalizeDashboardReport,
    normalizeRevenueReport,
    type DashboardReportDto,
    type RevenueReportDto,
} from '@/features/admin/reports/reportAdapters';

type ReportParams = Record<string, unknown>;

export const reportService = {
    getDashboard: async (params?: ReportParams): Promise<DashboardReportDto> => {
        const response = await axiosClient.get(REPORT_ENDPOINTS.DASHBOARD, { params });
        return normalizeDashboardReport(response);
    },

    getRevenue: async (params?: ReportParams): Promise<RevenueReportDto> => {
        const response = await axiosClient.get(REPORT_ENDPOINTS.REVENUE, { params });
        return normalizeRevenueReport(response);
    },
};
