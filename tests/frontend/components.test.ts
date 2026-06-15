/**
 * @jest-environment jsdom
 */

import { createElement } from 'react';
import { fireEvent, render } from '@testing-library/react';

// ── Explicit mocks (hoisted before imports) ────────────────────────────────────
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn().mockResolvedValue(undefined),
  ImpactFeedbackStyle: { Light: 'Light', Medium: 'Medium', Heavy: 'Heavy' },
}));

// NotificationsModal reads from the global notifications context; inject controlled
// state so we can assert how real data is rendered (E1-4).
let mockNotifState: any;
jest.mock('@/contexts/notifications', () => ({
  useNotifications: () => mockNotifState,
}));

// ── Module imports (after stubs are wired via moduleNameMapper) ────────────────
const { parseExpiry }  = require('../../FrontEnd/components/expiry-input');
const GlassCard        = require('../../FrontEnd/components/glass-card').default;
const { HapticTab }    = require('../../FrontEnd/components/haptic-tab');

// ── Mock references ────────────────────────────────────────────────────────────
const hapticsMock = jest.requireMock('expo-haptics') as { impactAsync: jest.Mock };

// ══════════════════════════════════════════════════════════════════════════════
// expiry-input.tsx — parseExpiry (exported pure function)
// ══════════════════════════════════════════════════════════════════════════════

