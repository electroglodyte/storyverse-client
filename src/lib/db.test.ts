import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { supabase } from './db';
import {
  getCharacterWithRelationships,
  getFactionWithMembers,
  getLocationWithChildren
} from './db';

describe('Database Operations', () => {
  describe('Character Operations', () => {
    it('should handle character not found', async () => {
      const nonExistentId = 'non-existent-id';
      await expect(getCharacterWithRelationships(nonExistentId)).rejects.toThrow();
    });

    it('should handle null relationships', async () => {
      // Mock supabase response
      const mockCharacter = {
        id: 'test-id',
        name: 'Test Character',
        description: 'Test Description'
      };

      vi.spyOn(supabase, 'from').mockImplementation((table: string) => ({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: mockCharacter, error: null })
          }),
          or: () => Promise.resolve({ data: [], error: null })
        })
      }));

      const result = await getCharacterWithRelationships('test-id');
      expect(result).toEqual({
        ...mockCharacter,
        relationships: [],
        events: [],
        arcs: []
      });
    });
  });

  describe('Faction Operations', () => {
    it('should handle faction not found', async () => {
      const nonExistentId = 'non-existent-id';
      await expect(getFactionWithMembers(nonExistentId)).rejects.toThrow();
    });

    it('should handle null leader and headquarters', async () => {
      const mockFaction = {
        id: 'test-id',
        name: 'Test Faction',
        description: 'Test Description',
        leader_character_id: null,
        headquarters_location_id: null
      };

      vi.spyOn(supabase, 'from').mockImplementation((table: string) => ({
        select: () => ({
          eq: () => Promise.resolve({ data: [], error: null })
        })
      }));

      const result = await getFactionWithMembers('test-id');
      expect(result).toEqual({
        ...mockFaction,
        members: [],
        leader: null,
        headquarters: null
      });
    });
  });

  describe('Location Operations', () => {
    it('should handle location not found', async () => {
      const nonExistentId = 'non-existent-id';
      await expect(getLocationWithChildren(nonExistentId)).rejects.toThrow();
    });

    it('should handle null parent', async () => {
      const mockLocation = {
        id: 'test-id',
        name: 'Test Location',
        description: 'Test Description',
        parent_location_id: null
      };

      vi.spyOn(supabase, 'from').mockImplementation((table: string) => ({
        select: () => ({
          eq: () => Promise.resolve({ data: [], error: null })
        })
      }));

      const result = await getLocationWithChildren('test-id');
      expect(result).toEqual({
        ...mockLocation,
        children: [],
        parent: null
      });
    });
  });
});
