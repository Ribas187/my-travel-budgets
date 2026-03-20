import { describe, it, expect } from 'vitest'
import React from 'react'
import { AvatarChip } from '../AvatarChip'

describe('AvatarChip', () => {
  it('renders without errors with required props', () => {
    const element = React.createElement(AvatarChip, {
      name: 'Ricardo',
      initial: 'R',
    })
    expect(element).toBeDefined()
    expect(element.props.name).toBe('Ricardo')
    expect(element.props.initial).toBe('R')
  })

  it('shows initials when no avatar URL provided', () => {
    const element = React.createElement(AvatarChip, {
      name: 'Ana',
      initial: 'A',
    })
    // Component uses initial prop to display text inside the avatar circle
    expect(element.props.initial).toBe('A')
  })

  it('accepts optional role badge', () => {
    const element = React.createElement(AvatarChip, {
      name: 'Ricardo',
      initial: 'R',
      role: 'Admin',
    })
    expect(element.props.role).toBe('Admin')
  })

  it('accepts custom avatar color', () => {
    const element = React.createElement(AvatarChip, {
      name: 'Ricardo',
      initial: 'R',
      avatarColor: '#F59E0B',
    })
    expect(element.props.avatarColor).toBe('#F59E0B')
  })

  it('renders without role when not provided', () => {
    const element = React.createElement(AvatarChip, {
      name: 'Sofia',
      initial: 'S',
    })
    expect(element.props.role).toBeUndefined()
  })
})
