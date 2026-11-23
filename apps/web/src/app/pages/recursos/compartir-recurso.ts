import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AREAS, GRADOS, NIVELES_TIC, TIPOS_RECURSO, type Area, type Grado, type NivelTic, type TipoRecurso } from '@portal/shared';
import { AuthService } from '../../core/services/auth.service';
import { mensajeDeError } from '../../core/services/errores';
import { RecursosService } from '../../core/services/recursos.service';
import { Icono } from '../../shared/icono/icono';

/** Texto opcional: vacío → null, para no guardar cadenas vacías. */
const opcional = (valor: string) => valor.trim() || null;

/**
 * "Compartir un recurso" (/recursos/compartir). Pide sesión (authGuard).
 * Se guarda en revisión y a nombre del usuario; la dinamizadora lo revisa en el panel.
 */
@Component({
  selector: 'app-compartir-recurso',
  imports: [ReactiveFormsModule, RouterLink, Icono],
  templateUrl: './compartir-recurso.html',
})
export class CompartirRecursoPage {
  private readonly servicio = inject(RecursosService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder).nonNullable;

  protected readonly areas = AREAS;
  protected readonly grados = GRADOS;
  protected readonly tipos = TIPOS_RECURSO;
  protected readonly niveles = Object.entries(NIVELES_TIC) as [NivelTic, string][];

  protected readonly enviando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly enviado = signal<string | null>(null);

  protected readonly form = this.fb.group({
    titulo: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(150)]],
    enlace: ['', [Validators.required, Validators.pattern(/^https?:\/\/\S+\.\S+$/i)]],
    area: ['', Validators.required],
    grado: ['', Validators.required],
    tipo: ['', Validators.required],
    descripcion: ['', Validators.maxLength(500)],
    competencias: [''],
    tema_unidad: [''],
    herramienta: [''],
    duracion: [''],
    nivel_tic: [''],
    autor: [''],
    fuente: [''],
    licencia: [''],
    etiquetas: [''],
  });

  protected async enviar(): Promise<void> {
    const usuario = this.auth.usuario();
    if (this.form.invalid || !usuario) {
      this.form.markAllAsTouched();
      // Lleva el foco al primer campo con error para que se vea qué falta.
      setTimeout(() => document.querySelector<HTMLElement>('form .ng-invalid')?.focus());
      return;
    }
    const v = this.form.getRawValue();
    this.enviando.set(true);
    this.error.set(null);
    try {
      await this.servicio.proponer(
        {
          titulo: v.titulo.trim(),
          enlace_o_archivo: v.enlace.trim(),
          area: v.area as Area,
          grado: v.grado as Grado,
          tipo: v.tipo as TipoRecurso,
          descripcion: opcional(v.descripcion),
          competencias: opcional(v.competencias),
          tema_unidad: opcional(v.tema_unidad),
          herramienta: opcional(v.herramienta),
          duracion: opcional(v.duracion),
          nivel_tic: (v.nivel_tic || null) as NivelTic | null,
          autor: opcional(v.autor),
          fuente: opcional(v.fuente),
          licencia: opcional(v.licencia),
          // "Scratch, juegos, scratch" → ["Scratch", "juegos"]
          etiquetas: [
            ...new Map(
              v.etiquetas
                .split(',')
                .map((e) => e.trim())
                .filter(Boolean)
                .map((e) => [e.toLowerCase(), e] as const),
            ).values(),
          ],
        },
        usuario.id,
      );
      this.enviado.set(v.titulo.trim());
      this.form.reset();
      window.scrollTo({ top: 0 });
    } catch (e) {
      this.error.set(mensajeDeError(e));
    } finally {
      this.enviando.set(false);
    }
  }

  protected otro(): void {
    this.enviado.set(null);
    this.error.set(null);
  }

  protected invalido(campo: keyof typeof this.form.controls): boolean {
    const c = this.form.controls[campo];
    return c.touched && c.invalid;
  }
}
