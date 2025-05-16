import { Tables } from '@/types/database';
import { supabase } from '@/services/supabase';

type Location = Tables['locations']
type Item = Tables['items']

export async function getLocation(locationId: string): Promise<Location | null> {
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .eq('id', locationId)
    .single()

  if (error) {
    console.error('Error fetching location:', error)
    return null
  }

  return data
}

export async function createLocation(location: Partial<Location>): Promise<Location | null> {
  const { data, error } = await supabase
    .from('locations')
    .insert(location)
    .select()
    .single()

  if (error) {
    console.error('Error creating location:', error)
    return null
  }

  return data
}

export async function updateLocation(locationId: string, updates: Partial<Location>): Promise<Location | null> {
  const { data, error } = await supabase
    .from('locations')
    .update(updates)
    .eq('id', locationId)
    .select()
    .single()

  if (error) {
    console.error('Error updating location:', error)
    return null
  }

  return data
}

export async function deleteLocation(locationId: string): Promise<boolean> {
  const { error } = await supabase
    .from('locations')
    .delete()
    .eq('id', locationId)

  if (error) {
    console.error('Error deleting location:', error)
    return false
  }

  return true
}

export async function getLocationsByStoryWorld(storyWorldId: string): Promise<Location[]> {
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .eq('story_world_id', storyWorldId)
    .order('name')

  if (error) {
    console.error('Error fetching locations:', error)
    return []
  }

  return data || []
}

export async function getItem(itemId: string): Promise<Item | null> {
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .eq('id', itemId)
    .single()

  if (error) {
    console.error('Error fetching item:', error)
    return null
  }

  return data
}

export async function createItem(item: Partial<Item>): Promise<Item | null> {
  const { data, error } = await supabase
    .from('items')
    .insert(item)
    .select()
    .single()

  if (error) {
    console.error('Error creating item:', error)
    return null
  }

  return data
}

export async function updateItem(itemId: string, updates: Partial<Item>): Promise<Item | null> {
  const { data, error } = await supabase
    .from('items')
    .update(updates)
    .eq('id', itemId)
    .select()
    .single()

  if (error) {
    console.error('Error updating item:', error)
    return null
  }

  return data
}

export async function deleteItem(itemId: string): Promise<boolean> {
  const { error } = await supabase
    .from('items')
    .delete()
    .eq('id', itemId)

  if (error) {
    console.error('Error deleting item:', error)
    return false
  }

  return true
}

export async function getItemsByStoryWorld(storyWorldId: string): Promise<Item[]> {
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .eq('story_world_id', storyWorldId)
    .order('name')

  if (error) {
    console.error('Error fetching items:', error)
    return []
  }

  return data || []
}

export async function getItemsByLocation(locationId: string): Promise<Item[]> {
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .eq('location_id', locationId)
    .order('name')

  if (error) {
    console.error('Error fetching items by location:', error)
    return []
  }

  return data || []
}

export async function moveItem(itemId: string, newLocationId: string): Promise<boolean> {
  const { error } = await supabase
    .from('items')
    .update({ location_id: newLocationId })
    .eq('id', itemId)

  if (error) {
    console.error('Error moving item:', error)
    return false
  }

  return true
}