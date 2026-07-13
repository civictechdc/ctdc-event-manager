import { LumaEventResponse, LumaUploadUrlResponse } from '../../src/platforms/luma/luma-types';

export function createMockLumaEventResponse(overrides: Partial<LumaEventResponse> = {}): LumaEventResponse {
  return {
    api_id: 'test-event-id',
    event: {
      api_id: 'test-event-id',
      name: 'Test Event',
      url: 'https://lu.ma/test-event-id',
      start_at: new Date().toISOString(),
      timezone: 'America/New_York'
    },
    ...overrides
  };
}

export function createMockLumaUploadUrlResponse(): LumaUploadUrlResponse {
  return {
    upload_url: 'https://upload.example.com/signed-url?params=123',
    file_url: 'https://cdn.luma.com/images/test-image.jpg'
  };
}
