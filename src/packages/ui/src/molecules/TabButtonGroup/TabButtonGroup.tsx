import { styled, XStack, View, Text } from 'tamagui';

interface TabOption {
  key: string;
  label: string;
}

interface TabButtonGroupProps {
  options: TabOption[];
  activeKey: string;
  onSelect: (key: string) => void;
  testID?: string;
}

const TabButton = styled(View, {
  paddingVertical: '$sm',
  paddingHorizontal: '$lg',
  borderRadius: '$lg',
  cursor: 'pointer',
  variants: {
    active: {
      true: { backgroundColor: '$brandPrimary' },
      false: { backgroundColor: '$parchment' },
    },
  } as const,
});

export function TabButtonGroup({ options, activeKey, onSelect, testID }: TabButtonGroupProps) {
  return (
    <XStack gap="$sm" data-testid={testID}>
      {options.map((opt) => (
        <TabButton key={opt.key} active={opt.key === activeKey} onPress={() => onSelect(opt.key)} role="tab" aria-selected={opt.key === activeKey} testID={`tab-${opt.key}`}>
          <Text fontFamily="$body" fontSize={14} fontWeight="600" color={opt.key === activeKey ? '$white' : '$textPrimary'}>{opt.label}</Text>
        </TabButton>
      ))}
    </XStack>
  );
}
