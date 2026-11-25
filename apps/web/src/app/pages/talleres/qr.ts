import QRCode from 'qrcode';

/** Imagen (data URL) del código QR de un enlace, en el color oscuro del portal. */
export function crearQr(enlace: string): Promise<string> {
  return QRCode.toDataURL(enlace, { margin: 1, width: 640, color: { dark: '#0f172a', light: '#ffffff' } });
}
