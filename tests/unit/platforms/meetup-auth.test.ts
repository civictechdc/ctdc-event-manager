import { describe, it, expect } from 'vitest';
import { MeetupAuth } from '@/platforms/meetup/meetup-auth';

describe('MeetupAuth', () => {
  describe('constructor', () => {
    it('should create auth instance with config', () => {
      const auth = new MeetupAuth({
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret'
      });
      expect(auth).toBeDefined();
    });

    it('should use default redirect URI if not specified', () => {
      const auth = new MeetupAuth({
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret'
      });
      const url = auth.getAuthorizationUrl();
      expect(url).toContain('redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fcallback');
    });

    it('should use custom port for redirect URI', () => {
      const auth = new MeetupAuth({
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        port: 8080
      });
      const url = auth.getAuthorizationUrl();
      expect(url).toContain('redirect_uri=http%3A%2F%2Flocalhost%3A8080%2Fcallback');
    });

    it('should use custom redirect URI if specified', () => {
      const auth = new MeetupAuth({
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        redirectUri: 'https://example.com/callback'
      });
      const url = auth.getAuthorizationUrl();
      expect(url).toContain('redirect_uri=https%3A%2F%2Fexample.com%2Fcallback');
    });
  });

  describe('getAuthorizationUrl', () => {
    it('should generate correct authorization URL', () => {
      const auth = new MeetupAuth({
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret'
      });
      const url = auth.getAuthorizationUrl();
      
      expect(url).toContain('https://secure.meetup.com/oauth2/authorize');
      expect(url).toContain('client_id=test-client-id');
      expect(url).toContain('response_type=code');
      expect(url).toContain('scope=event_management');
    });
  });

  describe('isTokenExpired', () => {
    it('should return true for expired tokens', () => {
      const auth = new MeetupAuth({
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret'
      });
      
      const expiredTokens = {
        accessToken: 'test',
        refreshToken: 'test',
        expiresIn: 3600,
        expiresAt: Date.now() - 1000
      };
      
      expect(auth.isTokenExpired(expiredTokens)).toBe(true);
    });

    it('should return false for valid tokens', () => {
      const auth = new MeetupAuth({
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret'
      });
      
      const validTokens = {
        accessToken: 'test',
        refreshToken: 'test',
        expiresIn: 3600,
        expiresAt: Date.now() + 3600000
      };
      
      expect(auth.isTokenExpired(validTokens)).toBe(false);
    });

    it('should return false for tokens without expiresAt', () => {
      const auth = new MeetupAuth({
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret'
      });
      
      const tokensWithoutExpiry = {
        accessToken: 'test',
        refreshToken: 'test',
        expiresIn: 3600
      };
      
      expect(auth.isTokenExpired(tokensWithoutExpiry)).toBe(false);
    });

    it('should return true for tokens expiring within 1 minute', () => {
      const auth = new MeetupAuth({
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret'
      });
      
      const soonToExpireTokens = {
        accessToken: 'test',
        refreshToken: 'test',
        expiresIn: 3600,
        expiresAt: Date.now() + 30000
      };
      
      expect(auth.isTokenExpired(soonToExpireTokens)).toBe(true);
    });
  });
});
