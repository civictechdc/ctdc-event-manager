import { describe, it, expect } from 'vitest';
import { MeetupGraphQLClient } from '@/platforms/meetup/meetup-client';
import { MeetupAuthError } from '@/platforms/meetup/meetup-errors';

describe('MeetupGraphQLClient', () => {
  describe('constructor', () => {
    it('should throw error with empty access token', () => {
      expect(() => new MeetupGraphQLClient('')).toThrow(MeetupAuthError);
      expect(() => new MeetupGraphQLClient('  ')).toThrow(MeetupAuthError);
    });

    it('should create client with valid access token', () => {
      const client = new MeetupGraphQLClient('valid-access-token');
      expect(client).toBeDefined();
    });
  });

  describe('calculateMatchScore', () => {
    it('should return high score for exact match', () => {
      const client = new MeetupGraphQLClient('test-token');
      const score = (client as any).calculateMatchScore('Test Venue', {
        id: '1',
        name: 'Test Venue',
        address: '123 Test St',
        city: 'Washington',
        state: 'DC'
      });

      expect(score).toBe(0.9);
    });

    it('should return partial score for partial match', () => {
      const client = new MeetupGraphQLClient('test-token');
      const score = (client as any).calculateMatchScore('Test Washington', {
        id: '1',
        name: 'Test Venue',
        address: '123 Test St',
        city: 'Washington',
        state: 'DC'
      });

      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThan(0.9);
    });

    it('should return 0 for no match', () => {
      const client = new MeetupGraphQLClient('test-token');
      const score = (client as any).calculateMatchScore('Different Place', {
        id: '1',
        name: 'Test Venue',
        address: '123 Test St',
        city: 'Washington',
        state: 'DC'
      });

      expect(score).toBeLessThan(0.5);
    });
  });

  describe('createEvent', () => {
    it('should be a method', () => {
      const client = new MeetupGraphQLClient('test-token');
      expect(typeof client.createEvent).toBe('function');
    });
  });

  describe('searchVenues', () => {
    it('should be a method', () => {
      const client = new MeetupGraphQLClient('test-token');
      expect(typeof client.searchVenues).toBe('function');
    });
  });
});
