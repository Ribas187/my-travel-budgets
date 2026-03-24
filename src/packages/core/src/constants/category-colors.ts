export interface CategoryColor {
  hex: string;
  name: string;
}

export const CATEGORY_COLORS: CategoryColor[] = [
  { hex: '#E53E3E', name: 'Red' },
  { hex: '#DD6B20', name: 'Orange' },
  { hex: '#D69E2E', name: 'Yellow' },
  { hex: '#38A169', name: 'Green' },
  { hex: '#319795', name: 'Teal' },
  { hex: '#3182CE', name: 'Blue' },
  { hex: '#5A67D8', name: 'Indigo' },
  { hex: '#805AD5', name: 'Purple' },
  { hex: '#D53F8C', name: 'Pink' },
  { hex: '#E53E6F', name: 'Rose' },
  { hex: '#2D3748', name: 'Gray' },
  { hex: '#975A16', name: 'Brown' },
  { hex: '#2B6CB0', name: 'Ocean' },
  { hex: '#276749', name: 'Forest' },
];

export const DEFAULT_CATEGORY_COLOR = CATEGORY_COLORS[0].hex;
