// src/components/AppNav.tsx
import React from 'react';
import type { StoryWorld, Story, Series } from '@/types/database';

interface AppNavProps {
  activeStoryWorld: StoryWorld | null;
  activeStory: Story | null;
  activeSeries: Series | null;
  storyWorlds: StoryWorld[];
  setActiveStoryWorld: (storyWorld: StoryWorld | null) => void;
  setActiveStory: (story: Story | null) => void;
  setActiveSeries: (series: Series | null) => void;
  loading: boolean;
}

export const AppNav: React.FC<AppNavProps> = ({
  activeStoryWorld,
  activeStory,
  activeSeries,
  loading
}) => {
  // Empty top bar for now, but displays current context
  return (
    <div className="flex items-center justify-between w-full">
      {/* Left side - context info */}
      <div className="flex items-center space-x-2">
        {loading ? (
          <div className="h-6 w-32 bg-gray-700 animate-pulse rounded"></div>
        ) : (
          <div className="flex items-center space-x-2 text-gray-300">
            {activeStoryWorld && (
              <>
                <span>{activeStoryWorld.name}</span>
                {activeStory && (
                  <>
                    <span className="text-gray-500">/</span>
                    <span>{activeStory.title}</span>
                  </>
                )}
                {activeSeries && (
                  <>
                    <span className="text-gray-500">/</span>
                    <span>{activeSeries.name}</span>
                  </>
                )}
              </>
            )}
          </div>
        )}
      </div>
      
      {/* Right side - reserved for actions */}
      <div></div>
    </div>
  );
};