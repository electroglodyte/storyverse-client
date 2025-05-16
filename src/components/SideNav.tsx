import React from 'react'
import { Tables } from '@/types/database'
import { useRouter } from 'next/router'

type StoryWorld = Tables['story_worlds']
type Story = Tables['stories']

interface Props {
  storyWorlds: StoryWorld[]
  selectedWorld: StoryWorld | null
  stories: Story[]
  onSelectWorld: (world: StoryWorld) => void
}

export default function SideNav({ storyWorlds, selectedWorld, stories, onSelectWorld }: Props) {
  const router = useRouter()

  const handleStoryClick = (story: Story) => {
    router.push(`/story/${story.id}`)
  }

  return (
    <aside className="w-64 bg-gray-800 min-h-screen text-white p-4">
      <nav>
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Story Worlds</h2>
          <ul>
            {storyWorlds.map((world) => (
              <li
                key={world.id}
                className={`cursor-pointer p-2 rounded ${
                  selectedWorld?.id === world.id ? 'bg-blue-600' : 'hover:bg-gray-700'
                }`}
                onClick={() => onSelectWorld(world)}
              >
                {world.name}
              </li>
            ))}
          </ul>
        </div>

        {selectedWorld && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Stories</h2>
            <ul>
              {stories.map((story) => (
                <li
                  key={story.id}
                  className="cursor-pointer p-2 rounded hover:bg-gray-700"
                  onClick={() => handleStoryClick(story)}
                >
                  {story.title}
                </li>
              ))}
            </ul>
          </div>
        )}
      </nav>
    </aside>
  )
}