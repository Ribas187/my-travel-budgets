import { describe, it, expect } from 'vitest'
import { queryKeys } from '../queryKeys'

describe('queryKeys', () => {
  describe('travels', () => {
    it('all returns ["travels"]', () => {
      expect(queryKeys.travels.all).toEqual(['travels'])
    })

    it('detail returns ["travels", id]', () => {
      expect(queryKeys.travels.detail('t1')).toEqual(['travels', 't1'])
    })
  })

  describe('expenses', () => {
    it('list returns ["travels", travelId, "expenses", undefined] without filters', () => {
      expect(queryKeys.expenses.list('t1')).toEqual(['travels', 't1', 'expenses', undefined])
    })

    it('list returns ["travels", travelId, "expenses", filters] with filters', () => {
      const filters = { categoryId: 'cat1' }
      expect(queryKeys.expenses.list('t1', filters)).toEqual([
        'travels',
        't1',
        'expenses',
        { categoryId: 'cat1' },
      ])
    })
  })

  describe('categories', () => {
    it('list returns ["travels", travelId, "categories"]', () => {
      expect(queryKeys.categories.list('t1')).toEqual(['travels', 't1', 'categories'])
    })
  })

  describe('dashboard', () => {
    it('get returns ["travels", travelId, "dashboard"]', () => {
      expect(queryKeys.dashboard.get('t1')).toEqual(['travels', 't1', 'dashboard'])
    })
  })

  describe('users', () => {
    it('me returns ["users", "me"]', () => {
      expect(queryKeys.users.me).toEqual(['users', 'me'])
    })
  })
})
