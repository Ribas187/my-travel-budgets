import { useCallback, useMemo, useState } from 'react';
import { createFileRoute, Outlet, useNavigate, useLocation } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { YStack, Spinner, Text, View, useMedia } from 'tamagui';
import { AppShell, BottomNav, DesktopSidebar, FAB, Body, PrimaryButton, NavigationSheet } from '@repo/ui';
import type { NavigationSheetItem } from '@repo/ui';
import { useTravelDetail, useUserMe } from '@repo/api-client';

import { useAuth } from '@/providers/AuthProvider';
import { AddExpenseModal, TravelProvider } from '@repo/features';
import { showToast } from '@/lib/toast';

export const Route = createFileRoute('/_authenticated/travels/$travelId')({
  component: TravelLayout,
});

function parseTokenUserId(token: string | null): string | null {
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const decoded = JSON.parse(atob(payload));
    return decoded.sub ?? decoded.userId ?? null;
  } catch {
    return null;
  }
}

function getActiveTab(pathname: string, travelId: string): string {
  const base = `/travels/${travelId}`;
  if (pathname.endsWith('/expenses')) return 'expenses';
  if (pathname.endsWith('/budget')) return 'budget';
  if (pathname.endsWith('/members')) return 'group';
  if (pathname.endsWith('/categories')) return 'categories';
  if (pathname.endsWith('/summary')) return 'summary';
  if (pathname.endsWith('/edit')) return 'edit';
  // Default: index = dashboard / home
  if (pathname === base || pathname === `${base}/`) return 'home';
  return 'home';
}

