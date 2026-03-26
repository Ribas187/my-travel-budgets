import { describe, it, expect } from 'vitest';
import React from 'react';

import { UserAvatar, getCloudinaryAvatarUrl } from './UserAvatar';

describe('getCloudinaryAvatarUrl', () => {
  it('inserts transformation params after /upload/ in a Cloudinary URL', () => {
    const baseUrl = 'https://res.cloudinary.com/demo/image/upload/avatars/user123';
    const result = getCloudinaryAvatarUrl(baseUrl, 80);
    expect(result).toBe(
      'https://res.cloudinary.com/demo/image/upload/w_160,h_160,c_fill,f_auto,q_auto/avatars/user123',
    );
  });

  it('uses 2x size for retina displays', () => {
    const baseUrl = 'https://res.cloudinary.com/demo/image/upload/avatars/user123';
    const result = getCloudinaryAvatarUrl(baseUrl, 36);
    expect(result).toContain('w_72,h_72');
  });

  it('returns URL as-is if it does not match Cloudinary pattern', () => {
    const baseUrl = 'https://example.com/avatar.png';
    const result = getCloudinaryAvatarUrl(baseUrl, 80);
    expect(result).toBe(baseUrl);
  });

  it('handles URLs with existing transformations after /upload/', () => {
    const baseUrl = 'https://res.cloudinary.com/demo/image/upload/v1234567/avatars/user123';
    const result = getCloudinaryAvatarUrl(baseUrl, 40);
    expect(result).toBe(
      'https://res.cloudinary.com/demo/image/upload/w_80,h_80,c_fill,f_auto,q_auto/v1234567/avatars/user123',
    );
  });
});

describe('UserAvatar', () => {
  it('renders an image when avatarUrl is provided', () => {
    const element = React.createElement(UserAvatar, {
      avatarUrl: 'https://res.cloudinary.com/demo/image/upload/avatars/user123',
      name: 'Ricardo',
      size: 80,
    });
    expect(element).toBeDefined();
    expect(element.props.avatarUrl).toBe(
      'https://res.cloudinary.com/demo/image/upload/avatars/user123',
    );
    expect(element.props.size).toBe(80);
  });

  it('renders initial letter when avatarUrl is null', () => {
    const element = React.createElement(UserAvatar, {
      avatarUrl: null,
      name: 'Ana',
      size: 80,
    });
    expect(element).toBeDefined();
    expect(element.props.avatarUrl).toBeNull();
    expect(element.props.name).toBe('Ana');
  });

  it('applies the given size', () => {
    const element = React.createElement(UserAvatar, {
      avatarUrl: null,
      name: 'Test',
      size: 36,
    });
    expect(element.props.size).toBe(36);
  });

  it('accepts custom backgroundColor', () => {
    const element = React.createElement(UserAvatar, {
      avatarUrl: null,
      name: 'Test',
      size: 40,
      backgroundColor: '#FF0000',
    });
    expect(element.props.backgroundColor).toBe('#FF0000');
  });

  it('renders icon fallback when name is empty and no avatarUrl', () => {
    const element = React.createElement(UserAvatar, {
      avatarUrl: null,
      name: '',
      size: 28,
    });
    expect(element).toBeDefined();
    expect(element.props.name).toBe('');
    expect(element.props.avatarUrl).toBeNull();
  });
});
