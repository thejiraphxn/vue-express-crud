/**
 * Error ที่ตั้งใจโยนจาก route handler แล้วให้ error middleware แปลงเป็น response
 * รูปแบบเดียวกันทั้งระบบ: { message, code, errors? }
 */
export class HttpError extends Error {
  /**
   * @param {number} status
   * @param {string} message
   * @param {{ code?: string, errors?: Record<string, string[]> }} [options]
   */
  constructor(status, message, options = {}) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.code = options.code ?? 'error';
    this.errors = options.errors;
  }
}

export const notFound = (resource, id) =>
  new HttpError(404, `${resource} id "${id}" not found`, { code: 'not_found' });

export const conflict = (message, errors) =>
  new HttpError(409, message, { code: 'conflict', errors });
