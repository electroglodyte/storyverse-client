import { TimelineElement, Storyline, StorylineElement, StructuralElement } from '@/types/database'
import { TimelineElementWithDetails } from '@/types/extended'
import { supabase } from '@/lib/supabase'
import { DBResponse } from '@/lib/supabase'

export async function getTimelineElementWithDetails(id: string): Promise<TimelineElementWithDetails | null> {
  const { data, error } = await supabase
    .from('timeline_elements')
    .select(`
      *,
      storylines:storyline_elements(
        storylines(*)
      )
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching timeline element:', error)
    return null
  }

  // Load the referenced element based on type
  if (data) {
    const elementData = await getElementByType(data.element_type, data.element_id)
    return {
      ...data,
      element: elementData,
      storylines: data.storylines?.map((s: any) => s.storylines) || []
    } as TimelineElementWithDetails
  }

  return null
}

async function getElementByType(type: string, id: string): Promise<any> {
  let table: string
  switch (type) {
    case 'scene':
      table = 'scenes'
      break
    case 'event':
      table = 'events'
      break
    case 'structural':
      table = 'structural_elements'
      break
    default:
      return null
  }

  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error(`Error fetching ${type}:`, error)
    return null
  }

  return data
}

export async function createTimelineElement(element: Partial<TimelineElement>): Promise<DBResponse<TimelineElement>> {
  const { data, error } = await supabase
    .from('timeline_elements')
    .insert([element])
    .select()
    .single()

  return { data, error }
}

export async function updateTimelineElement(id: string, updates: Partial<TimelineElement>): Promise<DBResponse<TimelineElement>> {
  const { data, error } = await supabase
    .from('timeline_elements')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  return { data, error }
}

export async function deleteTimelineElement(id: string): Promise<DBResponse<TimelineElement>> {
  const { data, error } = await supabase
    .from('timeline_elements')
    .delete()
    .eq('id', id)
    .select()
    .single()

  return { data, error }
}

export async function createStoryline(storyline: Partial<Storyline>): Promise<DBResponse<Storyline>> {
  const { data, error } = await supabase
    .from('storylines')
    .insert([storyline])
    .select()
    .single()

  return { data, error }
}

export async function updateStoryline(id: string, updates: Partial<Storyline>): Promise<DBResponse<Storyline>> {
  const { data, error } = await supabase
    .from('storylines')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  return { data, error }
}

export async function deleteStoryline(id: string): Promise<DBResponse<Storyline>> {
  const { data, error } = await supabase
    .from('storylines')
    .delete()
    .eq('id', id)
    .select()
    .single()

  return { data, error }
}

export async function addElementToStoryline(
  storylineElement: Partial<StorylineElement>
): Promise<DBResponse<StorylineElement>> {
  const { data, error } = await supabase
    .from('storyline_elements')
    .insert([storylineElement])
    .select()
    .single()

  return { data, error }
}

export async function removeElementFromStoryline(
  storylineId: string,
  elementId: string
): Promise<DBResponse<StorylineElement>> {
  const { data, error } = await supabase
    .from('storyline_elements')
    .delete()
    .eq('storyline_id', storylineId)
    .eq('element_id', elementId)
    .select()
    .single()

  return { data, error }
}

export async function createStructuralElement(
  element: Partial<StructuralElement>
): Promise<DBResponse<StructuralElement>> {
  const { data, error } = await supabase
    .from('structural_elements')
    .insert([element])
    .select()
    .single()

  return { data, error }
}

export async function updateStructuralElement(
  id: string,
  updates: Partial<StructuralElement>
): Promise<DBResponse<StructuralElement>> {
  const { data, error } = await supabase
    .from('structural_elements')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  return { data, error }
}

export async function deleteStructuralElement(id: string): Promise<DBResponse<StructuralElement>> {
  const { data, error } = await supabase
    .from('structural_elements')
    .delete()
    .eq('id', id)
    .select()
    .single()

  return { data, error }
}