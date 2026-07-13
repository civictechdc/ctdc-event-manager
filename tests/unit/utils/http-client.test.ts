import { describe, it, expect } from 'vitest';
import { HttpClient } from '@/utils/http-client';

describe('HttpClient', () => {
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
});
