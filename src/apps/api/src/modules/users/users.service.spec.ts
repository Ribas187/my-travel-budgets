import { NotFoundException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { PrismaService } from '@/modules/prisma/prisma.service'
import { UsersService } from './users.service'

const mockUserFindUnique = jest.fn()
const mockUserUpdate = jest.fn()

const prismaServiceMock = {
  user: {
    findUnique: mockUserFindUnique,
    update: mockUserUpdate,
  },
}

describe('UsersService', () => {
  let service: UsersService

  beforeEach(async () => {
    jest.clearAllMocks()

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prismaServiceMock },
      ],
    }).compile()

    service = module.get<UsersService>(UsersService)
  })

  describe('getMe', () => {
    it('returns user profile for valid userId', async () => {
      const user = {
        id: 'user-1',
        email: 'user@test.com',
        name: 'Test User',
        avatarUrl: 'https://example.com/avatar.png',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      }
      mockUserFindUnique.mockResolvedValue(user)

      const result = await service.getMe('user-1')

      expect(mockUserFindUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
      })
      expect(result).toEqual({
        id: 'user-1',
        email: 'user@test.com',
        name: 'Test User',
        avatarUrl: 'https://example.com/avatar.png',
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })
    })

    it('throws NotFoundException for non-existent userId', async () => {
      mockUserFindUnique.mockResolvedValue(null)

      await expect(service.getMe('non-existent')).rejects.toThrow(NotFoundException)
    })
  })

  describe('updateMe', () => {
    const baseUser = {
      id: 'user-1',
      email: 'user@test.com',
      name: 'Original Name',
      avatarUrl: null as string | null,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-02'),
    }

    it('updates name only', async () => {
      const updated = { ...baseUser, name: 'New Name', updatedAt: new Date() }
      mockUserUpdate.mockResolvedValue(updated)

      const result = await service.updateMe('user-1', { name: 'New Name' })

      expect(mockUserUpdate).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { name: 'New Name' },
      })
      expect(result.name).toBe('New Name')
    })

    it('updates avatarUrl only', async () => {
      const updated = {
        ...baseUser,
        avatarUrl: 'https://cdn.example.com/avatar.png',
        updatedAt: new Date(),
      }
      mockUserUpdate.mockResolvedValue(updated)

      const result = await service.updateMe('user-1', {
        avatarUrl: 'https://cdn.example.com/avatar.png',
      })

      expect(mockUserUpdate).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { avatarUrl: 'https://cdn.example.com/avatar.png' },
      })
      expect(result.avatarUrl).toBe('https://cdn.example.com/avatar.png')
    })

    it('updates both name and avatarUrl', async () => {
      const updated = {
        ...baseUser,
        name: 'New Name',
        avatarUrl: 'https://cdn.example.com/new.png',
        updatedAt: new Date(),
      }
      mockUserUpdate.mockResolvedValue(updated)

      const result = await service.updateMe('user-1', {
        name: 'New Name',
        avatarUrl: 'https://cdn.example.com/new.png',
      })

      expect(mockUserUpdate).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { name: 'New Name', avatarUrl: 'https://cdn.example.com/new.png' },
      })
      expect(result.name).toBe('New Name')
      expect(result.avatarUrl).toBe('https://cdn.example.com/new.png')
    })

    it('does not update email even if provided in input', async () => {
      mockUserUpdate.mockResolvedValue(baseUser)

      await service.updateMe('user-1', {
        name: 'New Name',
        email: 'hacker@evil.com' as unknown as string,
      } as { name?: string; avatarUrl?: string })

      expect(mockUserUpdate).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { name: 'New Name' },
      })
    })
  })
})
