import { useRef, type ChangeEvent } from 'react';
import { YStack } from 'tamagui';

import { PrimaryButton } from '../../atoms/PrimaryButton';

export interface ScanReceiptButtonProps {
  label: string;
  onFileSelected: (file: File) => void;
  loading?: boolean;
  disabled?: boolean;
  testID?: string;
}

const ACCEPTED_MIME = 'image/jpeg,image/png';

export function ScanReceiptButton({
  label,
  onFileSelected,
  loading,
  disabled,
  testID = 'scan-receipt-button',
}: ScanReceiptButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const isDisabled = Boolean(disabled || loading);

  const openPicker = () => {
    if (isDisabled) return;
    inputRef.current?.click();
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Always clear the input so the same file can be picked twice in a row
    // and so the captured image is not retained beyond the parent handoff.
    e.target.value = '';
    if (!file) return;
    onFileSelected(file);
  };

  return (
    <YStack data-testid={testID}>
      <PrimaryButton
        label={label}
        onPress={openPicker}
        loading={loading}
        disabled={disabled}
      />
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_MIME}
        capture="environment"
        onChange={handleChange}
        style={{ display: 'none' }}
        aria-hidden="true"
        tabIndex={-1}
        data-testid={`${testID}-input`}
      />
    </YStack>
  );
}
