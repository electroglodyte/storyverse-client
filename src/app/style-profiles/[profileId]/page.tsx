import React from 'react';
import { useRouter } from 'next/router';
import { StyleProfileDetail } from '@/components/StyleProfileDetail';

export default function StyleProfilePage() {
  const router = useRouter();
  const { profileId } = router.query;

  if (!profileId) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto">
      <StyleProfileDetail profileId={profileId as string} />
    </div>
  );
}