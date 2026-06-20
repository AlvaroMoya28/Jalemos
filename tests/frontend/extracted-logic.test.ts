/**
 * Input/output tests for the pure validation/format helpers extracted from the
 * large screens — offer-form validation, driver-registration field rules, the
 * shared date formatter, and the passenger cancellation-notice policy.
 */

const { validateOfferForm } = require('../../FrontEnd/hooks/use-offer-form');
const {
  normalizePlate, initExpiry, isCustomMake, computeFieldErrors, collectMissing,
} = require('../../FrontEnd/components/driver-registration/driver-reg-validation');
const { formatShortDate } = require('../../FrontEnd/utils/format');
const { buildCancelBody } = require('../../FrontEnd/hooks/use-passenger-trip-alerts');
const { VEHICLE_MAKES } = require('../../FrontEnd/constants/vehicle-data');

// ══════════════════════════════════════════════════════════════════════════════
// use-offer-form — validateOfferForm (publish-trip rules, pure with injectable now)
// ══════════════════════════════════════════════════════════════════════════════

describe('validateOfferForm', () => {
  const NOW = 1_700_000_000_000;
  const valid = () => ({
    from: 'San José',
    to: 'Heredia',
    selectedDate: new Date(NOW + 10 * 60_000), // 10 min ahead
    vehicleId: 'veh-1',
    userId: 'user-1',
    fromCoords: { lat: 9.93, lng: -84.08 },
    toCoords: { lat: 9.99, lng: -84.12 },
  });

  it('returns null when every field is valid', () => {
    expect(validateOfferForm(valid(), NOW)).toBeNull();
  });

  it('flags incomplete fields when origin/destination/date missing', () => {
    expect(validateOfferForm({ ...valid(), from: '' }, NOW)?.title).toBe('Campos incompletos');
    expect(validateOfferForm({ ...valid(), to: '' }, NOW)?.title).toBe('Campos incompletos');
    expect(validateOfferForm({ ...valid(), selectedDate: null }, NOW)?.title).toBe('Campos incompletos');
  });

  it('rejects a departure under 5 minutes away', () => {
    const tooSoon = { ...valid(), selectedDate: new Date(NOW + 2 * 60_000) };
    expect(validateOfferForm(tooSoon, NOW)?.title).toBe('Hora muy próxima');
  });

  it('accepts a departure exactly 5 minutes away', () => {
    const edge = { ...valid(), selectedDate: new Date(NOW + 5 * 60_000) };
    expect(validateOfferForm(edge, NOW)).toBeNull();
  });

  it('requires a vehicle, a user, and both coordinates — in priority order', () => {
    expect(validateOfferForm({ ...valid(), vehicleId: null }, NOW)?.title).toBe('Sin vehículo');
    expect(validateOfferForm({ ...valid(), userId: undefined }, NOW)?.title).toBe('Sesión expirada');
    expect(validateOfferForm({ ...valid(), fromCoords: null }, NOW)?.title).toBe('Origen sin coordenadas');
    expect(validateOfferForm({ ...valid(), toCoords: null }, NOW)?.title).toBe('Destino sin coordenadas');
  });

  it('reports the missing-fields error before the coordinates error', () => {
    // Both date and coords invalid → the earlier rule (fields) wins.
    const broken = { ...valid(), selectedDate: null, toCoords: null };
    expect(validateOfferForm(broken, NOW)?.title).toBe('Campos incompletos');
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// driver-reg-validation — normalizePlate
// ══════════════════════════════════════════════════════════════════════════════

describe('normalizePlate', () => {
  it('upper-cases and keeps the ABC123 shape', () => {
    expect(normalizePlate('abc123')).toBe('ABC123');
  });

  it('caps a letter-prefixed plate at 3 letters + 3 digits', () => {
    expect(normalizePlate('ABCD12345')).toBe('ABC123');
  });

  it('treats a digit-prefixed plate as up to 6 digits', () => {
    expect(normalizePlate('123456')).toBe('123456');
    expect(normalizePlate('1234567')).toBe('123456');
  });

  it('strips separators and symbols', () => {
    expect(normalizePlate('AB C-12 3')).toBe('ABC123');
  });

  it('returns empty string for empty or symbol-only input', () => {
    expect(normalizePlate('')).toBe('');
    expect(normalizePlate('---')).toBe('');
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// driver-reg-validation — initExpiry & isCustomMake
// ══════════════════════════════════════════════════════════════════════════════

describe('initExpiry', () => {
  it('formats month/year as MM/YY', () => {
    expect(initExpiry(12, 2026)).toBe('12/26');
    expect(initExpiry(1, 2025)).toBe('01/25');
  });

  it('returns empty string when month or year is missing', () => {
    expect(initExpiry(null, 2026)).toBe('');
    expect(initExpiry(5, null)).toBe('');
    expect(initExpiry()).toBe('');
  });
});

describe('isCustomMake', () => {
  it('is false for an empty value', () => {
    expect(isCustomMake('')).toBe(false);
  });

  it('is false for a known make and true for a free-text one', () => {
    expect(isCustomMake(VEHICLE_MAKES[0])).toBe(false);
    expect(isCustomMake('Marca Inventada ZZ')).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// driver-reg-validation — computeFieldErrors & collectMissing
// ══════════════════════════════════════════════════════════════════════════════

describe('computeFieldErrors / collectMissing', () => {
  const validValues = () => ({
    cedula: '123456789',
    address: 'Calle 1, San José',
    facePhoto: { uri: 'face' },
    marca: 'Toyota',
    modelo: 'Yaris',
    año: '2020',
    vehicleColor: 'Rojo',
    placa: 'ABC123',
    licenciaFront: { uri: 'front' },
    licenciaBack: { uri: 'back' },
    licenseExpiry: { month: 12, year: 2030 },
    dekraPhoto: { uri: 'dekra' },
    dekraExpiry: { month: 6, year: 2030 },
  });

  it('reports no errors for fully valid values', () => {
    const errors = computeFieldErrors(validValues());
    expect(Object.values(errors).every((e) => e === false)).toBe(true);
    expect(collectMissing(errors)).toEqual([]);
  });

  it('flags a plate that is not exactly 6 characters', () => {
    expect(computeFieldErrors({ ...validValues(), placa: 'ABC12' }).placa).toBe(true);
    expect(computeFieldErrors({ ...validValues(), placa: 'ABC123' }).placa).toBe(false);
  });

  it('flags missing photos and blank text fields', () => {
    const errors = computeFieldErrors({ ...validValues(), facePhoto: null, cedula: '   ', vehicleColor: '' });
    expect(errors.facePhoto).toBe(true);
    expect(errors.cedula).toBe(true);
    expect(errors.vehicleColor).toBe(true);
  });

  it('flags an incomplete expiry (month or year null)', () => {
    expect(computeFieldErrors({ ...validValues(), licenseExpiry: { month: null, year: 2030 } }).licenseExpiry).toBe(true);
    expect(computeFieldErrors({ ...validValues(), dekraExpiry: { month: 6, year: null } }).dekraExpiry).toBe(true);
  });

  it('collectMissing lists every invalid field in form order with human labels', () => {
    const allInvalid = {
      cedula: '', address: '', facePhoto: null, marca: '', modelo: '', año: '', vehicleColor: '', placa: '',
      licenciaFront: null, licenciaBack: null, licenseExpiry: { month: null, year: null },
      dekraPhoto: null, dekraExpiry: { month: null, year: null },
    };
    const missing = collectMissing(computeFieldErrors(allInvalid));
    expect(missing).toHaveLength(13);
    expect(missing[0]).toBe('Número de cédula');
    expect(missing).toContain('Placa (formato ABC123 o 123456)');
    expect(missing[missing.length - 1]).toBe('Fecha de vencimiento Dekra');
  });

  it('collectMissing returns only the fields that are actually missing', () => {
    const errors = computeFieldErrors({ ...validValues(), modelo: '', placa: '12' });
    expect(collectMissing(errors)).toEqual(['Modelo del vehículo', 'Placa (formato ABC123 o 123456)']);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// utils/format — formatShortDate
// ══════════════════════════════════════════════════════════════════════════════

describe('formatShortDate', () => {
  it('renders a non-empty localized string containing the year', () => {
    const out = formatShortDate('2026-06-19T12:00:00.000Z');
    expect(typeof out).toBe('string');
    expect(out).toMatch(/2026/);
  });

  it('is deterministic for the same input', () => {
    const iso = '2025-01-05T12:00:00.000Z';
    expect(formatShortDate(iso)).toBe(formatShortDate(iso));
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// use-passenger-trip-alerts — buildCancelBody (cancellation / late-cancel policy)
// ══════════════════════════════════════════════════════════════════════════════

describe('buildCancelBody', () => {
  const base = { cancelReason: null, cancelDetails: null, isLateCancellation: false };

  it('uses the base message with no reason/details', () => {
    expect(buildCancelBody(base)).toBe('Tu conductor canceló el viaje.');
  });

  it('appends a known reason label', () => {
    expect(buildCancelBody({ ...base, cancelReason: 'traffic_problem' })).toContain('Problema de tránsito');
  });

  it('falls back to the raw reason when unknown', () => {
    expect(buildCancelBody({ ...base, cancelReason: 'weird_reason' })).toContain('weird_reason');
  });

  it('includes the quoted free-text details', () => {
    expect(buildCancelBody({ ...base, cancelDetails: 'Se dañó el carro' })).toContain('"Se dañó el carro"');
  });

  it('adds the rating invitation only for a late cancellation', () => {
    expect(buildCancelBody({ ...base, isLateCancellation: true })).toContain('calificarlo');
    expect(buildCancelBody(base)).not.toContain('calificarlo');
  });
});
