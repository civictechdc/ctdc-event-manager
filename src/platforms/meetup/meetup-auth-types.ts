export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  expiresAt?: number;
}

export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri?: string;
  port?: number;
}
