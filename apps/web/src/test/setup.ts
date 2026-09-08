import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Har testdan keyin DOM'ni tozalaymiz (testlar orasida izolyatsiya).
afterEach(() => cleanup());
