import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  constructor(private readonly config: ConfigService) {
    const cloudinaryUrl = this.config.getOrThrow<string>('CLOUDINARY_URL');
    // Parse cloudinary:// URL into config object
    // Format: cloudinary://api_key:api_secret@cloud_name
    const parsed = new URL(cloudinaryUrl);
    cloudinary.config({
      cloud_name: parsed.hostname,
      api_key: parsed.username,
      api_secret: parsed.password,
    });
  }

  async upload(
    buffer: Buffer,
    publicId: string,
    folder: string,
  ): Promise<{ secure_url: string; public_id: string }> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          public_id: publicId,
          folder,
          overwrite: true,
          resource_type: 'image',
          transformation: [{ width: 256, height: 256, crop: 'fill', gravity: 'face' }],
        },
        (error, result) => {
          if (error) {
            this.logger.error(`Upload failed for ${folder}/${publicId}: ${error.message}`);
            reject(error);
            return;
          }
          const uploadResult = result as UploadApiResponse;
          resolve({
            secure_url: uploadResult.secure_url,
            public_id: uploadResult.public_id,
          });
        },
      );
      stream.end(buffer);
    });
  }

  async destroy(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
      this.logger.log(`Destroyed image: ${publicId}`);
    } catch (error) {
      this.logger.error(
        `Failed to destroy image ${publicId}: ${error instanceof Error ? error.message : error}`,
      );
      throw error;
    }
  }
}
