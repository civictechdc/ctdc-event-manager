import axios from 'axios';
import {
  CreateEventInput,
  CreateEventResult,
  GroupVenuesResponse,
  GraphQLResponse,
  VenueNode
} from './meetup-types.js';
import {
  MeetupApiError,
  MeetupAuthError,
  MeetupGraphQLError,
  MeetupNetworkError
} from './meetup-errors.js';
import { VenueMatch } from '../platform.interface.js';
import { AxiosError } from 'axios';

export class MeetupGraphQLClient {
  private endpoint = 'https://api.meetup.com/gql-ext';
  private accessToken: string;

  constructor(accessToken: string) {
    if (!accessToken || accessToken.trim().length === 0) {
      throw new MeetupAuthError();
    }
    this.accessToken = accessToken;
  }

  async query<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
    try {
      const response = await axios.post<GraphQLResponse<T>>(
        this.endpoint,
        { query, variables },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.errors && response.data.errors.length > 0) {
        throw new MeetupGraphQLError(
          response.data.errors[0].message,
          response.data.errors
        );
      }

      if (!response.data.data) {
        throw new MeetupNetworkError('No data received from Meetup API');
      }

      return response.data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async createEvent(input: CreateEventInput): Promise<CreateEventResult> {
    const mutation = `
      mutation($input: CreateEventInput!) {
        createEvent(input: $input) {
          event {
            id
            eventUrl
          }
          errors {
            message
            code
            field
          }
        }
      }
    `;

    const result = await this.query<{ createEvent: CreateEventResult }>(
      mutation,
      { input }
    );

    return result.createEvent;
  }

  async searchVenues(groupUrlname: string, query: string): Promise<VenueMatch[]> {
    const queryStr = `
      query($groupUrlname: String!, $query: String!) {
        group(urlname: $groupUrlname) {
          venues(query: $query, first: 10) {
            edges {
              node {
                id
                name
                address
                city
                state
                lat
                lng
              }
            }
          }
        }
      }
    `;

    const result = await this.query<GroupVenuesResponse>(
      queryStr,
      { groupUrlname, query }
    );

    return result.group.venues.edges.map(e => ({
      id: e.node.id,
      name: e.node.name,
      address: e.node.address,
      city: e.node.city,
      state: e.node.state,
      score: this.calculateMatchScore(query, e.node)
    }));
  }

  private calculateMatchScore(query: string, venue: VenueNode): number {
    const queryLower = query.toLowerCase();
    const venueText = `${venue.name} ${venue.address} ${venue.city}`.toLowerCase();
    
    if (venueText.includes(queryLower)) {
      return 0.9;
    }
    
    const queryWords = queryLower.split(/\s+/);
    const matchCount = queryWords.filter(word => venueText.includes(word)).length;
    
    return matchCount / queryWords.length * 0.7;
  }

  private handleError(error: unknown): Error {
    if (error instanceof MeetupApiError || 
        error instanceof MeetupAuthError || 
        error instanceof MeetupGraphQLError || 
        error instanceof MeetupNetworkError) {
      return error;
    }

    const axiosError = error as AxiosError<GraphQLResponse<unknown>>;
    
    if (axiosError.isAxiosError) {
      if (axiosError.response) {
        const status = axiosError.response.status;

        if (status === 401) {
          return new MeetupAuthError('Authentication failed. Please check your Meetup access token.');
        }

        if (axiosError.response.data?.errors) {
          return new MeetupGraphQLError(
            axiosError.response.data.errors[0].message,
            axiosError.response.data.errors
          );
        }

        return new MeetupApiError(`API error: ${status}`);
      }

      if (axiosError.request) {
        return new MeetupNetworkError('No response received from Meetup API');
      }
    }

    return new MeetupNetworkError(
      error instanceof Error ? error.message : 'Unknown error occurred'
    );
  }
}
