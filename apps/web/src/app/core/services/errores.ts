/** Convierte los errores de Supabase en mensajes en español para el usuario. */
export function mensajeDeError(error: unknown): string {
  const e = error as { code?: string; message?: string; status?: number } | null;
  const codigo = e?.code ?? '';
  const mensaje = (e?.message ?? '').toLowerCase();

  const porCodigo: Record<string, string> = {
    invalid_credentials: 'El correo o la contraseña no son correctos.',
    email_not_confirmed: 'Todavía no has confirmado tu correo. Revisa tu bandeja de entrada (y la de spam).',
    user_already_exists: 'Ya existe una cuenta con ese correo. Intenta entrar.',
    email_exists: 'Ya existe una cuenta con ese correo. Intenta entrar.',
    weak_password: 'La contraseña es muy débil. Usa al menos 8 caracteres.',
    over_email_send_rate_limit: 'Se enviaron demasiados correos. Espera unos minutos e inténtalo de nuevo.',
    over_request_rate_limit: 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.',
    signup_disabled: 'El registro de cuentas está desactivado.',
    email_address_invalid: 'Ese correo no es válido.',
  };
  if (porCodigo[codigo]) return porCodigo[codigo];
  // Mensajes escritos en español por la base de datos (raise exception en los triggers).
  if (codigo === 'P0001' && e?.message) return e.message;

  if (mensaje.includes('failed to fetch') || mensaje.includes('network')) {
    return 'No hay conexión con el servidor. Revisa tu internet e inténtalo de nuevo.';
  }
  if (e?.status === 401 || e?.status === 403 || codigo === '42501') {
    return 'No tienes permiso para hacer esto.';
  }
  return 'No se pudo completar la acción. Inténtalo de nuevo.';
}
