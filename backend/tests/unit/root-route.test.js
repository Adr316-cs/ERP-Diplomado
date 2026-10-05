'use strict';

const request = require('supertest');
const app = require('../../src/app');

describe('GET /', () => {
  test('returns API status and the health-check URL', async () => {
    const response = await request(app).get('/');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: { status: 'ok', health: '/api/v1/health' },
      message: 'API disponible',
    });
  });
});
