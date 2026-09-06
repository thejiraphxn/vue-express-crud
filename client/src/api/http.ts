import axios, { AxiosError, type AxiosInstance } from 'axios';

/** รูปแบบ error ที่ backend ส่งกลับมาเสมอ */
interface ApiErrorBody {
  message: string;
  code?: string;
  errors?: Record<string, string[] | undefined>;
}

/**
 * error กลางของแอป — component ไม่ต้องรู้จัก AxiosError อีกต่อไป
 * fieldErrors ถูก flatten ให้พร้อมส่งเข้า form.setErrors() ของ vee-validate
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fieldErrors: Record<string, string>;

  constructor(message: string, status: number, code: string, fieldErrors: Record<string, string> = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }

  get isValidation() {
    return this.status === 422 || this.status === 409;
  }

  static from(error: unknown): ApiError {
    if (error instanceof ApiError) return error;

    const axiosError = error as AxiosError<ApiErrorBody>;
    if (!axios.isAxiosError(axiosError)) {
      return new ApiError('Unexpected error', 0, 'unknown');
    }
    if (!axiosError.response) {
      return new ApiError('Cannot reach the server. Is the API running?', 0, 'network_error');
    }

    const body = axiosError.response.data;
    const fieldErrors = Object.fromEntries(
      Object.entries(body?.errors ?? {})
        .filter(([, messages]) => messages?.length)
        .map(([field, messages]) => [field, messages![0]]),
    );

    return new ApiError(
      body?.message ?? axiosError.message,
      axiosError.response.status,
      body?.code ?? 'error',
      fieldErrors,
    );
  }
}

export const http: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});

// interceptor เดียวจบ: ทุก error ที่ออกจาก http จะเป็น ApiError เสมอ
http.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(ApiError.from(error)),
);
