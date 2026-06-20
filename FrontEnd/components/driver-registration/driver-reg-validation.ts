// Pure, framework-free validation + normalization for the driver registration
// form. Kept separate so the rules are unit-testable in isolation.

import { VEHICLE_MAKES } from '@/constants/vehicle-data';

export type PhotoSlot = { uri: string } | null;

/** Normalize a plate as the user types: ABC123 (3 letters + 3 digits) when it
 *  starts with a letter, or up to 6 digits when it starts with a number. */
export function normalizePlate(text: string): string {
  const cleaned = text.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!cleaned) return '';
  if (/[0-9]/.test(cleaned[0])) {
    return cleaned.replace(/[^0-9]/g, '').slice(0, 6);
  }
  let letters = '';
  let digits  = '';
  for (const ch of cleaned) {
    if (letters.length < 3 && /[A-Z]/.test(ch))                             { letters += ch; }
    else if (letters.length === 3 && digits.length < 3 && /[0-9]/.test(ch)) { digits  += ch; }
  }
  return letters + digits;
}

/** Build the "MM/YY" expiry string from stored month/year, or '' if missing. */
export function initExpiry(month?: number | null, year?: number | null): string {
  return month && year ? `${String(month).padStart(2, '0')}/${String(year).slice(-2)}` : '';
}

/** Whether `marca` is a free-text value not present in the known makes list. */
export function isCustomMake(marca: string): boolean {
  return marca !== '' && !VEHICLE_MAKES.includes(marca as typeof VEHICLE_MAKES[number]);
}

export interface DriverRegValues {
  cedula: string;
  address: string;
  facePhoto: PhotoSlot;
  marca: string;
  modelo: string;
  año: string;
  vehicleColor: string;
  placa: string;
  licenciaFront: PhotoSlot;
  licenciaBack: PhotoSlot;
  licenseExpiry: { month: number | null; year: number | null };
  dekraPhoto: PhotoSlot;
  dekraExpiry: { month: number | null; year: number | null };
}

export type DriverRegField = keyof ReturnType<typeof computeFieldErrors>;

/** Per-field validity (true = invalid/missing). Pure function of the inputs. */
export function computeFieldErrors(v: DriverRegValues) {
  return {
    cedula:        !v.cedula.trim(),
    address:       !v.address.trim(),
    facePhoto:     !v.facePhoto,
    marca:         !v.marca.trim(),
    modelo:        !v.modelo.trim(),
    año:           !v.año,
    vehicleColor:  !v.vehicleColor.trim(),
    placa:         v.placa.length !== 6,
    licenciaFront: !v.licenciaFront,
    licenciaBack:  !v.licenciaBack,
    licenseExpiry: !v.licenseExpiry.month || !v.licenseExpiry.year,
    dekraPhoto:    !v.dekraPhoto,
    dekraExpiry:   !v.dekraExpiry.month || !v.dekraExpiry.year,
  };
}

const FIELD_LABELS: Record<DriverRegField, string> = {
  cedula:        'Número de cédula',
  address:       'Dirección de domicilio',
  facePhoto:     'Foto de perfil',
  marca:         'Marca del vehículo',
  modelo:        'Modelo del vehículo',
  año:           'Año del vehículo',
  vehicleColor:  'Color del vehículo',
  placa:         'Placa (formato ABC123 o 123456)',
  licenciaFront: 'Foto frontal de licencia',
  licenciaBack:  'Foto trasera de licencia',
  licenseExpiry: 'Fecha de vencimiento de licencia',
  dekraPhoto:    'Foto de revisión técnica Dekra',
  dekraExpiry:   'Fecha de vencimiento Dekra',
};

/** Human-readable labels of the fields still missing, in form order. */
export function collectMissing(errors: ReturnType<typeof computeFieldErrors>): string[] {
  return (Object.keys(FIELD_LABELS) as DriverRegField[])
    .filter((field) => errors[field])
    .map((field) => FIELD_LABELS[field]);
}
