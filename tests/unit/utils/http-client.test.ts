import axios from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpClient } from '@/utils/http-client';

vi.mock('axios', () => ({
  default: {
    create: vi.fn(),
    isAxiosError: vi.fn()
  }
}));

const request = vi.fn();
const axiosCreate = vi.mocked(axios.create);
const isAxiosError = vi.mocked(axios.isAxiosError);

describe('HttpClient', () => {
  beforeEach(() => {
    request.mockReset();
    axiosCreate.mockReset();
    isAxiosError.mockReset();
    axiosCreate.mockReturnValue({
      request,
      defaults: { headers: { common: {} } }
    } as any);
  });

  describe('constructor', () => {
    it('should create client with config', () => {
      const client = new HttpClient({
        baseURL: 'https://api.example.com',
        headers: {
          'X-Custom-Header': 'test'
        }
      });
      expect(client).toBeDefined();
    });

    it('should use default timeout if not specified', () => {
      const client = new HttpClient({
        baseURL: 'https://api.example.com'
      });
      expect(client).toBeDefined();
    });

    it('should accept custom timeout', () => {
      const client = new HttpClient({
        baseURL: 'https://api.example.com',
        timeout: 60000
      });
      expect(client).toBeDefined();
    });

    it('should accept retry configuration', () => {
      const client = new HttpClient({
        baseURL: 'https://api.example.com',
        retries: 5,
        retryDelay: 2000
      });
      expect(client).toBeDefined();
    });
  });

  describe('setHeader', () => {
    it('should set custom header without error', () => {
      const client = new HttpClient({
        baseURL: 'https://api.example.com'
      });
      
      expect(() => {
        client.setHeader('X-Test-Header', 'test-value');
      }).not.toThrow();
    });
  });

  describe('setAuthToken', () => {
    it('should set authorization header without error', () => {
      const client = new HttpClient({
        baseURL: 'https://api.example.com'
      });
      
      expect(() => {
        client.setAuthToken('test-token');
      }).not.toThrow();
    });
  });

  describe('requests', () => {
    it('returns data from each HTTP method', async () => {
      request
        .mockResolvedValueOnce({ data: { id: 'get' } })
        .mockResolvedValueOnce({ data: { id: 'post' } })
        .mockResolvedValueOnce({ data: { id: 'put' } })
        .mockResolvedValueOnce({ data: { id: 'delete' } });
      const client = new HttpClient({ baseURL: 'https://api.example.com' });

      await expect(client.get('/events', { page: 1 })).resolves.toEqual({ id: 'get' });
      await expect(client.post('/events', { title: 'Event' })).resolves.toEqual({ id: 'post' });
      await expect(client.put('/events/1', { title: 'Updated' })).resolves.toEqual({ id: 'put' });
      await expect(client.delete('/events/1')).resolves.toEqual({ id: 'delete' });

      expect(request).toHaveBeenNthCalledWith(1, {
        method: 'GET',
        url: '/events',
        params: { page: 1 }
      });
    });

    it('retries server failures before returning data', async () => {
      vi.useFakeTimers();
      request
        .mockRejectedValueOnce(new Error('temporary failure'))
        .mockResolvedValueOnce({ data: { id: 'retry-success' } });
      const client = new HttpClient({
        baseURL: 'https://api.example.com',
        retries: 2,
        retryDelay: 1
      });

      const result = client.get('/events');
      await vi.runAllTimersAsync();

      await expect(result).resolves.toEqual({ id: 'retry-success' });
      expect(request).toHaveBeenCalledTimes(2);
      vi.useRealTimers();
    });

    it('does not retry unauthorized responses', async () => {
      const error = { response: { status: 401 } };
      request.mockRejectedValueOnce(error);
      isAxiosError.mockReturnValue(true);
      const client = new HttpClient({ baseURL: 'https://api.example.com' });

      await expect(client.get('/events')).rejects.toBe(error);
      expect(request).toHaveBeenCalledTimes(1);
    });
  });
});
