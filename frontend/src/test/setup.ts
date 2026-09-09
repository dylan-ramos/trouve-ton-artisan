import '@testing-library/jest-dom/vitest';

import { vi } from 'vitest';

// JSDOM has no viewport; browser navigation is covered by Playwright.
Object.defineProperty(window, 'scrollTo', { value: vi.fn(), writable: true });
