/// <reference types="vite/client" />

/** Changes with every build: appended to model URLs so that a new deploy is never served from a stale cache (see vite.config.ts). */
declare const __BUILD_ID__: string;
