import { XStack, View } from 'tamagui';

interface StackedBarSegment {
  id: string;
  value: number;
  color: string;
}

interface StackedBarProps {
  segments: StackedBarSegment[];
  total: number;
}

export function StackedBar({ segments, total }: StackedBarProps) {
  if (total === 0) return null;

  return (
    <XStack height={8} borderRadius={4} overflow="hidden" data-testid="stacked-bar">
      {segments
        .filter((s) => s.value > 0)
        .map((s) => (
          <View
            key={s.id}
            flex={s.value / total}
            backgroundColor={s.color}
            height={8}
            data-testid={`stacked-bar-segment-${s.id}`}
          />
        ))}
    </XStack>
  );
}
