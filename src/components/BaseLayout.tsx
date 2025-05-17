import React, { Suspense } from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { LoadingState } from './LoadingState';

interface BaseLayoutProps {
  children: React.ReactNode;
  fullWidth?: boolean;
}

export const BaseLayout: React.FC<BaseLayoutProps> = ({
  children,
  fullWidth = false,
}) => {
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingState fullScreen />}>
        <main className={`min-h-screen bg-background ${fullWidth ? '' : 'container mx-auto px-4'}`}>
          {children}
        </main>
      </Suspense>
    </ErrorBoundary>
  );
};