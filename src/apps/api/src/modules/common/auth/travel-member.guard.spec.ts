import type { ExecutionContext } from '@nestjs/common';
import { ForbiddenException } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';

import { TravelMemberGuard } from './travel-member.guard';

import { PrismaService } from '@/modules/prisma/prisma.service';

const mockPrisma = {
  travelMember: {
    findFirst: jest.fn(),
  },
};

const createMockContext = (
  params: Record<string, string>,
  user = { userId: 'user-1', email: 'a@test.com' },
) => {
  const request = { params, user, travelMember: undefined as unknown };
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext;
};

describe('TravelMemberGuard', () => {
  let guard: TravelMemberGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TravelMemberGuard, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    guard = module.get(TravelMemberGuard);
    jest.clearAllMocks();
  });

  it('returns true and attaches travelMember when member is found via travelId param', async () => {
    const member = { id: 'member-1', travelId: 'travel-1', userId: 'user-1', role: 'member' };
    mockPrisma.travelMember.findFirst.mockResolvedValue(member);

    const context = createMockContext({ travelId: 'travel-1' });
    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(mockPrisma.travelMember.findFirst).toHaveBeenCalledWith({
      where: { travelId: 'travel-1', userId: 'user-1' },
    });
    const request = context.switchToHttp().getRequest();
    expect(request.travelMember).toEqual(member);
  });

  it('extracts travelId from id param when travelId is not present', async () => {
    const member = { id: 'member-1', travelId: 'travel-2', userId: 'user-1', role: 'owner' };
    mockPrisma.travelMember.findFirst.mockResolvedValue(member);

    const context = createMockContext({ id: 'travel-2' });
    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(mockPrisma.travelMember.findFirst).toHaveBeenCalledWith({
      where: { travelId: 'travel-2', userId: 'user-1' },
    });
  });

  it('prefers travelId over id when both are present', async () => {
    const member = { id: 'member-1', travelId: 'travel-1', userId: 'user-1', role: 'member' };
    mockPrisma.travelMember.findFirst.mockResolvedValue(member);

    const context = createMockContext({ travelId: 'travel-1', id: 'travel-other' });
    await guard.canActivate(context);

    expect(mockPrisma.travelMember.findFirst).toHaveBeenCalledWith({
      where: { travelId: 'travel-1', userId: 'user-1' },
    });
  });

  it('throws ForbiddenException when member is not found', async () => {
    mockPrisma.travelMember.findFirst.mockResolvedValue(null);

    const context = createMockContext({ travelId: 'travel-1' });

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    await expect(guard.canActivate(context)).rejects.toThrow('Not a member of this travel');
  });
});
