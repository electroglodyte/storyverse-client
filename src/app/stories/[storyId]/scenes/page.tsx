import React from 'react';
import { useRouter } from 'next/router';
import { SceneTable } from '@/components/SceneTable';
import { Timeline } from '@/components/Timeline';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function StoryScenesPage() {
  const router = useRouter();
  const { storyId } = router.query;

  if (!storyId) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="timeline">Timeline View</TabsTrigger>
        </TabsList>
        <TabsContent value="list">
          <SceneTable storyId={storyId as string} />
        </TabsContent>
        <TabsContent value="timeline">
          <Timeline storyId={storyId as string} />
        </TabsContent>
      </Tabs>
    </div>
  );
}