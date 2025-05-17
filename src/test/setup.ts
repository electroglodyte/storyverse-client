import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import matchers from '@testing-library/jest-dom/matchers';
import { vi } from 'vitest';

// Extend matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock window.fs
vi.stubGlobal('fs', {
  readFile: vi.fn(),
  writeFile: vi.fn(),
});

// Mock supabase client
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: vi.fn(),
    auth: {
      getUser: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
    },
  }),
}));
