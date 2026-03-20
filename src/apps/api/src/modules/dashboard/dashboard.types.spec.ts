import { computeAlertStatus } from './dashboard.types';

describe('computeAlertStatus', () => {
  it('returns ok when limit is null and spent is 0', () => {
    expect(computeAlertStatus(0, null)).toBe('ok');
  });

  it('returns ok when limit is null and spent is positive', () => {
    expect(computeAlertStatus(100, null)).toBe('ok');
  });

  it('returns ok when spent is below 80% of limit', () => {
    expect(computeAlertStatus(79, 100)).toBe('ok');
  });

  it('returns warning when spent is exactly 80% of limit', () => {
    expect(computeAlertStatus(80, 100)).toBe('warning');
  });

  it('returns warning when spent is between 80% and 100% of limit', () => {
    expect(computeAlertStatus(90, 100)).toBe('warning');
  });

  it('returns exceeded when spent equals limit', () => {
    expect(computeAlertStatus(100, 100)).toBe('exceeded');
  });

  it('returns exceeded when spent exceeds limit', () => {
    expect(computeAlertStatus(150, 100)).toBe('exceeded');
  });

  it('returns ok when spent is 0 with a positive limit', () => {
    expect(computeAlertStatus(0, 100)).toBe('ok');
  });

  it('returns exceeded when limit is 0 (edge case)', () => {
    expect(computeAlertStatus(0, 0)).toBe('exceeded');
  });
});