function TravelLayout() {
  const { t } = useTranslation();
  const { travelId } = Route.useParams();
  const { data: travel, isLoading } = useTravelDetail(travelId);
  const { token, logout } = useAuth();
  const { data: userMe } = useUserMe();
  const navigate = useNavigate();
  const location = useLocation();
  const media = useMedia();
  const isDesktop = media.gtTablet;
  const [addExpenseOpen, setAddExpenseOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleOpenSheet = useCallback(() => {
    setSheetOpen(true);
  }, []);

  const sheetItems = useMemo<NavigationSheetItem[]>(() => [
    {
      key: 'profile',
      label: t('nav.profile'),
      icon: <Text fontSize={18}>👤</Text>,
      onPress: () => {
        setSheetOpen(false);
        navigate({ to: '/profile' as any });
      },
    },
    {
      key: 'myTravels',
      label: t('nav.myTravels'),
      icon: <Text fontSize={18}>✈️</Text>,
      onPress: () => {
        setSheetOpen(false);
        navigate({ to: '/travels' as any });
      },
    },
    {
      key: 'logout',
      label: t('nav.logout'),
      icon: <Text fontSize={18}>🚪</Text>,
      onPress: () => {
        setSheetOpen(false);
        logout();
      },
      destructive: true,
    },
  ], [t, navigate, logout]);

  const activeTab = getActiveTab(location.pathname, travelId);

  // Hide nav on edit and categories pages (they're full-screen modal-like pages)
  const hideNav = activeTab === 'edit' || activeTab === 'categories';

  if (isLoading) {
    return (
      <YStack
        flex={1}
        alignItems="center"
        justifyContent="center"
        role="status"
        aria-label="Loading"
      >
        <Spinner size="large" color="$brandPrimary" />
      </YStack>
    );
  }

  if (!travel) {
    return (
      <YStack flex={1} padding="$screenPaddingHorizontal" paddingTop="$2xl">
        <Body size="secondary">{t('common.error')}</Body>
      </YStack>
    );
  }

  const currentUserId = parseTokenUserId(token);
  const isOwner = (travel.members ?? []).some(
    (m) => m.role === 'owner' && m.userId === currentUserId,
  );

  const handleTabPress = (key: string) => {
    const routes: Record<string, string> = {
      home: `/travels/${travelId}`,
      expenses: `/travels/${travelId}/expenses`,
      budget: `/travels/${travelId}/budget`,
      group: `/travels/${travelId}/members`,
    };
    const to = routes[key];
    if (to) {
      navigate({ to: to as any });
    }
  };

  const handleSidebarPress = (key: string) => {
    const routes: Record<string, string> = {
      dashboard: `/travels/${travelId}`,
      expenses: `/travels/${travelId}/expenses`,
      budget: `/travels/${travelId}/budget`,
      categories: `/travels/${travelId}/categories`,
      group: `/travels/${travelId}/members`,
      settings: '/profile',
    };
    const to = routes[key];
    if (to) {
      navigate({ to: to as any });
    }
  };

  // Map activeTab to sidebar key
  const sidebarActiveKey = activeTab === 'home' ? 'dashboard' : activeTab;

  const tabs = [
    { key: 'home', label: t('nav.home'), icon: <Text fontSize={18}>🏠</Text> },
    { key: 'expenses', label: t('nav.expenses'), icon: <Text fontSize={18}>📋</Text> },
    { key: 'budget', label: t('nav.budget'), icon: <Text fontSize={18}>💰</Text> },
    { key: 'group', label: t('nav.group'), icon: <Text fontSize={18}>👥</Text> },
  ];

  const sidebarItems = [
    { key: 'dashboard', label: t('nav.home'), icon: <Text fontSize={16}>🏠</Text> },
    { key: 'expenses', label: t('nav.expenses'), icon: <Text fontSize={16}>📋</Text> },
    { key: 'budget', label: t('nav.budget'), icon: <Text fontSize={16}>💰</Text> },
    { key: 'categories', label: t('nav.categories'), icon: <Text fontSize={16}>📁</Text> },
    { key: 'group', label: t('nav.group'), icon: <Text fontSize={16}>👥</Text> },
  ];

  const sidebarFooterItems = [
    { key: 'settings', label: t('nav.settings'), icon: <Text fontSize={16}>⚙️</Text> },
  ];

  const bottomNav = !hideNav ? (
    <BottomNav
      tabs={tabs}
      activeTab={activeTab}
      onTabPress={handleTabPress}
      fabSlot={
        <FAB onPress={() => setAddExpenseOpen(true)} accessibilityLabel={t('nav.addExpense')} />
      }
    />
  ) : undefined;

  const sidebar = !hideNav ? (
    <DesktopSidebar
      logo={
        <Text fontFamily="$heading" fontSize={20} fontWeight="700" color="$brandPrimary">
          {travel.name}
        </Text>
      }
      navItems={sidebarItems}
      activeItem={sidebarActiveKey}
      onItemPress={handleSidebarPress}
      footerItems={sidebarFooterItems}
      userSection={
        <View paddingTop="$sm">
          <PrimaryButton label={t('nav.addExpense')} onPress={() => setAddExpenseOpen(true)} />
        </View>
      }
    />
  ) : undefined;

  const userName = userMe?.name || userMe?.email || '';
  const userInitial = userName ? userName.charAt(0).toUpperCase() : undefined;
  const showIconFallback = !userName;

  return (
    <TravelProvider travel={travel} isOwner={isOwner} currentUserId={currentUserId} onOpenNavigationSheet={handleOpenSheet} onAddExpense={() => setAddExpenseOpen(true)}>
      <AppShell sidebar={sidebar} bottomNav={bottomNav}>
        <Outlet />
      </AppShell>

      {!isDesktop && sheetOpen && (
        <NavigationSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          userName={userName}
          userInitial={userInitial}
          showIconFallback={showIconFallback}
          avatarUrl={userMe?.avatarUrl ?? null}
          items={sheetItems}
        />
      )}

      <AddExpenseModal
        open={addExpenseOpen}
        onClose={() => setAddExpenseOpen(false)}
        onSuccess={(msg) => showToast(msg)}
        onNavigateToCategories={() =>
          navigate({ to: '/travels/$travelId/categories', params: { travelId } })
        }
      />
    </TravelProvider>
  );
}
