import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local for testing
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia for components that require it (like some UI libraries)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
