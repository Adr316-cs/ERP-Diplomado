'use strict';

const frontendOrigin =
  'https://erp-diplomado.luis-adriancanosampedro2006.workers.dev';
process.env.CORS_ORIGINS = 'http://localhost:19006,http://localhost:8081';
const localOrigin = 'http://localhost:19006';

const request = require('supertest');
const app = require('../../src/app');

describe('CORS preflight', () => {
  test('permite el preflight de login desde el frontend publicado', async () => {
    const response = await request(app)
      .options('/api/v1/auth/login')
      .set('Origin', frontendOrigin)
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'content-type,authorization')
      .expect(204);

    expect(response.headers['access-control-allow-origin']).toBe(frontendOrigin);
    expect(response.headers['access-control-allow-methods']).toContain('GET');
    expect(response.headers['access-control-allow-methods']).toContain('POST');
    expect(response.headers['access-control-allow-methods']).toContain('OPTIONS');
    expect(response.headers['access-control-allow-headers']).toContain('Content-Type');
    expect(response.headers['access-control-allow-headers']).toContain('Authorization');
    expect(response.headers['access-control-allow-credentials']).toBeUndefined();
  });

  test('no permite un origen que no está en la lista configurada', async () => {
    const response = await request(app)
      .options('/api/v1/auth/login')
      .set('Origin', 'https://untrusted.example')
      .set('Access-Control-Request-Method', 'POST');

    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });

  test('mantiene permitido el origen local de desarrollo', async () => {
    const response = await request(app)
      .options('/api/v1/auth/login')
      .set('Origin', localOrigin)
      .set('Access-Control-Request-Method', 'POST')
      .expect(204);

    expect(response.headers['access-control-allow-origin']).toBe(localOrigin);
  });
});
