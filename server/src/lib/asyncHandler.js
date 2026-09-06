/**
 * Express 5 จับ rejected promise ให้อยู่แล้ว แต่ห่อไว้ชัด ๆ อ่านง่ายกว่า
 * และยัง portable ถ้าจะถอยกลับไป Express 4
 * @param {import('express').RequestHandler} fn
 * @returns {import('express').RequestHandler}
 */
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
