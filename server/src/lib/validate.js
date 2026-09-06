import { z } from 'zod';
import { HttpError } from './errors.js';

/** zod v4 ใช้ z.flattenError, v3 ใช้ err.flatten() — รองรับทั้งคู่ */
const toFieldErrors = (error) =>
  (typeof z.flattenError === 'function' ? z.flattenError(error) : error.flatten()).fieldErrors;

/**
 * middleware factory: validate req[source] แล้วเก็บผลลง req.validated
 * @param {import('zod').ZodType} schema
 * @param {'body' | 'query' | 'params'} source
 */
export const validate = (schema, source = 'body') => (req, _res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    return next(
      new HttpError(422, 'Validation failed', {
        code: 'validation_error',
        errors: toFieldErrors(result.error),
      }),
    );
  }
  req.validated = { ...(req.validated ?? {}), [source]: result.data };
  next();
};
