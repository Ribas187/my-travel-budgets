import { XStack, View, Text } from 'tamagui';

interface ColorLegendItem {
  id: string;
  label: string;
  color: string;
}

interface ColorLegendProps {
  items: ColorLegendItem[];
}

export function ColorLegend({ items }: ColorLegendProps) {
  return (
    <XStack flexWrap="wrap" gap="$md" data-testid="color-legend">
      {items.map((item) => (
        <XStack key={item.id} alignItems="center" gap="$xs">
          <View width={10} height={10} borderRadius={5} backgroundColor={item.color} />
          <Text fontFamily="$body" fontSize={13} color="$textTertiary">
            {item.label}
          </Text>
        </XStack>
      ))}
    </XStack>
  );
}
