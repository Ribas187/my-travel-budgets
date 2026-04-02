import { useTranslation } from 'react-i18next';
import { YStack, Text } from 'tamagui';
import { Heading } from '../../atoms';

export interface CheckEmailViewProps {
  email: string;
  onGoBack: () => void;
}

export function CheckEmailView({ email, onGoBack }: CheckEmailViewProps) {
  const { t } = useTranslation();

  return (
    <YStack flex={1} alignItems="center" justifyContent="center" padding="$2xl" gap="$lg">
      <Heading level={2}>{t('auth.checkEmail')}</Heading>
      <Text
        fontFamily="$body"
        fontSize={14}
        color="$textSecondary"
        textAlign="center"
        lineHeight={20}
      >
        {t('auth.checkEmailDescription')}
      </Text>
      <Text fontFamily="$body" fontSize={15} fontWeight="600" color="$textPrimary">
        {email}
      </Text>
      <Text
        fontFamily="$body"
        fontSize={14}
        color="$brandPrimary"
        cursor="pointer"
        onPress={onGoBack}
      >
        {t('auth.magicLink')}
      </Text>
    </YStack>
  );
}
