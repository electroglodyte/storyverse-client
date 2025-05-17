import React from 'react';
import { useRouter } from 'next/router';
import { SceneDetail } from '@/components/SceneDetail';

export default function NewScenePage() {
  const router = useRouter();
  const { storyId } = router.query;

  if (!storyId) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto">
      <SceneDetail storyId={storyId as string} isNew={true} />
    </div>
  );
}