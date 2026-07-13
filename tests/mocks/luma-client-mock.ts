import { vi } from 'vitest';
import { 
  LumaEventResponse, 
  LumaUploadUrlResponse 
} from '../../src/platforms/luma/luma-types';

export function createMockLumaClient() {
  return {
    createEvent: vi.fn(),
    getUploadUrl: vi.fn(),
    uploadImage: vi.fn(),
    uploadImageFromPath: vi.fn()
  };
}

export function mockLumaClientSuccess(
  client: ReturnType<typeof createMockLumaClient>,
  eventId: string = 'test-event-id'
) {
  const response: LumaEventResponse = {
    api_id: eventId,
    event: {
      api_id: eventId,
      name: 'Test Event',
      url: `https://lu.ma/${eventId}`,
      start_at: new Date().toISOString(),
      timezone: 'America/New_York'
    }
  };
  
  client.createEvent.mockResolvedValue(response);

  const uploadResponse: LumaUploadUrlResponse = {
    upload_url: 'https://upload.example.com/signed-url',
    file_url: 'https://cdn.luma.com/images/test.jpg'
  };
  
  client.getUploadUrl.mockResolvedValue(uploadResponse);
  client.uploadImage.mockResolvedValue('https://cdn.luma.com/images/test.jpg');
  client.uploadImageFromPath.mockResolvedValue('https://cdn.luma.com/images/test.jpg');
}
