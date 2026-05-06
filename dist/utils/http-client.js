import axios from "axios";
export async function requestWithRetry(options) {
    const retry = options.retry ?? { retries: 2, baseDelayMs: 500, maxDelayMs: 3000 };
    let attempt = 0;
    let lastError;
    while (attempt <= retry.retries) {
        try {
            const response = await axios({
                ...options,
                timeout: options.timeoutMs ?? options.timeout
            });
            return response.data;
        }
        catch (error) {
            lastError = error;
            const status = error.response?.status;
            if (status && status >= 400 && status < 500 && status !== 429) {
                break;
            }
            const delay = Math.min(retry.baseDelayMs * 2 ** attempt, retry.maxDelayMs);
            await new Promise((resolve) => setTimeout(resolve, delay));
        }
        attempt += 1;
    }
    throw lastError;
}
