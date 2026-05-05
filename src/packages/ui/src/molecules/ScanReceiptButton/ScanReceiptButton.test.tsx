import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { TamaguiProvider } from 'tamagui';

import { config } from '../../quarks';

import { ScanReceiptButton } from './ScanReceiptButton';

function renderButton(props: Partial<React.ComponentProps<typeof ScanReceiptButton>> = {}) {
  const merged = {
    label: 'Scan receipt',
    onFileSelected: vi.fn(),
    ...props,
  } as React.ComponentProps<typeof ScanReceiptButton>;
  return {
    ...render(
      <TamaguiProvider config={config} defaultTheme="light">
        <ScanReceiptButton {...merged} />
      </TamaguiProvider>,
    ),
    onFileSelected: merged.onFileSelected as ReturnType<typeof vi.fn>,
  };
}

function pngFile(name = 'receipt.png') {
  return new File(['png-bytes'], name, { type: 'image/png' });
}

describe('ScanReceiptButton', () => {
  beforeEach(() => {
    cleanup();
  });

  it('renders the visible button using the label prop and the hidden file input', () => {
    const { getByTestId, getByLabelText } = renderButton({ label: 'Scan receipt' });

    expect(getByLabelText('Scan receipt')).toBeDefined();

    const input = getByTestId('scan-receipt-button-input') as HTMLInputElement;
    expect(input.tagName).toBe('INPUT');
    expect(input.type).toBe('file');
  });

  it('configures the hidden input with image/jpeg+png and capture=environment', () => {
    const { getByTestId } = renderButton();

    const input = getByTestId('scan-receipt-button-input') as HTMLInputElement;
    expect(input.accept).toBe('image/jpeg,image/png');
    expect(input.getAttribute('capture')).toBe('environment');
    // Hidden from the keyboard tab order — interaction goes through the visible button.
    expect(input.tabIndex).toBe(-1);
    expect(input.getAttribute('aria-hidden')).toBe('true');
  });

  it('uses the label prop as aria-label on the visible button (no hardcoded copy)', () => {
    const { getByLabelText } = renderButton({ label: 'Escanear recibo' });

    expect(getByLabelText('Escanear recibo')).toBeDefined();
  });

  it('calls onFileSelected with the chosen File on the input change event', () => {
    const onFileSelected = vi.fn();
    const { getByTestId } = renderButton({ onFileSelected });

    const input = getByTestId('scan-receipt-button-input') as HTMLInputElement;
    const file = pngFile();

    fireEvent.change(input, { target: { files: [file] } });

    expect(onFileSelected).toHaveBeenCalledTimes(1);
    expect(onFileSelected).toHaveBeenCalledWith(file);
  });

  it('clears the input value after a successful selection so the same file can be picked again', () => {
    const onFileSelected = vi.fn();
    const { getByTestId } = renderButton({ onFileSelected });

    const input = getByTestId('scan-receipt-button-input') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [pngFile()] } });

    expect(input.value).toBe('');
  });

  it('does not call onFileSelected when no file is chosen', () => {
    const onFileSelected = vi.fn();
    const { getByTestId } = renderButton({ onFileSelected });

    const input = getByTestId('scan-receipt-button-input') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [] } });

    expect(onFileSelected).not.toHaveBeenCalled();
    // Even when no file is chosen, the input is reset.
    expect(input.value).toBe('');
  });

  it('opens the hidden file picker when the visible button is pressed', () => {
    const { getByLabelText, getByTestId } = renderButton({ label: 'Scan receipt' });

    const input = getByTestId('scan-receipt-button-input') as HTMLInputElement;
    const clickSpy = vi.spyOn(input, 'click').mockImplementation(() => undefined);

    fireEvent.click(getByLabelText('Scan receipt'));

    expect(clickSpy).toHaveBeenCalled();
  });

  it('does NOT open the file picker when loading=true', () => {
    const { getByLabelText, getByTestId } = renderButton({
      label: 'Scan receipt',
      loading: true,
    });

    const input = getByTestId('scan-receipt-button-input') as HTMLInputElement;
    const clickSpy = vi.spyOn(input, 'click').mockImplementation(() => undefined);

    fireEvent.click(getByLabelText('Scan receipt'));

    expect(clickSpy).not.toHaveBeenCalled();
  });

  it('does NOT open the file picker when disabled=true', () => {
    const { getByLabelText, getByTestId } = renderButton({
      label: 'Scan receipt',
      disabled: true,
    });

    const input = getByTestId('scan-receipt-button-input') as HTMLInputElement;
    const clickSpy = vi.spyOn(input, 'click').mockImplementation(() => undefined);

    fireEvent.click(getByLabelText('Scan receipt'));

    expect(clickSpy).not.toHaveBeenCalled();
  });

  it('marks the visible button aria-disabled when loading', () => {
    const { getByLabelText } = renderButton({ label: 'Scan receipt', loading: true });

    const button = getByLabelText('Scan receipt');
    expect(button.getAttribute('aria-disabled')).toBe('true');
  });

  it('marks the visible button aria-disabled when disabled', () => {
    const { getByLabelText } = renderButton({ label: 'Scan receipt', disabled: true });

    const button = getByLabelText('Scan receipt');
    expect(button.getAttribute('aria-disabled')).toBe('true');
  });
});
