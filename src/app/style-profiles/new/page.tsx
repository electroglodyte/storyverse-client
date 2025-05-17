import React from 'react';
import { StyleProfileDetail } from '@/components/StyleProfileDetail';

export default function NewStyleProfilePage() {
  return (
    <div className="container mx-auto">
      <StyleProfileDetail isNew={true} />
    </div>
  );
}