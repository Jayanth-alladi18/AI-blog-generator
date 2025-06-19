const request = require('supertest');
const app = require('./server');

// Mock the Gemini API
jest.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
      getGenerativeModel: () => ({
        generateContent: () => Promise.resolve({
          response: {
            text: () => Promise.resolve('Mocked blog post content')
          }
        })
      })
    }))
  };
});

describe('POST /generate', () => {
  it('should return 200 and a blog post if topic is valid', async () => {
    const res = await request(app)
      .post('/generate')
      .send({ topic: 'Artificial Intelligence', length: 'short' });

    expect(res.statusCode).toBe(200);
    expect(res.body.post).toContain('Mocked blog post content');
  });

  it('should return 400 if topic is missing', async () => {
    const res = await request(app).post('/generate').send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('A valid topic is required.');
  });
});

describe('GET /history', () => {
  it('should return 200 and an array (possibly empty)', async () => {
    const res = await request(app).get('/history');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
