import axios from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MeetupGraphQLClient } from '@/platforms/meetup/meetup-client';
import {
  MeetupAuthError,
  MeetupGraphQLError,
  MeetupNetworkError
} from '@/platforms/meetup/meetup-errors';

vi.mock('axios', () => ({
  default: { post: vi.fn() }
}));

const axiosPost = vi.mocked(axios.post);

describe('MeetupGraphQLClient', () => {
  beforeEach(() => {
    axiosPost.mockReset();
  });

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
    it('sends the event mutation and returns the API result', async () => {
      const client = new MeetupGraphQLClient('test-token');
      axiosPost.mockResolvedValueOnce({
        data: { data: { createEvent: { event: { id: '1', eventUrl: 'https://meetup.com/event/1' }, errors: [] } } }
      } as any);

      await expect(client.createEvent({ title: 'Event' } as any)).resolves.toEqual({
        event: { id: '1', eventUrl: 'https://meetup.com/event/1' },
        errors: []
      });
      expect(axiosPost).toHaveBeenCalledWith(
        'https://api.meetup.com/gql-ext',
        expect.objectContaining({ variables: { input: { title: 'Event' } } }),
        expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer test-token' }) })
      );
    });
  });

  describe('searchVenues', () => {
    it('maps venue search results with match scores', async () => {
      const client = new MeetupGraphQLClient('test-token');
      axiosPost.mockResolvedValueOnce({
        data: {
          data: {
            group: {
              venues: {
                edges: [{ node: { id: '1', name: 'Test Venue', address: '123 Test St', city: 'Washington', state: 'DC' } }]
              }
            }
          }
        }
      } as any);

      await expect(client.searchVenues('civictechdc', 'Test Venue')).resolves.toEqual([{
        id: '1', name: 'Test Venue', address: '123 Test St', city: 'Washington', state: 'DC', score: 0.9
      }]);
    });
  });

  describe('query', () => {
    it('throws GraphQL errors returned by Meetup', async () => {
      const client = new MeetupGraphQLClient('test-token');
      axiosPost.mockResolvedValueOnce({ data: { errors: [{ message: 'Invalid event' }] } } as any);

      await expect(client.query('query { event }')).rejects.toBeInstanceOf(MeetupGraphQLError);
    });

    it('throws a network error when the response has no data', async () => {
      const client = new MeetupGraphQLClient('test-token');
      axiosPost.mockResolvedValueOnce({ data: {} } as any);

      await expect(client.query('query { event }')).rejects.toBeInstanceOf(MeetupNetworkError);
    });
  });
});
