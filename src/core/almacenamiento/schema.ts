export const SCHEMA_VERSION = '1.0'

const KEY_VERSION = 'bingo:schema_version'

export function migrarSiHaceFalta(): void {
  const stored = localStorage.getItem(KEY_VERSION)
  if (!stored) {
    localStorage.setItem(KEY_VERSION, SCHEMA_VERSION)
    return
  }
  // v1: no hay migraciones entre versiones
}
