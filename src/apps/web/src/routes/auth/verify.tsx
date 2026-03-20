import { useEffect, useState } from 'react'
import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router'
import { YStack, Text, Spinner } from 'tamagui'
import { useTranslation } from 'react-i18next'
import { Heading } from '@repo/ui'
import { useAuth } from '@/providers/AuthProvider'
import { apiClient } from '@/apiClient'
import { z } from 'zod'

const verifySearchSchema = z.object({
  token: z.string(),
})

export const Route = createFileRoute('/auth/verify')({
  validateSearch: verifySearchSchema,
  component: VerifyPage,
})

function VerifyPage() {
  const { token } = useSearch({ from: '/auth/verify' })
  const { login } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      setError(t('auth.verifyError'))
      return
    }

    let cancelled = false

    async function verify() {
      try {
        const session = await apiClient.auth.verify(token)
        if (!cancelled) {
          login(session.accessToken)
          navigate({ to: '/travels' })
        }
      } catch {
        if (!cancelled) {
          setError(t('auth.verifyError'))
        }
      }
    }

    verify()

    return () => {
      cancelled = true
    }
  }, [token, login, navigate, t])

  if (error) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center" padding="$2xl" gap="$lg">
        <Heading level={2}>{t('auth.verifyError')}</Heading>
        <Text
          fontFamily="$body"
          fontSize={14}
          color="$brandPrimary"
          cursor="pointer"
          onPress={() => navigate({ to: '/login' })}
        >
          {t('auth.login')}
        </Text>
      </YStack>
    )
  }

  return (
    <YStack flex={1} alignItems="center" justifyContent="center" padding="$2xl" gap="$lg">
      <Spinner size="large" color="$brandPrimary" />
      <Text fontFamily="$body" color="$textSecondary">
        {t('auth.verifying')}
      </Text>
    </YStack>
  )
}
