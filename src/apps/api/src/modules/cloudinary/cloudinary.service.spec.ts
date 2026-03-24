import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';

import { CloudinaryService } from './cloudinary.service';

// Must use jest.fn() inside the factory to avoid hoisting issues
jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload_stream: jest.fn(),
      destroy: jest.fn(),
    },
  },
}));

// Import the mocked module to access the mock functions
import { v2 as cloudinary } from 'cloudinary';
const mockUploadStream = cloudinary.uploader.upload_stream as jest.Mock;
const mockDestroy = cloudinary.uploader.destroy as jest.Mock;

describe('CloudinaryService', () => {
  let service: CloudinaryService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CloudinaryService,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn().mockReturnValue('cloudinary://key:secret@cloud'),
          },
        },
      ],
    }).compile();

    service = module.get<CloudinaryService>(CloudinaryService);
  });

  describe('upload', () => {
    it('uploads a buffer and returns secure_url and public_id', async () => {
      const fakeResult = {
        secure_url: 'https://res.cloudinary.com/test/image/upload/avatars/user-1.jpg',
        public_id: 'avatars/user-1',
      };

      mockUploadStream.mockImplementation((_options: unknown, callback: Function) => {
        callback(null, fakeResult);
        return { end: jest.fn() };
      });

      const buffer = Buffer.from('fake-image-data');
      const result = await service.upload(buffer, 'user-1', 'avatars');

      expect(result).toEqual({
        secure_url: fakeResult.secure_url,
        public_id: fakeResult.public_id,
      });

      expect(mockUploadStream).toHaveBeenCalledWith(
        expect.objectContaining({
          public_id: 'user-1',
          folder: 'avatars',
          overwrite: true,
          resource_type: 'image',
        }),
        expect.any(Function),
      );
    });

    it('rejects when Cloudinary returns an error', async () => {
      const cloudinaryError = new Error('Upload quota exceeded');

      mockUploadStream.mockImplementation((_options: unknown, callback: Function) => {
        callback(cloudinaryError, null);
        return { end: jest.fn() };
      });

      const buffer = Buffer.from('fake-image-data');
      await expect(service.upload(buffer, 'user-1', 'avatars')).rejects.toThrow(
        'Upload quota exceeded',
      );
    });

    it('calls stream.end with the buffer', async () => {
      const mockEnd = jest.fn();
      mockUploadStream.mockImplementation((_options: unknown, callback: Function) => {
        callback(null, { secure_url: 'https://example.com/img.jpg', public_id: 'test' });
        return { end: mockEnd };
      });

      const buffer = Buffer.from('test-data');
      await service.upload(buffer, 'user-1', 'avatars');

      expect(mockEnd).toHaveBeenCalledWith(buffer);
    });
  });

  describe('destroy', () => {
    it('destroys an image by public_id', async () => {
      mockDestroy.mockResolvedValue({ result: 'ok' });

      await service.destroy('avatars/user-1');

      expect(mockDestroy).toHaveBeenCalledWith('avatars/user-1');
    });

    it('throws when Cloudinary destroy fails', async () => {
      mockDestroy.mockRejectedValue(new Error('Not found'));

      await expect(service.destroy('avatars/non-existent')).rejects.toThrow('Not found');
    });
  });
});
