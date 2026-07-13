export class MeetupApiError extends Error {
  constructor(
    message: string,
    public code?: string,
    public field?: string
  ) {
    super(message);
    this.name = 'MeetupApiError';
  }
}

export class MeetupAuthError extends Error {
  constructor(message: string = 'Invalid or missing Meetup access token') {
    super(message);
    this.name = 'MeetupAuthError';
  }
}

export class MeetupGraphQLError extends Error {
  constructor(
    message: string,
    public errors?: Array<{ message: string; code?: string }>
  ) {
    super(message);
    this.name = 'MeetupGraphQLError';
  }
}

export class MeetupNetworkError extends Error {
  constructor(message: string = 'Network error occurred') {
    super(message);
    this.name = 'MeetupNetworkError';
  }
}
