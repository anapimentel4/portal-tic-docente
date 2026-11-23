/** true solo para direcciones web (http/https). Cualquier otra cosa se muestra como texto, nunca como enlace. */
export function esEnlaceWeb(valor: string | null | undefined): valor is string {
  return !!valor && /^https?:\/\//i.test(valor);
}

/** Quita tildes y mayúsculas para buscar: "robotica" encuentra "Robótica". */
export function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}
