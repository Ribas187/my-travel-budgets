import { styled, XStack, YStack, Text } from 'tamagui';

interface LanguageOption {
  code: string;
  label: string;
}

interface LanguageSelectorProps {
  languages: LanguageOption[];
  currentLanguage: string;
  onSelect: (code: string) => void;
  testID?: string;
}

const LanguageOptionRow = styled(XStack, {
  paddingVertical: '$md',
  paddingHorizontal: '$lg',
  borderRadius: '$lg',
  borderWidth: 1,
  cursor: 'pointer',
  alignItems: 'center',
  gap: '$sm',
});

export function LanguageSelector({ languages, currentLanguage, onSelect, testID }: LanguageSelectorProps) {
  return (
    <YStack gap="$sm" data-testid={testID}>
      {languages.map((lang) => (
        <LanguageOptionRow key={lang.code}
          borderColor={currentLanguage === lang.code ? '$brandPrimary' : '$borderDefault'}
          backgroundColor={currentLanguage === lang.code ? '$parchment' : '$white'}
          onPress={() => onSelect(lang.code)}
          data-testid={`language-${lang.code}`}>
          <Text fontFamily="$body" fontSize={15} fontWeight="600" color="$textPrimary">{lang.label}</Text>
        </LanguageOptionRow>
      ))}
    </YStack>
  );
}
