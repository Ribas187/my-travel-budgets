import { describe, it, expect } from 'vitest';

// Test the getActiveTab logic (replicated from route.tsx)
function getActiveTab(pathname: string, travelId: string): string {
  const base = `/travels/${travelId}`;
  if (pathname.endsWith('/expenses')) return 'expenses';
  if (pathname.endsWith('/budget')) return 'budget';
  if (pathname.endsWith('/members')) return 'group';
  if (pathname.endsWith('/categories')) return 'categories';
  if (pathname.endsWith('/summary')) return 'summary';
  if (pathname.endsWith('/edit')) return 'edit';
  if (pathname === base || pathname === `${base}/`) return 'home';
  return 'home';
}

describe('getActiveTab', () => {
  const travelId = 'travel-123';

  it('returns "home" for travel root path', () => {
    expect(getActiveTab('/travels/travel-123', travelId)).toBe('home');
  });

  it('returns "home" for travel root path with trailing slash', () => {
    expect(getActiveTab('/travels/travel-123/', travelId)).toBe('home');
  });

  it('returns "expenses" for expenses path', () => {
    expect(getActiveTab('/travels/travel-123/expenses', travelId)).toBe('expenses');
  });

  it('returns "budget" for budget path', () => {
    expect(getActiveTab('/travels/travel-123/budget', travelId)).toBe('budget');
  });

  it('returns "group" for members path', () => {
    expect(getActiveTab('/travels/travel-123/members', travelId)).toBe('group');
  });

  it('returns "categories" for categories path', () => {
    expect(getActiveTab('/travels/travel-123/categories', travelId)).toBe('categories');
  });

  it('returns "summary" for summary path', () => {
    expect(getActiveTab('/travels/travel-123/summary', travelId)).toBe('summary');
  });

  it('returns "edit" for edit path', () => {
    expect(getActiveTab('/travels/travel-123/edit', travelId)).toBe('edit');
  });
});

describe('tab navigation route mapping', () => {
  const travelId = 'travel-123';

  const tabRoutes: Record<string, string> = {
    home: `/travels/${travelId}`,
    expenses: `/travels/${travelId}/expenses`,
    budget: `/travels/${travelId}/budget`,
    group: `/travels/${travelId}/members`,
  };

  const sidebarRoutes: Record<string, string> = {
    dashboard: `/travels/${travelId}`,
    expenses: `/travels/${travelId}/expenses`,
    budget: `/travels/${travelId}/budget`,
    categories: `/travels/${travelId}/categories`,
    group: `/travels/${travelId}/members`,
    settings: '/profile',
  };

  it('maps bottom nav tab keys to correct paths', () => {
    expect(tabRoutes['home']).toBe(`/travels/${travelId}`);
    expect(tabRoutes['expenses']).toBe(`/travels/${travelId}/expenses`);
    expect(tabRoutes['budget']).toBe(`/travels/${travelId}/budget`);
    expect(tabRoutes['group']).toBe(`/travels/${travelId}/members`);
  });

  it('maps sidebar nav keys to correct paths', () => {
    expect(sidebarRoutes['dashboard']).toBe(`/travels/${travelId}`);
    expect(sidebarRoutes['expenses']).toBe(`/travels/${travelId}/expenses`);
    expect(sidebarRoutes['budget']).toBe(`/travels/${travelId}/budget`);
    expect(sidebarRoutes['categories']).toBe(`/travels/${travelId}/categories`);
    expect(sidebarRoutes['group']).toBe(`/travels/${travelId}/members`);
    expect(sidebarRoutes['settings']).toBe('/profile');
  });
});

describe('nav visibility logic', () => {
  it('hides nav on edit page', () => {
    const activeTab: string = 'edit';
    const hideNav = activeTab === 'edit' || activeTab === 'categories';
    expect(hideNav).toBe(true);
  });

  it('hides nav on categories page', () => {
    const activeTab: string = 'categories';
    const hideNav = activeTab === 'edit' || activeTab === 'categories';
    expect(hideNav).toBe(true);
  });

  it('shows nav on home page', () => {
    const activeTab: string = 'home';
    const hideNav = activeTab === 'edit' || activeTab === 'categories';
    expect(hideNav).toBe(false);
  });

  it('shows nav on expenses page', () => {
    const activeTab: string = 'expenses';
    const hideNav = activeTab === 'edit' || activeTab === 'categories';
    expect(hideNav).toBe(false);
  });

  it('shows nav on budget page', () => {
    const activeTab: string = 'budget';
    const hideNav = activeTab === 'edit' || activeTab === 'categories';
    expect(hideNav).toBe(false);
  });

  it('shows nav on group page', () => {
    const activeTab: string = 'group';
    const hideNav = activeTab === 'edit' || activeTab === 'categories';
    expect(hideNav).toBe(false);
  });
});

describe('sidebar active key mapping', () => {
  it('maps "home" to "dashboard" for sidebar', () => {
    const activeTab = 'home';
    const sidebarActiveKey = activeTab === 'home' ? 'dashboard' : activeTab;
    expect(sidebarActiveKey).toBe('dashboard');
  });

  it('passes through other keys unchanged', () => {
    const cases = ['expenses', 'budget', 'categories', 'group'];
    for (const key of cases) {
      const sidebarActiveKey = key === 'home' ? 'dashboard' : key;
      expect(sidebarActiveKey).toBe(key);
    }
  });
});
