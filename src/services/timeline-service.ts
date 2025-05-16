import { supabase } from '@/services/supabase';
import { Tables } from '@/types/database';

type Event = {
  id: string;
  title: string;
  description?: string;
  story_id: string;
  sequence_number: number;
  chronological_time?: string;
  relative_time_offset?: string;
  time_reference_point?: string;
  visible?: boolean;
  created_at: string;
  updated_at: string;
}

type TimelineElement = {
  id: string;
  element_type: string;
  element_id: string;
  chronological_time: string;
  relative_time_offset?: string;
  time_reference_point?: string;
  story_order: number;
  story_id: string;
  created_at: string;
  updated_at: string;
}

export async function getTimeline(storyId: string) {
  // First get all timeline elements
  const { data: elements, error: elementsError } = await supabase
    .from('timeline_elements')
    .select('*')
    .eq('story_id', storyId)
    .order('story_order')

  if (elementsError) {
    console.error('Error fetching timeline elements:', elementsError)
    return []
  }

  // Then fetch details for each element
  const timelineItems = await Promise.all((elements || []).map(async (element) => {
    switch (element.element_type) {
      case 'event': {
        const { data: event } = await supabase
          .from('events')
          .select('*')
          .eq('id', element.element_id)
          .single()
        return { ...element, details: event }
      }
      case 'scene': {
        const { data: scene } = await supabase
          .from('scenes')
          .select('*')
          .eq('id', element.element_id)
          .single()
        return { ...element, details: scene }
      }
      case 'structural_element': {
        const { data: structuralElement } = await supabase
          .from('structural_elements')
          .select('*')
          .eq('id', element.element_id)
          .single()
        return { ...element, details: structuralElement }
      }
      default:
        return element
    }
  }))

  return timelineItems
}

export async function getEvents(storyId: string) {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('story_id', storyId)
    .order('sequence_number')

  if (error) {
    console.error('Error fetching events:', error)
    return []
  }

  return data || []
}

export async function createTimelineElement(element: Partial<TimelineElement>) {
  const { data, error } = await supabase
    .from('timeline_elements')
    .insert(element)
    .select()
    .single()

  if (error) {
    console.error('Error creating timeline element:', error)
    return null
  }

  return data
}

export async function updateTimelineElement(
  elementId: string,
  updates: Partial<TimelineElement>
) {
  const { data, error } = await supabase
    .from('timeline_elements')
    .update(updates)
    .eq('id', elementId)
    .select()
    .single()

  if (error) {
    console.error('Error updating timeline element:', error)
    return null
  }

  return data
}

export async function deleteTimelineElement(elementId: string) {
  const { error } = await supabase
    .from('timeline_elements')
    .delete()
    .eq('id', elementId)

  if (error) {
    console.error('Error deleting timeline element:', error)
    return false
  }

  return true
}

export async function reorderTimelineElements(
  storyId: string,
  elementOrder: { id: string; order: number }[]
) {
  const updates = elementOrder.map(item => ({
    id: item.id,
    story_order: item.order
  }))

  const { error } = await supabase
    .from('timeline_elements')
    .upsert(updates)

  if (error) {
    console.error('Error reordering timeline elements:', error)
    return false
  }

  return true
}

export async function createEvent(event: Partial<Event>) {
  const { data, error } = await supabase
    .from('events')
    .insert(event)
    .select()
    .single()

  if (error) {
    console.error('Error creating event:', error)
    return null
  }

  return data
}

export async function updateEvent(eventId: string, updates: Partial<Event>) {
  const { data, error } = await supabase
    .from('events')
    .update(updates)
    .eq('id', eventId)
    .select()
    .single()

  if (error) {
    console.error('Error updating event:', error)
    return null
  }

  return data
}

export async function deleteEvent(eventId: string) {
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', eventId)

  if (error) {
    console.error('Error deleting event:', error)
    return false
  }

  return true
}