/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BOXES_URL?: string
  readonly VITE_ITEMS_URL?: string
  readonly VITE_PLACEMENTS_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
