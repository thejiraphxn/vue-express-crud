import { Router } from 'express';
import { asyncHandler } from '../lib/asyncHandler.js';
import { validate } from '../lib/validate.js';
import { conflict, notFound } from '../lib/errors.js';
import { productCreateSchema, productQuerySchema, productUpdateSchema } from '../schemas.js';
import * as db from '../db.js';

export const productsRouter = Router();

// GET /api/products?search=&category=&status=&sort=&order=&page=&pageSize=
productsRouter.get(
  '/',
  validate(productQuerySchema, 'query'),
  asyncHandler((req, res) => {
    res.json(db.listProducts(req.validated.query));
  }),
);

// GET /api/products/:id
productsRouter.get(
  '/:id',
  asyncHandler((req, res) => {
    const product = db.findProduct(req.params.id);
    if (!product) throw notFound('Product', req.params.id);
    res.json({ data: product });
  }),
);

// POST /api/products
productsRouter.post(
  '/',
  validate(productCreateSchema),
  asyncHandler((req, res) => {
    const input = req.validated.body;
    if (db.isSkuTaken(input.sku)) {
      throw conflict('SKU already exists', { sku: ['SKU already exists'] });
    }
    res.status(201).json({ data: db.createProduct(input) });
  }),
);

// PATCH /api/products/:id
productsRouter.patch(
  '/:id',
  validate(productUpdateSchema),
  asyncHandler((req, res) => {
    const { id } = req.params;
    const patch = req.validated.body;
    if (!db.findProduct(id)) throw notFound('Product', id);
    if (patch.sku && db.isSkuTaken(patch.sku, id)) {
      throw conflict('SKU already exists', { sku: ['SKU already exists'] });
    }
    res.json({ data: db.updateProduct(id, patch) });
  }),
);

// DELETE /api/products/:id
productsRouter.delete(
  '/:id',
  asyncHandler((req, res) => {
    const deleted = db.deleteProduct(req.params.id);
    if (!deleted) throw notFound('Product', req.params.id);
    res.status(204).end();
  }),
);