describe('FrontEnd components/expiry-input — parseExpiry', () => {
  it('returns nulls for an empty string', () => {
    expect(parseExpiry('')).toEqual({ month: null, year: null });
  });

  it('returns nulls when there is no slash', () => {
    expect(parseExpiry('1226')).toEqual({ month: null, year: null });
  });

  it('returns nulls when the year part has fewer than 2 digits', () => {
    expect(parseExpiry('12/2')).toEqual({ month: null, year: null });
  });

  it('parses a valid "01/25" into month=1, year=2025', () => {
    expect(parseExpiry('01/25')).toEqual({ month: 1, year: 2025 });
  });

  it('parses a valid "12/30" into month=12, year=2030', () => {
    expect(parseExpiry('12/30')).toEqual({ month: 12, year: 2030 });
  });

  it('returns nulls for month 13 (out of range)', () => {
    expect(parseExpiry('13/26')).toEqual({ month: null, year: null });
  });

  it('returns nulls for month 0 (out of range)', () => {
    expect(parseExpiry('00/26')).toEqual({ month: null, year: null });
  });

  it('returns nulls for NaN month (non-numeric)', () => {
    expect(parseExpiry('mm/yy')).toEqual({ month: null, year: null });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// glass-card.tsx — GlassCard (opacity formulas)
// ══════════════════════════════════════════════════════════════════════════════

describe('FrontEnd components/glass-card — GlassCard', () => {
  it('renders its children', () => {
    const { getByText } = render(
      createElement(GlassCard, null, createElement('span', null, 'Card content')),
    );
    expect(getByText('Card content')).toBeTruthy();
  });

  it('renders without error at intensity=0', () => {
    expect(() =>
      render(createElement(GlassCard, { intensity: 0 }, 'zero')),
    ).not.toThrow();
  });

  it('renders without error at intensity=100 (opacity capped)', () => {
    // surface: min(0.2 + 100/180, 0.55) = 0.55  — capped
    // highlight: min(0.14 + 100/320, 0.3) = 0.3  — capped
    expect(() =>
      render(createElement(GlassCard, { intensity: 100 }, 'max')),
    ).not.toThrow();
  });

  it('surface opacity formula: min(0.2 + intensity/180, 0.55)', () => {
    const surface = (intensity: number) => Math.min(0.2 + intensity / 180, 0.55);
    expect(surface(0)).toBeCloseTo(0.2);
    expect(surface(36)).toBeCloseTo(0.4);
    expect(surface(100)).toBe(0.55); // capped
  });

  it('highlight opacity formula: min(0.14 + intensity/320, 0.3)', () => {
    const highlight = (intensity: number) => Math.min(0.14 + intensity / 320, 0.3);
    expect(highlight(0)).toBeCloseTo(0.14);
    expect(highlight(36)).toBeCloseTo(0.2525);
    expect(highlight(100)).toBe(0.3); // capped
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// haptic-tab.tsx — HapticTab (iOS-only haptics via EXPO_OS)
// ══════════════════════════════════════════════════════════════════════════════

describe('FrontEnd components/haptic-tab — HapticTab', () => {
  const originalExpoOS = process.env.EXPO_OS;
  afterEach(() => { process.env.EXPO_OS = originalExpoOS; });

  it('fires impactAsync when EXPO_OS is ios', () => {
    process.env.EXPO_OS = 'ios';
    const { container } = render(createElement(HapticTab, {}));
    fireEvent.click(container.querySelector('button')!);
    expect(hapticsMock.impactAsync).toHaveBeenCalledTimes(1);
  });

  it('does NOT fire impactAsync when EXPO_OS is android', () => {
    process.env.EXPO_OS = 'android';
    const { container } = render(createElement(HapticTab, {}));
    fireEvent.click(container.querySelector('button')!);
    expect(hapticsMock.impactAsync).not.toHaveBeenCalled();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// expiry-input.tsx — format function (via component render + onChangeText)
// ══════════════════════════════════════════════════════════════════════════════

describe('FrontEnd components/expiry-input — format function via component', () => {
  const ExpiryInput = require('../../FrontEnd/components/expiry-input').default;

  it('renders without error', () => {
    const cb = jest.fn();
    expect(() => render(createElement(ExpiryInput, { value: '', onChangeText: cb }))).not.toThrow();
  });

  it('passes through 1-2 raw digits unchanged', () => {
    const cb = jest.fn();
    const { container } = render(createElement(ExpiryInput, { value: '', onChangeText: cb }));
    const input = container.querySelector('input')!;

    fireEvent.change(input, { target: { value: '1' } });
    expect(cb).toHaveBeenLastCalledWith('1');

    fireEvent.change(input, { target: { value: '12' } });
    expect(cb).toHaveBeenLastCalledWith('12');
  });

  it('auto-inserts "/" after 2 digits', () => {
    const cb = jest.fn();
    const { container } = render(createElement(ExpiryInput, { value: '', onChangeText: cb }));
    const input = container.querySelector('input')!;

    fireEvent.change(input, { target: { value: '123' } });
    expect(cb).toHaveBeenLastCalledWith('12/3');
  });

  it('formats a complete 4-digit entry as MM/YY', () => {
    const cb = jest.fn();
    const { container } = render(createElement(ExpiryInput, { value: '', onChangeText: cb }));
    const input = container.querySelector('input')!;

    fireEvent.change(input, { target: { value: '1226' } });
    expect(cb).toHaveBeenLastCalledWith('12/26');
  });

  it('strips non-digit characters from input', () => {
    const cb = jest.fn();
    const { container } = render(createElement(ExpiryInput, { value: '', onChangeText: cb }));
    const input = container.querySelector('input')!;

    fireEvent.change(input, { target: { value: '12/a6' } });
    expect(cb).toHaveBeenLastCalledWith('12/6');
  });

  it('caps output at 5 characters (4 digits + slash)', () => {
    const cb = jest.fn();
    const { container } = render(createElement(ExpiryInput, { value: '', onChangeText: cb }));
    const input = container.querySelector('input')!;

    fireEvent.change(input, { target: { value: '12345' } });
    expect(cb).toHaveBeenLastCalledWith('12/34');
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// animated-pressable.tsx — onPressIn / onPressOut handlers
// ══════════════════════════════════════════════════════════════════════════════

describe('FrontEnd components/animated-pressable — press handlers', () => {
  const AnimatedPressable = require('../../FrontEnd/components/animated-pressable').default;
  const { withTiming } = require('react-native-reanimated');

  beforeEach(() => { (withTiming as jest.Mock).mockClear(); });

  it('fires onPressIn with pressedScale when mouse is pressed down', () => {
    const { container } = render(
      createElement(AnimatedPressable, { pressedScale: 0.95 }, createElement('span', null, 'x')),
    );
    fireEvent.mouseDown(container.querySelector('button')!);
    expect((withTiming as jest.Mock)).toHaveBeenCalledWith(0.95, expect.objectContaining({ duration: 110 }));
  });

  it('fires onPressOut back to scale 1 on mouse up', () => {
    const { container } = render(
      createElement(AnimatedPressable, { pressedScale: 0.95 }, createElement('span', null, 'x')),
    );
    fireEvent.mouseUp(container.querySelector('button')!);
    expect((withTiming as jest.Mock)).toHaveBeenCalledWith(1, expect.objectContaining({ duration: 150 }));
  });

  it('forwards custom onPressIn callback', () => {
    const onPressIn = jest.fn();
    const { container } = render(
      createElement(AnimatedPressable, { onPressIn }, createElement('span', null, 'x')),
    );
    fireEvent.mouseDown(container.querySelector('button')!);
    expect(onPressIn).toHaveBeenCalledTimes(1);
  });

  it('forwards custom onPressOut callback', () => {
    const onPressOut = jest.fn();
    const { container } = render(
      createElement(AnimatedPressable, { onPressOut }, createElement('span', null, 'x')),
    );
    fireEvent.mouseUp(container.querySelector('button')!);
    expect(onPressOut).toHaveBeenCalledTimes(1);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// RideCard.tsx — ride card display and seat label logic
// ══════════════════════════════════════════════════════════════════════════════

describe('FrontEnd components/RideCard — RideCard', () => {
  const RideCard = require('../../FrontEnd/components/RideCard').default;

  const makeRide = (overrides = {}) => ({
    id: 'r1',
    from: 'San José',
    to: 'Heredia',
    date: 'Hoy',
    time: '5:30 PM',
    price: 1500,
    seats: 3,
    driver: 'Carlos M.',
    rating: 4.8,
    avatar: 'CM',
    ...overrides,
  });

  it('renders origin and destination', () => {
    const { getByText } = render(createElement(RideCard, { ride: makeRide() }));
    expect(getByText('San José')).toBeTruthy();
    expect(getByText('Heredia')).toBeTruthy();
  });

  it('renders driver name and rating', () => {
    const { getByText } = render(createElement(RideCard, { ride: makeRide() }));
    expect(getByText('Carlos M.')).toBeTruthy();
    expect(getByText('4.8')).toBeTruthy();
  });

  it('renders avatar initials', () => {
    const { getByText } = render(createElement(RideCard, { ride: makeRide({ avatar: 'CM' }) }));
    expect(getByText('CM')).toBeTruthy();
  });

  it('renders date and time', () => {
    const { getByText } = render(createElement(RideCard, { ride: makeRide() }));
    expect(getByText('Hoy · 5:30 PM')).toBeTruthy();
  });

  it('shows "lugares disponibles" in search mode (default)', () => {
    const { getByText } = render(createElement(RideCard, { ride: makeRide({ seats: 3 }) }));
    expect(getByText('3 lugares disponibles')).toBeTruthy();
  });

  it('shows singular "lugar disponible" for 1 seat in search mode', () => {
    const { getByText } = render(createElement(RideCard, { ride: makeRide({ seats: 1 }) }));
    expect(getByText('1 lugar disponible')).toBeTruthy();
  });

  it('shows "lugares reservados" in my-rides mode', () => {
    const { getByText } = render(
      createElement(RideCard, { ride: makeRide({ seats: 2 }), mode: 'my-rides' }),
    );
    expect(getByText('2 lugares reservados')).toBeTruthy();
  });

  it('shows singular "lugar reservado" for 1 seat in my-rides mode', () => {
    const { getByText } = render(
      createElement(RideCard, { ride: makeRide({ seats: 1 }), mode: 'my-rides' }),
    );
    expect(getByText('1 lugar reservado')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { container } = render(createElement(RideCard, { ride: makeRide(), onPress }));
    fireEvent.click(container.querySelector('button')!);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders without error when onPress is omitted', () => {
    expect(() => render(createElement(RideCard, { ride: makeRide() }))).not.toThrow();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// NotificationsModal.tsx — notification list display
// ══════════════════════════════════════════════════════════════════════════════

describe('FrontEnd components/NotificationsModal — NotificationsModal', () => {
  const NotificationsModal = require('../../FrontEnd/components/NotificationsModal').default;

  // Builds a notifications-context value with sensible defaults for each test.
  const makeState = (over: Partial<any> = {}) => ({
    items: [],
    unreadCount: 0,
    isLoading: false,
    refresh: jest.fn(),
    markRead: jest.fn(),
    markAllRead: jest.fn(),
    clearAll: jest.fn(),
    ...over,
  });

  const sampleItems = [
    { id: 'a', type: 'booking_received', title: 'Reservaron un espacio', body: 'San José → Cartago', tripId: 't1', bookingId: 'b1', read: false, createdAt: new Date().toISOString() },
    { id: 'b', type: 'admin_broadcast', title: 'Promo Pura Vida', body: '20% OFF', tripId: null, bookingId: null, read: true, createdAt: new Date().toISOString() },
  ];

  beforeEach(() => {
    mockNotifState = makeState();
  });

  it('renders without error when visible / hidden', () => {
    expect(() => render(createElement(NotificationsModal, { visible: true, onClose: jest.fn() }))).not.toThrow();
    expect(() => render(createElement(NotificationsModal, { visible: false, onClose: jest.fn() }))).not.toThrow();
  });

  it('shows the section heading', () => {
    const { getByText } = render(createElement(NotificationsModal, { visible: true, onClose: jest.fn() }));
    expect(getByText('Notificaciones')).toBeTruthy();
  });

  it('shows the empty state when there are no notifications', () => {
    const { getByText } = render(createElement(NotificationsModal, { visible: true, onClose: jest.fn() }));
    expect(getByText('Sin notificaciones')).toBeTruthy();
  });

  it('renders titles and bodies from the provider data', () => {
    mockNotifState = makeState({ items: sampleItems, unreadCount: 1 });
    const { getByText } = render(createElement(NotificationsModal, { visible: true, onClose: jest.fn() }));
    expect(getByText('Reservaron un espacio')).toBeTruthy();
    expect(getByText('San José → Cartago')).toBeTruthy();
    expect(getByText('Promo Pura Vida')).toBeTruthy();
  });

  it('shows the unread count and the mark-all CTA only when there are unread', () => {
    mockNotifState = makeState({ items: sampleItems, unreadCount: 2 });
    const withUnread = render(createElement(NotificationsModal, { visible: true, onClose: jest.fn() }));
    expect(withUnread.getByText('(2)')).toBeTruthy();
    expect(withUnread.getByText('Marcar todas como leídas')).toBeTruthy();
    withUnread.unmount();

    mockNotifState = makeState({ items: sampleItems, unreadCount: 0 });
    const noUnread = render(createElement(NotificationsModal, { visible: true, onClose: jest.fn() }));
    expect(noUnread.queryByText('Marcar todas como leídas')).toBeNull();
  });

  it('invokes markAllRead when the CTA is pressed', () => {
    const markAllRead = jest.fn();
    mockNotifState = makeState({ items: sampleItems, unreadCount: 2, markAllRead });
    const { getByText } = render(createElement(NotificationsModal, { visible: true, onClose: jest.fn() }));
    fireEvent.click(getByText('Marcar todas como leídas'));
    expect(markAllRead).toHaveBeenCalledTimes(1);
  });

  it('refreshes the feed when opened', () => {
    const refresh = jest.fn();
    mockNotifState = makeState({ refresh });
    render(createElement(NotificationsModal, { visible: true, onClose: jest.fn() }));
    expect(refresh).toHaveBeenCalled();
  });

  it('calls onClose when the close button is pressed', () => {
    const onClose = jest.fn();
    const { getAllByRole } = render(createElement(NotificationsModal, { visible: true, onClose }));
    fireEvent.click(getAllByRole('button')[0]);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Additional component smoke tests
// ══════════════════════════════════════════════════════════════════════════════

describe('FrontEnd components — smoke tests', () => {
  it('animated-pressable renders without error', () => {
    const AnimatedPressable = require('../../FrontEnd/components/animated-pressable').default;
    expect(() =>
      render(createElement(AnimatedPressable, { onPress: jest.fn() }, createElement('span', null, 'Press me'))),
    ).not.toThrow();
  });

  it('page-loader renders without error when visible', () => {
    const PageLoader = require('../../FrontEnd/components/page-loader').default;
    expect(() => render(createElement(PageLoader, { visible: true, label: 'Cargando...' }))).not.toThrow();
  });

  it('page-loader renders without error when hidden', () => {
    const PageLoader = require('../../FrontEnd/components/page-loader').default;
    expect(() => render(createElement(PageLoader, { visible: false }))).not.toThrow();
  });

});

// ══════════════════════════════════════════════════════════════════════════════
// map-modal.web.tsx — InteractiveMapModal (web fallback)
// ══════════════════════════════════════════════════════════════════════════════

describe('FrontEnd components/map-modal.web — web map modal', () => {
  const mockRide = {
    id: 'ride-0',
    from: 'San José', to: 'Heredia',
    fromCoords: { lat: 9.9281, lng: -84.0907 },
    toCoords: { lat: 9.9987, lng: -84.1223 },
    date: 'Hoy', time: '5:30 PM',
    price: 1500, totalSeats: 4, availableSeats: 3,
    driver: {
      id: 'driver-0', fullName: 'Carlos M.', avatar: 'CM', rating: 4.8,
      ratingsCount: 47, tripsCompleted: 52, memberSince: 'Enero 2024',
      vehicle: 'Toyota Yaris', plate: 'CR-1234', verified: true, reviews: [],
    },
  };

  it('renders without error when visible with valid coords', () => {
    const MapModal = require('../../FrontEnd/components/map-modal.web').default;
    expect(() =>
      render(createElement(MapModal, { visible: true, onClose: jest.fn(), ride: mockRide, polyline: null })),
    ).not.toThrow();
  });

  it('renders without error when visible with no coords', () => {
    const MapModal = require('../../FrontEnd/components/map-modal.web').default;
    const rideNoCoords = { ...mockRide, fromCoords: undefined, toCoords: undefined };
    expect(() =>
      render(createElement(MapModal, { visible: true, onClose: jest.fn(), ride: rideNoCoords, polyline: null })),
    ).not.toThrow();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// place-search-input.tsx — PlaceSearchInput
// ══════════════════════════════════════════════════════════════════════════════

describe('FrontEnd components/place-search-input — PlaceSearchInput', () => {
  const PlaceSearchInput = require('../../FrontEnd/components/place-search-input').default;

  const defaultProps = {
    value: '',
    onChangeText: jest.fn(),
    onSelect: jest.fn(),
  };

  it('renders without error', () => {
    expect(() => render(createElement(PlaceSearchInput, defaultProps))).not.toThrow();
  });

  it('renders the text input', () => {
    const { container } = render(createElement(PlaceSearchInput, defaultProps));
    expect(container.querySelector('input')).not.toBeNull();
  });

  it('calls onChangeText when input value changes', () => {
    const onChangeText = jest.fn();
    const { container } = render(
      createElement(PlaceSearchInput, { ...defaultProps, onChangeText }),
    );
    fireEvent.change(container.querySelector('input')!, { target: { value: 'San José' } });
    expect(onChangeText).toHaveBeenCalledWith('San José');
  });

  it('shows a clear button when value is non-empty', () => {
    const { container } = render(
      createElement(PlaceSearchInput, { ...defaultProps, value: 'Heredia' }),
    );
    expect(container.querySelectorAll('button').length).toBeGreaterThan(0);
  });

  it('calls onChangeText with empty string when clear button is clicked', () => {
    const onChangeText = jest.fn();
    const { container } = render(
      createElement(PlaceSearchInput, { ...defaultProps, value: 'Heredia', onChangeText }),
    );
    fireEvent.click(container.querySelectorAll('button')[0]);
    expect(onChangeText).toHaveBeenCalledWith('');
  });

  it('renders a leading icon when provided', () => {
    const { container } = render(
      createElement(PlaceSearchInput, {
        ...defaultProps,
        leadingIcon: createElement('span', { 'data-testid': 'lead-icon' }),
      }),
    );
    expect(container.querySelector('[data-testid="lead-icon"]')).not.toBeNull();
  });

  it('renders with placeholder text', () => {
    const { container } = render(
      createElement(PlaceSearchInput, { ...defaultProps, placeholder: 'Buscar lugar...' }),
    );
    expect(container.querySelector('input')!.getAttribute('placeholder')).toBe('Buscar lugar...');
  });

  it('does not show a clear button when value is empty', () => {
    const { container } = render(
      createElement(PlaceSearchInput, { ...defaultProps, value: '' }),
    );
    expect(container.querySelectorAll('button').length).toBe(0);
  });
});
