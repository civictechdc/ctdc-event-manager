export type PublishStatus = 'DRAFT' | 'PUBLISHED';
export type MeetupEventType = 'online' | 'inPerson' | 'hybrid';

export interface CreateEventInput {
  groupUrlname: string;
  title: string;
  description?: string;
  startDateTime: string;
  duration?: string;
  venueId?: string;
  publishStatus?: PublishStatus;
  howToFindUs?: string;
  eventType?: MeetupEventType;
}

export interface CreateEventResult {
  event?: {
    id: string;
    eventUrl: string;
  };
  errors?: Array<{
    message: string;
    code: string;
    field?: string;
  }>;
}

export interface VenueNode {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  lat?: number;
  lng?: number;
}

export interface GroupVenuesResponse {
  group: {
    venues: {
      edges: Array<{
        node: VenueNode;
      }>;
    };
  };
}

export interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{
    message: string;
    code?: string;
    path?: string[];
  }>;
}
