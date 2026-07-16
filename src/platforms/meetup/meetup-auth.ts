import axios from 'axios';
import { AuthTokens, OAuthConfig } from './meetup-auth-types.js';

export class MeetupAuth {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor(config: OAuthConfig) {
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.redirectUri = config.redirectUri || `http://localhost:${config.port || 3000}/callback`;
  }

  getAuthorizationUrl(): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: 'event_management'
    });

    return `https://secure.meetup.com/oauth2/authorize?${params}`;
  }

  async exchangeCodeForTokens(code: string): Promise<AuthTokens> {
    const response = await axios.post(
      'https://secure.meetup.com/oauth2/access',
      new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'authorization_code',
        redirect_uri: this.redirectUri,
        code
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    );

    const expiresIn = response.data.expires_in;
    const tokens: AuthTokens = {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      expiresIn,
      expiresAt: Date.now() + (expiresIn * 1000)
    };

    return tokens;
  }

  async refreshAccessToken(refreshToken: string): Promise<AuthTokens> {
    const response = await axios.post(
      'https://secure.meetup.com/oauth2/access',
      new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    );

    const expiresIn = response.data.expires_in;
    const tokens: AuthTokens = {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      expiresIn,
      expiresAt: Date.now() + (expiresIn * 1000)
    };

    return tokens;
  }

  isTokenExpired(tokens: AuthTokens): boolean {
    if (!tokens.expiresAt) {
      return false;
    }
    return Date.now() >= tokens.expiresAt - 60000;
  }
}
