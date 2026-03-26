import { createFileRoute } from '@tanstack/react-router';
import { MembersPage } from '@repo/features';

import { showToast } from '@/lib/toast';

export const Route = createFileRoute('/_authenticated/travels/$travelId/members')({
  component: MembersRoute,
});

function MembersRoute() {
  return (
    <MembersPage
      onSuccess={(msg) => showToast(msg)}
      onError={(msg) => showToast(msg, 'error')}
    />
  );
}
