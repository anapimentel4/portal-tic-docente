import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

/**
 * Crea UNA sola conexión a Supabase para toda la app.
 * Los demás servicios (AuthService, RecursosService…) la piden con inject(SupabaseService).client.
 */
@Injectable({ providedIn: 'root' })
export class SupabaseService {
  /** false mientras environment.ts no tenga la URL y la anon key. */
  readonly configurado = Boolean(environment.supabaseUrl && environment.supabaseAnonKey);

  readonly client: SupabaseClient = createClient(
    // createClient falla con una URL vacía: mientras no haya claves usamos una de relleno.
    environment.supabaseUrl || 'https://falta-configurar.supabase.co',
    environment.supabaseAnonKey || 'falta-configurar',
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    },
  );
}
