import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { LoginPage } from '@repo/features';

import { useAuth } from '@/providers/AuthProvider';
import { apiClient } from '@/apiClient';

export const Route = createFileRoute('/login')({
  component: LoginRoute,
});

function LoginRoute() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();

  return (
    <LoginPage
      isAuthenticated={isAuthenticated}
      login={login}
      onLoginSuccess={() => navigate({ to: '/' })}
      requestMagicLink={(email) => apiClient.auth.requestMagicLink(email)}
      requestPin={(email) => apiClient.auth.requestPin(email)}
      verifyPin={(email, pin) => apiClient.auth.verifyPin(email, pin)}
    />
  );
}
