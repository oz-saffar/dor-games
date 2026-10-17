import '@testing-library/jest-dom';

/**
 * jsdom ships no ResizeObserver, but several games measure their play area with
 * one (רעידת אדמה, פאזל תמונות, רשת!). A no-op stub is enough: the games all
 * seed their geometry from window size first and only use the observer to react
 * to later resizes, which never happen under test.
 */
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
