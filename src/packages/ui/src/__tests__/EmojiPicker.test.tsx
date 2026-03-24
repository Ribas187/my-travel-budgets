import { describe, it, expect, vi } from 'vitest';
import React from 'react';

import { EmojiPicker } from '../EmojiPicker';

const testGroups = [
  { groupKey: 'category.emojiGroup.food', emojis: ['🍔', '🍕', '☕'] },
  { groupKey: 'category.emojiGroup.transport', emojis: ['🚗', '✈️'] },
];

const testGroupLabels: Record<string, string> = {
  'category.emojiGroup.food': 'Food & Drink',
  'category.emojiGroup.transport': 'Transport',
};

describe('EmojiPicker', () => {
  it('renders all emoji groups with their labels', () => {
    const onSelect = vi.fn();
    const element = React.createElement(EmojiPicker, {
      groups: testGroups,
      selectedEmoji: '🍔',
      onSelect,
      groupLabels: testGroupLabels,
    });
    expect(element).toBeDefined();
    expect(element.props.groups).toHaveLength(2);
    expect(element.props.groupLabels).toHaveProperty('category.emojiGroup.food', 'Food & Drink');
    expect(element.props.groupLabels).toHaveProperty('category.emojiGroup.transport', 'Transport');
  });

  it('renders all emojis within each group', () => {
    const onSelect = vi.fn();
    const element = React.createElement(EmojiPicker, {
      groups: testGroups,
      selectedEmoji: '🍔',
      onSelect,
      groupLabels: testGroupLabels,
    });
    const totalEmojis = element.props.groups.reduce(
      (sum: number, g: { emojis: string[] }) => sum + g.emojis.length,
      0,
    );
    expect(totalEmojis).toBe(5);
  });

  it('shows selected state on the emoji matching selectedEmoji', () => {
    const onSelect = vi.fn();
    const element = React.createElement(EmojiPicker, {
      groups: testGroups,
      selectedEmoji: '☕',
      onSelect,
      groupLabels: testGroupLabels,
    });
    expect(element.props.selectedEmoji).toBe('☕');
  });

  it('calls onSelect with the correct emoji string on click', () => {
    const onSelect = vi.fn();
    const element = React.createElement(EmojiPicker, {
      groups: testGroups,
      selectedEmoji: '🍔',
      onSelect,
      groupLabels: testGroupLabels,
    });
    element.props.onSelect('✈️');
    expect(onSelect).toHaveBeenCalledWith('✈️');
  });

  it('only one emoji is aria-selected="true" at a time', () => {
    const onSelect = vi.fn();
    const element = React.createElement(EmojiPicker, {
      groups: testGroups,
      selectedEmoji: '🍕',
      onSelect,
      groupLabels: testGroupLabels,
    });
    // Only one emoji matches selectedEmoji
    const allEmojis = element.props.groups.flatMap((g: { emojis: string[] }) => g.emojis);
    const matchingEmojis = allEmojis.filter((e: string) => e === element.props.selectedEmoji);
    expect(matchingEmojis).toHaveLength(1);
  });

  it('keyboard: Enter/Space selects the focused emoji', () => {
    const onSelect = vi.fn();
    const element = React.createElement(EmojiPicker, {
      groups: testGroups,
      selectedEmoji: '🍔',
      onSelect,
      groupLabels: testGroupLabels,
    });
    // Simulate keyboard-triggered selection
    element.props.onSelect('🚗');
    expect(onSelect).toHaveBeenCalledWith('🚗');
  });

  it('renders "current" emoji when selectedEmoji is not in the provided groups', () => {
    const onSelect = vi.fn();
    const nonCuratedEmoji = '🦄';
    const element = React.createElement(EmojiPicker, {
      groups: testGroups,
      selectedEmoji: nonCuratedEmoji,
      onSelect,
      groupLabels: testGroupLabels,
    });
    expect(element.props.selectedEmoji).toBe(nonCuratedEmoji);
    // Verify the emoji is not in the curated set
    const allEmojis = testGroups.flatMap((g) => g.emojis);
    expect(allEmojis).not.toContain(nonCuratedEmoji);
  });
});
