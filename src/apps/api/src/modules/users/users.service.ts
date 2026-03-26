import { Inject, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';

import type { UserMeDto } from './dto/user-me.dto';
import type { UpdateMeDto } from './dto/update-me.dto';
import type { SetMainTravelDto } from './dto/set-main-travel.dto';
import type { IUserRepository } from './repository/user.repository.interface';

import { USER_REPOSITORY } from '@/modules/common/database';
import { EntityNotFoundError } from '@/modules/common/exceptions';
import { CloudinaryService } from '@/modules/cloudinary/cloudinary.service';

const AVATAR_FOLDER = 'avatars';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly cloudinary: CloudinaryService,
  ) {}

  private toUserMeDto(user: {
    id: string;
    email: string;
    name: string;
    avatarUrl: string | null;
    mainTravelId: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): UserMeDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      mainTravelId: user.mainTravelId,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async getMe(userId: string): Promise<UserMeDto> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new EntityNotFoundError('User');
    }

    return this.toUserMeDto(user);
  }

  async updateMe(userId: string, input: UpdateMeDto): Promise<UserMeDto> {
    const data: { name?: string; avatarUrl?: string } = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.avatarUrl !== undefined) data.avatarUrl = input.avatarUrl;

    const user = await this.userRepository.update(userId, data);

    return this.toUserMeDto(user);
  }

  async setMainTravel(userId: string, dto: SetMainTravelDto): Promise<UserMeDto> {
    if (dto.travelId !== null) {
      const isMember = await this.userRepository.isMemberOfTravel(userId, dto.travelId);

      if (!isMember) {
        throw new EntityNotFoundError('Travel');
      }
    }

    const user = await this.userRepository.update(userId, { mainTravelId: dto.travelId });

    return this.toUserMeDto(user);
  }

  async uploadAvatar(userId: string, file: Express.Multer.File): Promise<UserMeDto> {
    const currentUser = await this.userRepository.findById(userId);
    if (!currentUser) {
      throw new EntityNotFoundError('User');
    }

    // Delete previous avatar from Cloudinary if exists
    if (currentUser.avatarUrl) {
      try {
        await this.cloudinary.destroy(`${AVATAR_FOLDER}/${userId}`);
      } catch {
        this.logger.warn(`Failed to delete old avatar for user ${userId}, proceeding with upload`);
      }
    }

    let uploadResult: { secure_url: string; public_id: string };
    try {
      uploadResult = await this.cloudinary.upload(file.buffer, userId, AVATAR_FOLDER);
    } catch {
      throw new InternalServerErrorException('Failed to upload avatar');
    }

    const user = await this.userRepository.update(userId, {
      avatarUrl: uploadResult.secure_url,
    });

    this.logger.log(`Avatar uploaded for user ${userId}: ${uploadResult.public_id}`);
    return this.toUserMeDto(user);
  }

  async removeAvatar(userId: string): Promise<UserMeDto> {
    const currentUser = await this.userRepository.findById(userId);
    if (!currentUser) {
      throw new EntityNotFoundError('User');
    }

    if (currentUser.avatarUrl) {
      try {
        await this.cloudinary.destroy(`${AVATAR_FOLDER}/${userId}`);
      } catch {
        this.logger.warn(`Failed to delete avatar from Cloudinary for user ${userId}`);
      }
    }

    const user = await this.userRepository.update(userId, { avatarUrl: null });

    this.logger.log(`Avatar removed for user ${userId}`);
    return this.toUserMeDto(user);
  }
}
