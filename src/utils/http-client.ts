import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

export interface HttpClientConfig {
  baseURL: string;
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

export class HttpClient {
  private client: AxiosInstance;
  private retries: number;
  private retryDelay: number;

  constructor(config: HttpClientConfig) {
    this.client = axios.create({
      baseURL: config.baseURL,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers
      },
      timeout: config.timeout || 30000
    });

    this.retries = config.retries || 3;
    this.retryDelay = config.retryDelay || 1000;
  }

  async get<T>(path: string, params?: Record<string, unknown>): Promise<T> {
    return this.request<T>('GET', path, { params });
  }

  async post<T>(path: string, data?: unknown): Promise<T> {
    return this.request<T>('POST', path, { data });
  }

  async put<T>(path: string, data?: unknown, _headers?: Record<string, string>): Promise<T> {
    return this.request<T>('PUT', path, { data });
  }

  async delete<T>(path: string): Promise<T> {
    return this.request<T>('DELETE', path);
  }

  private async request<T>(
    method: string,
    path: string,
    config?: Partial<InternalAxiosRequestConfig>
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.retries; attempt++) {
      try {
        const response = await this.client.request<T>({
          method,
          url: path,
          ...config
        });
        return response.data;
      } catch (error) {
        lastError = error as Error;

        if (axios.isAxiosError(error)) {
          const axiosError = error as AxiosError;
          
          if (axiosError.response?.status === 401) {
            throw error;
          }

          if (axiosError.response?.status === 429) {
            const retryAfter = axiosError.response.headers['retry-after'];
            if (retryAfter) {
              const delay = parseInt(retryAfter, 10) * 1000;
              await this.sleep(delay);
              continue;
            }
          }

          if (axiosError.response?.status && axiosError.response.status < 500) {
            throw error;
          }
        }

        if (attempt < this.retries - 1) {
          await this.sleep(this.retryDelay * Math.pow(2, attempt));
        }
      }
    }

    throw lastError;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  setHeader(key: string, value: string): void {
    this.client.defaults.headers.common[key] = value;
  }

  setAuthToken(token: string): void {
    this.setHeader('Authorization', `Bearer ${token}`);
  }
}
