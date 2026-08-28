// Force mock DB and test mode before anything else loads
process.env.NODE_ENV = "test";
process.env.NEXT_PUBLIC_USE_MOCK_DB = "true";

import { vi, afterEach, beforeEach } from "vitest";

// Polyfill / Mock clipboard API
if (typeof globalThis.navigator === "undefined") {
  let clipboardText = "";
  (globalThis as any).navigator = {
    clipboard: {
      writeText: async (text: string) => {
        clipboardText = text;
        return Promise.resolve();
      },
      readText: async () => {
        return Promise.resolve(clipboardText);
      },
    },
  };
} else if (!globalThis.navigator.clipboard) {
  let clipboardText = "";
  Object.defineProperty(globalThis.navigator, "clipboard", {
    value: {
      writeText: async (text: string) => {
        clipboardText = text;
        return Promise.resolve();
      },
      readText: async () => {
        return Promise.resolve(clipboardText);
      },
    },
    configurable: true,
    writable: true,
  });
}

// Polyfill window / matchMedia if running in headless node
if (typeof globalThis.window === "undefined") {
  (globalThis as any).window = globalThis;
}

if (!globalThis.window.matchMedia) {
  Object.defineProperty(globalThis.window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: query.includes("375px") || query.includes("max-width"),
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => true,
    }),
  });
}
