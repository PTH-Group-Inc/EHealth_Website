/**
 * Dịch lỗi BE sang ngôn ngữ hiện tại.
 *
 * BE trả `{ success: false, code: "AUTH_002", message: "..." }`.
 * - Nếu code khớp key trong `errors.json` → dịch sang locale hiện tại
 * - Nếu không có key: fallback theo thứ tự
 *     1. HTTP status code (http_400, http_401, ...)
 *     2. BE `message` nguyên văn (tiếng Việt từ BE)
 *     3. `errors.unknown`
 *
 * Dùng trong component:
 *   const tErr = useTranslations("errors");
 *   try { ... } catch (e) { toast.error(translateError(e, tErr)); }
 */

type ErrTranslator = (key: string, values?: Record<string, string | number | Date>) => string;

interface AxiosLikeError {
    code?: string;
    message?: string;
    response?: {
        status?: number;
        data?: {
            code?: string;
            message?: string;
        };
    };
}

function hasKey(t: ErrTranslator, key: string): boolean {
    try {
        const result = t(key);
        return result !== key && typeof result === "string" && result.length > 0;
    } catch {
        return false;
    }
}

export function translateError(error: unknown, t: ErrTranslator): string {
    const err = error as AxiosLikeError;

    const beCode = err?.response?.data?.code;
    if (beCode && hasKey(t, beCode)) {
        return t(beCode);
    }

    const status = err?.response?.status;
    if (status) {
        const key = `http_${status}`;
        if (hasKey(t, key)) return t(key);
    }

    const isTimeout = err?.code === "ECONNABORTED" || /timeout/i.test(err?.message ?? "");
    if (isTimeout && hasKey(t, "timeout")) return t("timeout");

    const isNetwork = err?.code === "ERR_NETWORK" || err?.message === "Network Error";
    if (isNetwork && hasKey(t, "network")) return t("network");

    const beMessage = err?.response?.data?.message;
    if (beMessage) return beMessage;

    return hasKey(t, "unknown") ? t("unknown") : "Unknown error.";
}
