import request from 'supertest';
import { describe, it, expect } from 'vitest';
import { app } from './app';

describe('mock api (dev)', () => {
  it('GET / responde com saudação', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'Hello API' });
  });

  it('GET /api/products devolve payload paginado', async () => {
    const res = await request(app).get('/api/products').query({ page: 1, pageSize: 5 });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.items).toBeInstanceOf(Array);
  });

  it('GET /api/products-metadata/categories', async () => {
    const res = await request(app).get('/api/products-metadata/categories');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
