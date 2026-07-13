export interface LumaEventRequest {
  name: string;
  start_at: string;
  timezone: string;
  end_at?: string;
  description_md?: string;
  cover_url?: string;
  geo_address_json?: {
    type: 'manual';
    address: string;
    description?: string;
  };
  visibility?: 'public' | 'members-only' | 'private';
  url?: string;
}

export interface LumaEventResponse {
  api_id: string;
  event: {
    api_id: string;
    name: string;
    url: string;
    start_at: string;
    end_at?: string;
    timezone: string;
  };
}

export interface LumaUploadUrlResponse {
  upload_url: string;
  file_url: string;
}

export interface LumaError {
  message: string;
  code?: string;
  field?: string;
}

export interface LumaApiResponse<T> {
  data?: T;
  error?: LumaError;
}
