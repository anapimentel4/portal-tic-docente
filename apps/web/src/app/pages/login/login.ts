import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AREAS, type Area } from '@portal/shared';
import { AuthService } from '../../core/services/auth.service';
import { mensajeDeError } from '../../core/services/errores';
import { SupabaseService } from '../../core/services/supabase.service';

type Modo = 'entrar' | 'registro';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly ruta = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder).nonNullable;
  protected readonly configurado = inject(SupabaseService).configurado;

  protected readonly modo = signal<Modo>('entrar');
  protected readonly enviando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly aviso = signal<string | null>(null);

  /** "Todas las áreas" no aplica a una persona. */
  protected readonly areas = AREAS.filter((a) => a !== 'Todas las áreas');

  protected readonly formEntrar = this.fb.group({
    correo: ['', [Validators.required, Validators.email]],
    contrasena: ['', Validators.required],
  });

  protected readonly formRegistro = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(80)]],
    area: [''],
    correo: ['', [Validators.required, Validators.email]],
    contrasena: ['', [Validators.required, Validators.minLength(8)]],
  });

  protected cambiarModo(modo: Modo): void {
    this.modo.set(modo);
    this.error.set(null);
    this.aviso.set(null);
  }

  protected async entrar(): Promise<void> {
    if (this.formEntrar.invalid) {
      this.formEntrar.markAllAsTouched();
      return;
    }
    const { correo, contrasena } = this.formEntrar.getRawValue();
    await this.enviar(async () => {
      await this.auth.iniciarSesion(correo.trim(), contrasena);
      await this.router.navigateByUrl(this.destino());
    });
  }

  protected async registrarse(): Promise<void> {
    if (this.formRegistro.invalid) {
      this.formRegistro.markAllAsTouched();
      return;
    }
    const v = this.formRegistro.getRawValue();
    await this.enviar(async () => {
      const { necesitaConfirmar } = await this.auth.registrarse({
        nombre: v.nombre.trim(),
        area: (v.area || null) as Area | null,
        correo: v.correo.trim(),
        contrasena: v.contrasena,
      });
      if (necesitaConfirmar) {
        this.formRegistro.reset();
        this.aviso.set(
          'Te enviamos un correo para confirmar tu cuenta. Ábrelo y luego vuelve aquí para entrar.',
        );
        this.modo.set('entrar');
      } else {
        await this.router.navigateByUrl(this.destino());
      }
    });
  }

  private async enviar(accion: () => Promise<void>): Promise<void> {
    this.enviando.set(true);
    this.error.set(null);
    try {
      await accion();
    } catch (e) {
      this.error.set(mensajeDeError(e));
    } finally {
      this.enviando.set(false);
    }
  }

  /** Página a la que se vuelve después de entrar. Solo rutas internas. */
  private destino(): string {
    const volver = this.ruta.snapshot.queryParamMap.get('volver') ?? '/';
    return volver.startsWith('/') && !volver.startsWith('//') ? volver : '/';
  }
}
