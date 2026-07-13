export type ImageSource = 
  | { type: 'upload'; path: string }
  | { type: 'url'; url: string };

export interface ImageConfig {
  source: ImageSource;
  alt?: string;
}

export function isUploadImage(image: ImageConfig): image is ImageConfig & { source: { type: 'upload'; path: string } } {
  return image.source.type === 'upload';
}

export function isUrlImage(image: ImageConfig): image is ImageConfig & { source: { type: 'url'; url: string } } {
  return image.source.type === 'url';
}
