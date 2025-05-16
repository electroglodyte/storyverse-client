import React from 'react'
import { useNavigate } from 'react-router-dom'
import type { StoryWorld, Story, Series } from '@/types/database'

interface SideNavProps {
  activeStoryWorld: StoryWorld | null
  activeStory: Story | null
  activeSeries: Series | null
  storyWorlds: StoryWorld[]
  setActiveStoryWorld: (world: StoryWorld | null) => void
  setActiveStory: (story: Story | null) => void
  setActiveSeries: (series: Series | null) => void
  loading: boolean
}

export default function SideNav({ 
  activeStoryWorld, 
  activeStory,
  activeSeries, 
  storyWorlds,
  setActiveStoryWorld,
  setActiveStory,
  setActiveSeries,
  loading 
}: SideNavProps) {
  const navigate = useNavigate()

  const handleStoryWorldClick = (world: StoryWorld) => {
    setActiveStoryWorld(world)
    setActiveStory(null)
    setActiveSeries(null)
    navigate(`/storyworld/${world.id}`)
  }

  const handleStoryClick = (story: Story) => {
    setActiveStory(story)
    navigate(`/story/${story.id}`)
  }

  if (loading) {
    return (
      <aside className="w-64 bg-gray-800 min-h-screen text-white p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-700 rounded w-3/4 mb-6"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-700 rounded w-5/6"></div>
            <div className="h-4 bg-gray-700 rounded w-4/6"></div>
          </div>
        </div>
      </aside>
    )
  }

  return (
    <aside className="w-64 bg-gray-800 min-h-screen text-white p-4">
      <nav>
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Story Worlds</h2>
          <ul className="space-y-1">
            {storyWorlds.map((world) => (
              <li
                key={world.id}
                className={`cursor-pointer p-2 rounded transition-colors ${
                  activeStoryWorld?.id === world.id 
                    ? 'bg-blue-600 hover:bg-blue-700' 
                    : 'hover:bg-gray-700'
                }`}
                onClick={() => handleStoryWorldClick(world)}
              >
                {world.name}
              </li>
            ))}
          </ul>
        </div>

        {activeStoryWorld && activeStory && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Current Story</h2>
            <div className="p-2 bg-gray-700 rounded">
              {activeStory.title}
            </div>
          </div>
        )}
      </nav>
    </aside>
  )
}