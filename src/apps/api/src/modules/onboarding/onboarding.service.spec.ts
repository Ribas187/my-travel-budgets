import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';

import { OnboardingService } from './onboarding.service';

import { ONBOARDING_REPOSITORY } from '@/modules/common/database';
import { BusinessValidationError } from '@/modules/common/exceptions';

const mockSetOnboardingCompleted = jest.fn();
const mockClearOnboardingCompleted = jest.fn();
const mockGetDismissedTips = jest.fn();
const mockAddDismissedTip = jest.fn();
const mockClearDismissedTips = jest.fn();

const onboardingRepositoryMock = {
  setOnboardingCompleted: mockSetOnboardingCompleted,
  clearOnboardingCompleted: mockClearOnboardingCompleted,
  getDismissedTips: mockGetDismissedTips,
  addDismissedTip: mockAddDismissedTip,
  clearDismissedTips: mockClearDismissedTips,
};

describe('OnboardingService', () => {
  let service: OnboardingService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OnboardingService,
        { provide: ONBOARDING_REPOSITORY, useValue: onboardingRepositoryMock },
      ],
    }).compile();

    service = module.get<OnboardingService>(OnboardingService);
  });

  describe('completeOnboarding', () => {
    it('sets the onboarding completed timestamp', async () => {
      const user = { id: 'user-1', onboardingCompletedAt: new Date() };
      mockSetOnboardingCompleted.mockResolvedValue(user);

      await service.completeOnboarding('user-1');

      expect(mockSetOnboardingCompleted).toHaveBeenCalledWith('user-1');
    });
  });

  describe('resetOnboarding', () => {
    it('clears the onboarding completed timestamp', async () => {
      const user = { id: 'user-1', onboardingCompletedAt: null };
      mockClearOnboardingCompleted.mockResolvedValue(user);

      await service.resetOnboarding('user-1');

      expect(mockClearOnboardingCompleted).toHaveBeenCalledWith('user-1');
    });
  });

  describe('dismissTip', () => {
    it('validates and appends a valid tip ID', async () => {
      mockGetDismissedTips.mockResolvedValue([]);
      const user = { id: 'user-1', dismissedTips: ['dashboard_first_visit'] };
      mockAddDismissedTip.mockResolvedValue(user);

      await service.dismissTip('user-1', 'dashboard_first_visit');

      expect(mockGetDismissedTips).toHaveBeenCalledWith('user-1');
      expect(mockAddDismissedTip).toHaveBeenCalledWith('user-1', 'dashboard_first_visit');
    });

    it('throws BusinessValidationError for an invalid tip ID', async () => {
      await expect(service.dismissTip('user-1', 'invalid_tip')).rejects.toThrow(
        BusinessValidationError,
      );

      expect(mockGetDismissedTips).not.toHaveBeenCalled();
      expect(mockAddDismissedTip).not.toHaveBeenCalled();
    });

    it('is idempotent — does not add a duplicate tip', async () => {
      mockGetDismissedTips.mockResolvedValue(['dashboard_first_visit']);

      await service.dismissTip('user-1', 'dashboard_first_visit');

      expect(mockGetDismissedTips).toHaveBeenCalledWith('user-1');
      expect(mockAddDismissedTip).not.toHaveBeenCalled();
    });

    it('accepts all valid tip IDs', async () => {
      const validTips = [
        'dashboard_first_visit',
        'expenses_no_categories',
        'summary_first_visit',
        'budget_progress_bar',
        'members_invite_button',
        'category_budget_limit',
      ];

      for (const tipId of validTips) {
        mockGetDismissedTips.mockResolvedValue([]);
        mockAddDismissedTip.mockResolvedValue({ id: 'user-1', dismissedTips: [tipId] });

        await service.dismissTip('user-1', tipId);

        expect(mockAddDismissedTip).toHaveBeenCalledWith('user-1', tipId);
      }
    });
  });

  describe('resetTips', () => {
    it('clears the dismissed tips array', async () => {
      const user = { id: 'user-1', dismissedTips: [] };
      mockClearDismissedTips.mockResolvedValue(user);

      await service.resetTips('user-1');

      expect(mockClearDismissedTips).toHaveBeenCalledWith('user-1');
    });
  });
});
