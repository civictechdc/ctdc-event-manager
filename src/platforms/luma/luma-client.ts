import { HttpClient } from '../../utils/http-client';
import { 
  LumaEventRequest, 
  LumaEventResponse, 
  LumaUploadUrlResponse 
} from './luma-types';
import { 
  LumaApiError, 
  LumaAuthError, 
  LumaRateLimitError, 
  LumaNetworkError 
} from './luma-errors';
import axios, { AxiosError, AxiosInstance } from 'axios';
import * as fs from 'fs/promises';
import * as path from 'path';

export class LumaClient {
  private httpClient: HttpClient;
  private axiosClient: AxiosInstance;

  constructor(apiKey: string) {
    if (!apiKey || apiKey.trim().length === 0) {
      throw new LumaAuthError();
    }

    this.httpClient = new HttpClient({
      baseURL: 'https://public-api.luma.com',
      headers: {
        'x-luma-api-key': apiKey
      },
      retries: 3,
      retryDelay: 1000
    });

    this.axiosClient = axios.create({
      baseURL: 'https://public-api.luma.com'
    });
  }

  async createEvent(eventData: LumaEventRequest): Promise<LumaEventResponse> {
    try {
      const response = await this.httpClient.post<LumaEventResponse>(
        '/v1/event/create',
        eventData
      );
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getUploadUrl(filename: string, contentType: string): Promise<LumaUploadUrlResponse> {
    try {
      const response = await this.httpClient.post<LumaUploadUrlResponse>(
        '/v1/images/create-upload-url',
        {
          filename,
          content_type: contentType
        }
      );
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async uploadImage(uploadUrl: string, imageData: Buffer, contentType: string): Promise<string> {
    try {
      await this.axiosClient.put(uploadUrl, imageData, {
        headers: {
          'Content-Type': contentType
        }
      });
      
      return uploadUrl.split('?')[0];
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async uploadImageFromPath(imagePath: string): Promise<string> {
    const imageBuffer = await fs.readFile(imagePath);
    const filename = path.basename(imagePath);
    const contentType = this.getContentType(filename);
    
    const { upload_url } = await this.getUploadUrl(filename, contentType);
    const cdnUrl = await this.uploadImage(upload_url, imageBuffer, contentType);
    
    return cdnUrl;
  }

  private getContentType(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    const contentTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.avif': 'image/avif'
    };
    
    return contentTypes[ext] || 'application/octet-stream';
  }

  private handleError(error: unknown): Error {
    if (error instanceof LumaApiError || 
        error instanceof LumaAuthError || 
        error instanceof LumaRateLimitError || 
        error instanceof LumaNetworkError) {
      return error;
    }

    const axiosError = error as AxiosError;
    
    if (axiosError.isAxiosError) {
      if (axiosError.response) {
        const status = axiosError.response.status;
        const data = axiosError.response.data as { message?: string; code?: string; field?: string } | undefined;

        if (status === 401) {
          return new LumaAuthError(data?.message || 'Authentication failed');
        }

        if (status === 429) {
          const retryAfter = axiosError.response.headers['retry-after'];
          return new LumaRateLimitError(
            data?.message || 'Rate limit exceeded',
            retryAfter ? parseInt(retryAfter, 10) : undefined
          );
        }

        return new LumaApiError(
          data?.message || `API error: ${status}`,
          status,
          data?.code,
          data?.field
        );
      }

      if (axiosError.request) {
        return new LumaNetworkError('No response received from Luma API');
      }
    }

    return new LumaNetworkError(
      error instanceof Error ? error.message : 'Unknown error occurred'
    );
  }
}
