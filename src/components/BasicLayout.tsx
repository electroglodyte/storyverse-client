import React, { useEffect, useState } from 'react'
import type { StoryWorld, Story } from '@/types/database'
import { supabase } from '@/services/supabase'
import SideNav from './SideNav'

interface BasicLayoutProps {
  children: React.ReactNode;
}

export default function BasicLayout({ children }: BasicLayoutProps) {
  const [storyWorlds, setStoryWorlds] = useState<StoryWorld[]>([])
  const [activeStoryWorld, setActiveStoryWorld] = useState<StoryWorld | null>(null)
  const [activeStory, setActiveStory] = useState<Story | null>(null)
  const [activeSeries, setActiveSeries] = useState<Series | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStoryWorlds() {
      setLoading(true)
      try {
        const { data: storyWorldsData, error } = await supabase
          .from('story_worlds')
          .select('*')
          .order('name', { ascending: true })

        if (error) {
          console.error('Error fetching story worlds:', error)
          return
        }

        if (storyWorldsData) {
          setStoryWorlds(storyWorldsData)
          if (storyWorldsData.length > 0 && !activeStoryWorld) {
            setActiveStoryWorld(storyWorldsData[0])
          }
        }
      } catch (err) {
        console.error('Error in fetchStoryWorlds:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchStoryWorlds()
  }, [])

  useEffect(() => {
    async function fetchStories() {
      if (!activeStoryWorld) return

      try {
        const { data: storiesData, error } = await supabase
          .from('stories')
          .select('*')
          .eq('story_world_id', activeStoryWorld.id)
          .order('title', { ascending: true })

        if (error) {
          console.error('Error fetching stories:', error)
          return
        }

        if (storiesData && storiesData.length > 0 && !activeStory) {
          setActiveStory(storiesData[0])
        }
      } catch (err) {
        console.error('Error in fetchStories:', err)
      }
    }

    fetchStories()
  }, [activeStoryWorld])

  return (
    <div className="min-h-screen flex bg-gray-100">
      <SideNav
        activeStoryWorld={activeStoryWorld}
        activeStory={activeStory}
        activeSeries={activeSeries}
        storyWorlds={storyWorlds}
        setActiveStoryWorld={setActiveStoryWorld}
        setActiveStory={setActiveStory}
        setActiveSeries={setActiveSeries}
        loading={loading}
      />
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}