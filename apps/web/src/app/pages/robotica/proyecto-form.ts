import { Component, computed, DestroyRef, inject, input, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AREAS, GRADOS, type Area, type EstadoRecurso, type Grado } from '@portal/shared';
import { mensajeDeError } from '../../core/services/errores';
import { FOTO_MAX_MB, FOTO_TIPOS, RoboticaService } from '../../core/services/robotica.service';
import { Icono } from '../../shared/icono/icono';

const opcional = (valor: string) => valor.trim() || null;

/**
 * Crear (/robotica/nuevo) o editar (/robotica/:id/editar) un proyecto. Solo la dinamizadora (rolGuard + RLS).
 * La foto se sube al bucket robotica y en la tabla se guarda su URL pública.
 */
@Component({
  selector: 'app-proyecto-form',
  imports: [ReactiveFormsModule, RouterLink, Icono],
  templateUrl: './proyecto-form.html',
})
export class ProyectoFormPage implements OnInit {
  private readonly servicio = inject(RoboticaService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder).nonNullable;

  /** :id de la URL; no existe al crear. */
  readonly id = input<string>();
  protected readonly editando = computed(() => !!this.id());

  protected readonly areas = AREAS;
  protected readonly grados = GRADOS;
  protected readonly fotoTipos = FOTO_TIPOS.join(',');
  protected readonly fotoMaxMb = FOTO_MAX_MB;

  protected readonly cargando = signal(false);
  protected readonly noEncontrado = signal(false);
  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly errorFoto = signal<string | null>(null);

  /** URL de la foto guardada en la base de datos (al editar). */
  private fotoGuardada: string | null = null;
  /** Foto elegida ahora (aún sin subir) y su vista previa. */
  private fotoNueva: File | null = null;
  protected readonly vistaPrevia = signal<string | null>(null);

  protected readonly form = this.fb.group({
    titulo: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(150)]],
    area: ['', Validators.required],
    grado: ['', Validators.required],
    estado: ['publicado' as EstadoRecurso],
    competencias: [''],
    materiales: [''],
    pasos: [''],
  });

  constructor() {
    // Libera la vista previa al salir de la página.
    inject(DestroyRef).onDestroy(() => this.liberarVistaPrevia());
  }

  async ngOnInit(): Promise<void> {
    const id = this.id();
    if (!id) return;
    this.cargando.set(true);
    try {
      const p = await this.servicio.obtener(id);
      if (!p) {
        this.noEncontrado.set(true);
        return;
      }
      this.form.setValue({
        titulo: p.titulo,
        area: p.area,
        grado: p.grado,
        estado: p.estado,
        competencias: p.competencias ?? '',
        materiales: p.materiales ?? '',
        pasos: p.pasos ?? '',
      });
      this.fotoGuardada = p.foto_url;
      this.vistaPrevia.set(p.foto_url);
    } catch (e) {
      this.error.set(mensajeDeError(e));
    } finally {
      this.cargando.set(false);
    }
  }

  protected elegirFoto(evento: Event): void {
    const campo = evento.target as HTMLInputElement;
    const archivo = campo.files?.[0];
    this.errorFoto.set(null);
    if (!archivo) return;
    if (!FOTO_TIPOS.includes(archivo.type)) {
      this.errorFoto.set('La foto debe ser JPG, PNG o WebP.');
      campo.value = '';
      return;
    }
    if (archivo.size > FOTO_MAX_MB * 1024 * 1024) {
      this.errorFoto.set(`La foto pesa más de ${FOTO_MAX_MB} MB. Prueba con una más pequeña.`);
      campo.value = '';
      return;
    }
    this.liberarVistaPrevia();
    this.fotoNueva = archivo;
    this.vistaPrevia.set(URL.createObjectURL(archivo));
  }

  protected quitarFoto(campo: HTMLInputElement): void {
    this.liberarVistaPrevia();
    this.fotoNueva = null;
    this.vistaPrevia.set(null);
    campo.value = '';
  }

  protected async guardar(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      setTimeout(() => document.querySelector<HTMLElement>('form .ng-invalid')?.focus());
      return;
    }
    const v = this.form.getRawValue();
    this.guardando.set(true);
    this.error.set(null);
    let subida: string | null = null;
    try {
      // 1) Foto: la nueva se sube; si se quitó, queda en null; si no se tocó, se conserva.
      if (this.fotoNueva) subida = await this.servicio.subirFoto(this.fotoNueva);
      const foto = subida ?? (this.vistaPrevia() ? this.fotoGuardada : null);

      // 2) Proyecto.
      const id = await this.servicio.guardar(
        {
          titulo: v.titulo.trim(),
          area: v.area as Area,
          grado: v.grado as Grado,
          estado: v.estado,
          competencias: opcional(v.competencias),
          materiales: opcional(v.materiales),
          pasos: opcional(v.pasos),
          foto_url: foto,
        },
        this.id(),
      );

      // 3) La foto anterior ya no se usa: se borra del bucket (si falla, no importa).
      if (this.fotoGuardada && this.fotoGuardada !== foto) {
        await this.servicio.borrarFoto(this.fotoGuardada).catch(() => undefined);
      }
      await this.router.navigate(['/robotica', id]);
    } catch (e) {
      // Si la foto se subió pero el proyecto no se guardó, no se deja la foto suelta.
      if (subida) await this.servicio.borrarFoto(subida).catch(() => undefined);
      this.error.set(mensajeDeError(e));
      window.scrollTo({ top: 0 });
    } finally {
      this.guardando.set(false);
    }
  }

  protected invalido(campo: keyof typeof this.form.controls): boolean {
    const c = this.form.controls[campo];
    return c.touched && c.invalid;
  }

  private liberarVistaPrevia(): void {
    const url = this.vistaPrevia();
    if (url?.startsWith('blob:')) URL.revokeObjectURL(url);
  }
}
