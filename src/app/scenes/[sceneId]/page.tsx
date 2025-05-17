import React from 'react';
import { useRouter } from 'next/router';
import { SceneDetail } from '@/components/SceneDetail';

export default function ScenePage() {
  const router = useRouter();
  const { sceneId } = router.query;

  if (!sceneId) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto">
      <SceneDetail sceneId={sceneId as string} />
    </div>
  );
}