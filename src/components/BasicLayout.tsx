import React, { useEffect, useState } from 'react'
import SideNav from './SideNav'
import { supabase } from '@/services/supabase'
import { Tables } from '@/types/database'

type StoryWorld = Tables['story_worlds']
type Story = Tables['stories']

interface Props {
  children: React.ReactNode;
}

export default function BasicLayout({ children }: Props) {
  const [storyWorlds, setStoryWorlds] = useState<StoryWorld[]>([])
  const [selectedWorld, setSelectedWorld] = useState<StoryWorld | null>(null)
  const [stories, setStories] = useState<Story[]>([])

  useEffect(() => {
    async function fetchStoryWorlds() {
      const { data: storyWorldsData, error } = await supabase
        .from('story_worlds')
        .select('*')

      if (error) {
        console.error('Error fetching story worlds:', error)
        return
      }

      if (storyWorldsData) {
        setStoryWorlds(storyWorldsData)
        if (storyWorldsData.length > 0) {
          setSelectedWorld(storyWorldsData[0])
        }
      }
    }

    fetchStoryWorlds()
  }, [])

  useEffect(() => {
    async function fetchStories() {
      if (!selectedWorld) return

      const { data: storiesData, error } = await supabase
        .from('stories')
        .select('*')
        .eq('story_world_id', selectedWorld.id)

      if (error) {
        console.error('Error fetching stories:', error)
        return
      }

      if (storiesData) {
        setStories(storiesData)
      }
    }

    fetchStories()
  }, [selectedWorld])

  return (
    <div className="min-h-screen flex">
      <SideNav
        storyWorlds={storyWorlds}
        selectedWorld={selectedWorld}
        stories={stories}
        onSelectWorld={setSelectedWorld}
      />
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  )
}