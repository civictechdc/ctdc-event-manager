export class LumaApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public code?: string,
    public field?: string
  ) {
    super(message);
    this.name = 'LumaApiError';
  }
}

export class LumaAuthError extends Error {
  constructor(message: string = 'Invalid or missing Luma API key') {
    super(message);
    this.name = 'LumaAuthError';
  }
}

export class LumaRateLimitError extends Error {
  constructor(
    message: string = 'Rate limit exceeded',
    public retryAfter?: number
  ) {
    super(message);
    this.name = 'LumaRateLimitError';
  }
}

export class LumaNetworkError extends Error {
  constructor(message: string = 'Network error occurred') {
    super(message);
    this.name = 'LumaNetworkError';
  }
}
