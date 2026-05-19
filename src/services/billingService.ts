import axiosClient from '@/api/axiosClient';
import { BILLING_ENDPOINTS } from '@/api/endpoints';

export const billingService = {
    // ─── Invoices ───────────────────────────────────────────────────────────
    /** List invoices with optional filters: status, dateFrom, dateTo, patientId */
    getInvoices: (params?: Record<string, any>) =>
        axiosClient.get(BILLING_ENDPOINTS.LIST, { params }),

    /** Invoice detail by ID */
    getDetail: (id: string) =>
        axiosClient.get(BILLING_ENDPOINTS.DETAIL(id)),

    /** Create new invoice */
    createInvoice: (data: Record<string, any>) =>
        axiosClient.post(BILLING_ENDPOINTS.CREATE, data),

    /** Update invoice fields */
    updateInvoice: (id: string, data: Record<string, any>) =>
        axiosClient.put(BILLING_ENDPOINTS.DETAIL(id), data),

    /** Cancel an invoice */
    cancelInvoice: (id: string, reason?: string) =>
        axiosClient.patch(BILLING_ENDPOINTS.CANCEL(id), { reason }),

    /** Auto-generate invoice from encounter */
    generateInvoice: (encounterId: string) =>
        axiosClient.post(BILLING_ENDPOINTS.GENERATE(encounterId), {}),

    /** List invoices by patient */
    getByPatient: (patientId: string, params?: Record<string, any>) =>
        axiosClient.get(BILLING_ENDPOINTS.BY_PATIENT(patientId), { params }),

    /** List invoices by encounter */
    getByEncounter: (encounterId: string) =>
        axiosClient.get(BILLING_ENDPOINTS.BY_ENCOUNTER(encounterId)),

    /** Get line items of an invoice */
    getItems: (invoiceId: string) =>
        axiosClient.get(BILLING_ENDPOINTS.ITEMS(invoiceId)),

    /** Add a line item to an invoice */
    addItem: (invoiceId: string, item: Record<string, any>) =>
        axiosClient.post(BILLING_ENDPOINTS.ITEMS(invoiceId), item),

    /** Remove a line item from an invoice */
    removeItem: (invoiceId: string, itemId: string) =>
        axiosClient.delete(`${BILLING_ENDPOINTS.ITEMS(invoiceId)}/${itemId}`),

    /** Export invoices report */
    exportInvoices: (params?: Record<string, any>) =>
        axiosClient.get('/api/billing/invoices/export', { params, responseType: 'blob' }),

    // ─── Payments ───────────────────────────────────────────────────────────
    /** Pay offline (cash / bank transfer) */
    pay: (invoiceId: string, data: { payment_method: string; amount: number; notes?: string }) =>
        axiosClient.post(BILLING_ENDPOINTS.PAY, { invoice_id: invoiceId, ...data }),

    /** Get payments by invoice */
    getPaymentsByInvoice: (invoiceId: string) =>
        axiosClient.get(`/api/billing/payments/by-invoice/${invoiceId}`),

    /** Pay online via payment gateway */
    payOnline: (data: Record<string, any>) =>
        axiosClient.post(BILLING_ENDPOINTS.PAY_ONLINE, data),

    /** Create SePay QR code for payment */
    createQR: (data: { invoiceId: string; amount?: number; description?: string }) =>
        axiosClient.post('/api/billing/payments/qr-generate', {
            invoice_id: data.invoiceId,
            amount: data.amount,
            description: data.description,
        }),

    /** Poll payment status by orderId */
    getQRStatus: (orderId: string) =>
        axiosClient.get(`/api/billing/payments/orders/${orderId}/status`),

    /** List payments with optional filters */
    getPayments: (params?: Record<string, any>) =>
        axiosClient.get(BILLING_ENDPOINTS.PAYMENTS, { params }),

    /** Payment detail */
    getPaymentDetail: (id: string) =>
        axiosClient.get(BILLING_ENDPOINTS.PAYMENT_DETAIL(id)),

    /** Refund a payment */
    refund: (id: string, data: Record<string, any>) =>
        axiosClient.post(BILLING_ENDPOINTS.REFUND(id), data),

    /** Batch refund multiple payments */
    batchRefund: (data: { paymentIds: string[]; reason: string }) =>
        axiosClient.post('/api/billing/refunds/batch', data),

    // ─── Offline / POS ──────────────────────────────────────────────────────
    /** Create POS receipt */
    createReceipt: (data: Record<string, any>) =>
        axiosClient.post('/api/billing/offline/receipt', data),

    /** Get a specific POS receipt */
    getReceipt: (receiptId: string) =>
        axiosClient.get(`/api/billing/offline/receipts/${receiptId}`),

    /** List POS receipts */
    listReceipts: (params?: Record<string, any>) =>
        axiosClient.get('/api/billing/offline/receipts', { params }),

    /** List offline transactions */
    getTransactions: (params?: Record<string, any>) =>
        axiosClient.get(BILLING_ENDPOINTS.TRANSACTIONS, { params }),

    // ─── Documents (E-invoice) ───────────────────────────────────────────────
    /** Download invoice PDF */
    getInvoicePDF: (invoiceId: string) =>
        axiosClient.get(`/api/billing/documents/${invoiceId}/pdf`, { responseType: 'blob' }),

    /** Download receipt PDF */
    getReceiptPDF: (receiptId: string) =>
        axiosClient.get(`/api/billing/documents/receipts/${receiptId}/pdf`, { responseType: 'blob' }),

    /** Send e-invoice via email */
    sendEmail: (invoiceId: string, email?: string) =>
        axiosClient.post(`/api/billing/documents/${invoiceId}/send-email`, { email }),

    // ─── Pricing ────────────────────────────────────────────────────────────
    /** Get pricing catalog (general, no prices) */
    getCatalog: (params?: Record<string, any>) =>
        axiosClient.get('/api/billing/pricing/catalog', { params }),

    /** Get facility-specific pricing catalog with base_price, insurance_price, service_group */
    getCatalogByFacility: (facilityId: string, params?: Record<string, any>) =>
        axiosClient.get(`/api/billing/pricing/catalog/${facilityId}`, { params }),

    /** Get payment gateway config (bank account, account holder, etc.) */
    getGatewayConfig: () =>
        axiosClient.get('/api/billing/payments/gateway/config'),

    /** Resolve price for a specific service */
    resolvePrice: (serviceId: string, params?: Record<string, any>) =>
        axiosClient.get('/api/billing/pricing/resolve', { params: { serviceId, ...params } }),

    /** List pricing policies */
    listPolicies: (params?: Record<string, any>) =>
        axiosClient.get('/api/billing/pricing/policies', { params }),

    /** List active pricing policies (for discount dropdown) */
    listActivePolicies: () =>
        axiosClient.get('/api/billing/pricing-policies/active'),

    /** Apply a pricing policy to an invoice */
    applyPolicy: (invoiceId: string, policyId: string) =>
        axiosClient.post(`/api/billing/invoices/${invoiceId}/apply-policy`, { policyId }),

    // ─── Reconciliation ──────────────────────────────────────────────────────
    /** Get reconciliation sessions */
    reconcile: (params?: Record<string, any>) =>
        axiosClient.get(BILLING_ENDPOINTS.RECONCILIATION, { params }),

    // ─── Cashier Shifts ──────────────────────────────────────────────────────
    /** Open a cashier shift */
    openShift: (data: Record<string, any>) =>
        axiosClient.post('/api/billing/cashier-shifts/open', data),

    /** Close a cashier shift */
    closeShift: (shiftId: string, data?: Record<string, any>) =>
        axiosClient.post(`/api/billing/cashier-shifts/${shiftId}/close`, data ?? {}),

    /** List cashier shifts */
    listShifts: (params?: Record<string, any>) =>
        axiosClient.get('/api/billing/cashier-shifts', { params }),

    /** Get shift summary */
    getShiftSummary: (shiftId: string) =>
        axiosClient.get(`/api/billing/cashier-shifts/${shiftId}/summary`),
};
