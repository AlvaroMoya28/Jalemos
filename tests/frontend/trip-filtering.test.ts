// Input/output tests for the passenger-search filtering logic extracted from the
// Search screen (E0-4 / E0-10). Pure functions — no React needed.

const { tripsToVisibleRides, filterRides } = require('../../FrontEnd/utils/trip-filtering');

const NOW = new Date('2026-06-20T12:00:00Z');
const future = (mins: number) => new Date(NOW.getTime() + mins * 60_000).toISOString();

const baseTrip = (over: Record<string, any> = {}) => ({
  id: 't1',
  origin: 'San José',
  destination: 'Cartago',
  departureAt: future(60),
  rate: 1500,
  availableSeats: 3,
  driverId: 'driver-1',
  driverName: 'Carlos Mora',
  driverRating: 4.8,
  ...over,
});

describe('trip-filtering / tripsToVisibleRides', () => {
  const opts = { mode: 'passenger', userId: 'u1', bookings: [] as any[], now: NOW };

  it('returns [] for null/undefined trips', () => {
    expect(tripsToVisibleRides(null, opts)).toEqual([]);
    expect(tripsToVisibleRides(undefined, opts)).toEqual([]);
  });

  it('hides trips that already departed', () => {
    const result = tripsToVisibleRides([baseTrip({ departureAt: future(-5) })], opts);
    expect(result).toHaveLength(0);
  });

  it('hides the passenger\'s own trips (when browsing as passenger)', () => {
    const result = tripsToVisibleRides([baseTrip({ driverId: 'u1' })], opts);
    expect(result).toHaveLength(0);
  });

  it('hides full trips (no available seats) in passenger mode', () => {
    expect(tripsToVisibleRides([baseTrip({ availableSeats: 0 })], opts)).toHaveLength(0);
    expect(tripsToVisibleRides([baseTrip({ availableSeats: undefined })], opts)).toHaveLength(0);
  });

  it('hides trips the passenger already booked (non-cancelled)', () => {
    const bookings = [{ tripId: 't1', passengerId: 'u1', state: 'Confirmed' }];
    expect(tripsToVisibleRides([baseTrip()], { ...opts, bookings })).toHaveLength(0);
  });

  it('keeps a trip whose only booking by the user was cancelled', () => {
    const bookings = [{ tripId: 't1', passengerId: 'u1', state: 'Cancelled' }];
    expect(tripsToVisibleRides([baseTrip()], { ...opts, bookings })).toHaveLength(1);
  });

  it('maps a visible trip to the Ride shape', () => {
    const [ride] = tripsToVisibleRides([baseTrip()], opts);
    expect(ride.id).toBe('t1');
    expect(ride.from).toBe('San José');
    expect(ride.to).toBe('Cartago');
    expect(ride.price).toBe(1500);
    expect(ride.seats).toBe(3);
    expect(ride.driver).toBe('Carlos M.');
    expect(ride.avatar).toBe('CM');
    expect(ride.rating).toBe(4.8);
  });
});

describe('trip-filtering / filterRides', () => {
  const rides = [
    { id: '1', from: 'San José', to: 'Cartago' },
    { id: '2', from: 'Heredia', to: 'Alajuela' },
  ] as any[];

  it('returns all rides when no search has run', () => {
    expect(filterRides(rides, 'xyz', 'abc', false)).toHaveLength(2);
  });

  it('filters by origin substring (case-insensitive)', () => {
    const result = filterRides(rides, 'san', '', true);
    expect(result.map((r: any) => r.id)).toEqual(['1']);
  });

  it('filters by destination substring', () => {
    const result = filterRides(rides, '', 'alajuela', true);
    expect(result.map((r: any) => r.id)).toEqual(['2']);
  });

  it('empty from/to after searching matches everything', () => {
    expect(filterRides(rides, '   ', '  ', true)).toHaveLength(2);
  });
});
