import { Inject, Injectable } from '@nestjs/common';

import type { AddMemberDto } from './dto/add-member.dto';
import type { IMemberRepository } from './repository/member.repository.interface';

import { MEMBER_REPOSITORY } from '@/modules/common/database';
import {
  BusinessValidationError,
  ConflictError,
  EntityNotFoundError,
} from '@/modules/common/exceptions';

@Injectable()
export class MembersService {
  constructor(
    @Inject(MEMBER_REPOSITORY)
    private readonly memberRepository: IMemberRepository,
  ) {}

  async addMember(travelId: string, dto: AddMemberDto) {
    if (dto.email) {
      return this.addByEmail(travelId, dto.email);
    }

    return this.addGuest(travelId, dto.guestName!);
  }

  async removeMember(travelId: string, memberId: string) {
    const member = await this.memberRepository.findByIdAndTravel(memberId, travelId);

    if (!member) {
      throw new EntityNotFoundError('Member');
    }

    if (member.role === 'owner') {
      throw new BusinessValidationError('Cannot remove the travel owner');
    }

    await this.memberRepository.delete(memberId);
  }

  private async addByEmail(travelId: string, email: string) {
    const user = await this.memberRepository.findUserByEmail(email);

    if (!user) {
      throw new EntityNotFoundError('User not found. You can add them as a named guest instead.');
    }

    return this.memberRepository.createMember({
      travelId,
      userId: user.id,
      role: 'member',
    });
  }

  private async addGuest(travelId: string, guestName: string) {
    return this.memberRepository.createMember({
      travelId,
      guestName,
      role: 'member',
    });
  }
}
