// src/components/AppNav.tsx
import React from 'react';
import { StoryWorld, Story, Series } from '../supabase-tables';

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
  storyWorlds,
  setActiveStoryWorld,
  setActiveStory,
  setActiveSeries,
  loading
}) => {
  // Empty top bar for now, as requested
  return (
    <div className="flex items-center justify-between w-full">
      {/* Left empty for now */}
      <div></div>
      
      {/* Right side also left empty */}
      <div></div>
    </div>
  );
};
