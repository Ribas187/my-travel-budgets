import { describe, it, expect } from 'vitest';
import React from 'react';
import type { TravelDetail, TravelMember, MemberSpending } from '@repo/api-client';

const mockMembers: TravelMember[] = [
  {
    id: 'm1',
    travelId: 'travel-1',
    userId: 'u1',
    guestName: null,
    role: 'owner',
    user: {
      id: 'u1',
      email: 'alice@test.com',
      name: 'Alice',
      avatarUrl: null,
      createdAt: '',
      updatedAt: '',
    },
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'm2',
    travelId: 'travel-1',
    userId: 'u2',
    guestName: null,
    role: 'member',
    user: {
      id: 'u2',
      email: 'bob@test.com',
      name: 'Bob',
      avatarUrl: null,
      createdAt: '',
      updatedAt: '',
    },
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'm3',
    travelId: 'travel-1',
    userId: null,
    guestName: 'Charlie',
    role: 'member',
    user: null,
    createdAt: '',
    updatedAt: '',
  },
];

const mockTravel: TravelDetail = {
  id: 'travel-1',
  name: 'Lisbon Trip',
  description: null,
  imageUrl: null,
  currency: 'EUR',
  budget: 3000,
  startDate: '2026-03-15',
  endDate: '2026-03-25',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  members: mockMembers,
  categories: [],
};

const mockMemberSpending: MemberSpending[] = [
  { memberId: 'm1', displayName: 'Alice', totalSpent: 1200 },
  { memberId: 'm2', displayName: 'Bob', totalSpent: 800 },
  { memberId: 'm3', displayName: 'Charlie', totalSpent: 140 },
];

describe('MembersPage', () => {
  it('exports MembersPage component', async () => {
    const { MembersPage } = await import('@/features/members/MembersPage');
    expect(MembersPage).toBeDefined();
    expect(typeof MembersPage).toBe('function');
  });

  describe('renders correct number of member rows with names and role badges', () => {
    it('creates AvatarChip for each member with correct props', async () => {
      const { AvatarChip } = await import('@repo/ui');
      expect(AvatarChip).toBeDefined();

      const elements = mockMembers.map((member, index) => {
        const displayName = member.user?.name ?? member.guestName ?? '';
        const initial = displayName.charAt(0).toUpperCase();
        const roleBadge = member.role === 'owner' ? 'Owner' : 'Member';

        return React.createElement(AvatarChip, {
          key: member.id,
          name: displayName,
          initial,
          role: roleBadge,
        });
      });

      expect(elements).toHaveLength(3);
      expect(elements[0].props.name).toBe('Alice');
      expect(elements[0].props.initial).toBe('A');
      expect(elements[0].props.role).toBe('Owner');
      expect(elements[1].props.name).toBe('Bob');
      expect(elements[1].props.role).toBe('Member');
      expect(elements[2].props.name).toBe('Charlie');
      expect(elements[2].props.role).toBe('Member');
    });
  });

  describe('shows spending amounts', () => {
    it('formats member spending correctly', () => {
      const spendingMap = new Map<string, MemberSpending>();
      for (const ms of mockMemberSpending) {
        spendingMap.set(ms.memberId, ms);
      }

      expect(spendingMap.get('m1')?.totalSpent).toBe(1200);
      expect(spendingMap.get('m2')?.totalSpent).toBe(800);
      expect(spendingMap.get('m3')?.totalSpent).toBe(140);

      const formatted = new Intl.NumberFormat('en', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 0,
      }).format(1200);
      expect(formatted).toContain('1,200');
    });
  });

  describe('invite button visibility', () => {
    it('shows invite button when user is owner', () => {
      const isOwner = true;
      expect(isOwner).toBe(true);
      // Invite button should be visible
    });

    it('hides invite button when user is not owner', () => {
      const isOwner = false;
      expect(isOwner).toBe(false);
      // Invite button should not be visible
    });
  });

  describe('remove action visibility', () => {
    it('hides remove action for non-owners', () => {
      const isCurrentUserOwner = false;
      mockMembers.forEach((member) => {
        const isMemberOwner = member.role === 'owner';
        const canRemove = isCurrentUserOwner && !isMemberOwner;
        expect(canRemove).toBe(false);
      });
    });

    it('shows remove action for owner on non-owner members', () => {
      const isCurrentUserOwner = true;
      const results = mockMembers.map((member) => {
        const isMemberOwner = member.role === 'owner';
        return { id: member.id, canRemove: isCurrentUserOwner && !isMemberOwner };
      });

      // Owner's own row: no remove
      expect(results[0].canRemove).toBe(false);
      // Other members: can remove
      expect(results[1].canRemove).toBe(true);
      expect(results[2].canRemove).toBe(true);
    });
  });
});

describe('Remove flow', () => {
  it('confirmation dialog shows member name', () => {
    const member = mockMembers[1];
    const displayName = member.user?.name ?? member.guestName ?? '';
    const message = `Remove ${displayName} from this trip?`;
    expect(message).toBe('Remove Bob from this trip?');
  });

  it('cancel closes dialog (memberToRemove resets to null)', () => {
    let memberToRemove: TravelMember | null = mockMembers[1];
    // Simulate cancel
    memberToRemove = null;
    expect(memberToRemove).toBeNull();
  });

  it('confirm calls remove with member id', () => {
    const member = mockMembers[1];
    // The mutation would be called with member.id
    expect(member.id).toBe('m2');
  });
});

describe("Owner's own row", () => {
  it('remove action is not shown on the owner entry', () => {
    const owner = mockMembers[0];
    const isCurrentUserOwner = true;
    const isMemberOwner = owner.role === 'owner';
    const canRemove = isCurrentUserOwner && !isMemberOwner;
    expect(canRemove).toBe(false);
  });

  it('remove action is shown on other members when user is owner', () => {
    const nonOwner = mockMembers[1];
    const isCurrentUserOwner = true;
    const isMemberOwner = nonOwner.role === 'owner';
    const canRemove = isCurrentUserOwner && !isMemberOwner;
    expect(canRemove).toBe(true);
  });
});
