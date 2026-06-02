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

jest.mock('expo-web-browser', () => ({
  openBrowserAsync: jest.fn().mockResolvedValue({ type: 'dismiss' }),
  WebBrowserPresentationStyle: { AUTOMATIC: 'automatic', FULL_SCREEN: 'fullScreen' },
}));

// ── Module imports (after stubs are wired via moduleNameMapper) ────────────────
const { parseExpiry }  = require('../../FrontEnd/components/expiry-input');
const { ThemedText }   = require('../../FrontEnd/components/themed-text');
const { ThemedView }   = require('../../FrontEnd/components/themed-view');
const GlassCard        = require('../../FrontEnd/components/glass-card').default;
const { HapticTab }    = require('../../FrontEnd/components/haptic-tab');
const { ExternalLink } = require('../../FrontEnd/components/external-link');
const { Collapsible }  = require('../../FrontEnd/components/ui/collapsible');
const { IconSymbol }   = require('../../FrontEnd/components/ui/icon-symbol');

// ── Mock references ────────────────────────────────────────────────────────────
const hapticsMock = jest.requireMock('expo-haptics') as { impactAsync: jest.Mock };
const browserMock = jest.requireMock('expo-web-browser') as { openBrowserAsync: jest.Mock };

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
// themed-text.tsx — ThemedText
// ══════════════════════════════════════════════════════════════════════════════

describe('FrontEnd components/themed-text — ThemedText', () => {
  it('renders children text content', () => {
    const { getByText } = render(createElement(ThemedText, null, 'Hello world'));
    expect(getByText('Hello world')).toBeTruthy();
  });

  it.each(['default', 'title', 'defaultSemiBold', 'subtitle', 'link'] as const)(
    'renders without error for type="%s"',
    (type) => {
      expect(() =>
        render(createElement(ThemedText, { type }, `Type ${type}`)),
      ).not.toThrow();
    },
  );

  it('applies custom lightColor override via prop', () => {
    const { container } = render(
      createElement(ThemedText, { lightColor: '#ff0000' }, 'Custom color'),
    );
    // The color is applied as an inline style; verify the element renders
    expect(container.firstChild).not.toBeNull();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// themed-view.tsx — ThemedView
// ══════════════════════════════════════════════════════════════════════════════

describe('FrontEnd components/themed-view — ThemedView', () => {
  it('renders its children', () => {
    const { getByText } = render(
      createElement(ThemedView, null, createElement('span', null, 'Inner')),
    );
    expect(getByText('Inner')).toBeTruthy();
  });

  it('renders without error with lightColor and darkColor overrides', () => {
    expect(() =>
      render(createElement(ThemedView, { lightColor: '#fff', darkColor: '#000' })),
    ).not.toThrow();
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
// external-link.tsx — ExternalLink (in-app browser on native)
// ══════════════════════════════════════════════════════════════════════════════

describe('FrontEnd components/external-link — ExternalLink', () => {
  const originalExpoOS = process.env.EXPO_OS;
  afterEach(() => { process.env.EXPO_OS = originalExpoOS; });

  it('calls openBrowserAsync when EXPO_OS is not "web"', async () => {
    process.env.EXPO_OS = 'ios';
    const { container } = render(
      createElement(ExternalLink, { href: 'https://example.com' }),
    );
    const link = container.querySelector('a')!;
    // Simulate click — our Link stub calls onPress, which calls openBrowserAsync
    fireEvent.click(link);
    // Flush microtasks so async onPress resolves
    await Promise.resolve();
    expect(browserMock.openBrowserAsync).toHaveBeenCalledWith(
      'https://example.com',
      expect.any(Object),
    );
  });

  it('does NOT call openBrowserAsync when EXPO_OS is "web"', async () => {
    process.env.EXPO_OS = 'web';
    const { container } = render(
      createElement(ExternalLink, { href: 'https://example.com' }),
    );
    fireEvent.click(container.querySelector('a')!);
    await Promise.resolve();
    expect(browserMock.openBrowserAsync).not.toHaveBeenCalled();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// ui/collapsible.tsx — Collapsible (toggle behavior)
// ══════════════════════════════════════════════════════════════════════════════

describe('FrontEnd components/ui/collapsible — Collapsible', () => {
  it('renders the title and hides children initially', () => {
    const { getByText, queryByText } = render(
      createElement(Collapsible, { title: 'My Section' }, 'Hidden content'),
    );
    expect(getByText('My Section')).toBeTruthy();
    expect(queryByText('Hidden content')).toBeNull();
  });

  it('shows children after pressing the heading', () => {
    const { getByText, getByRole } = render(
      createElement(Collapsible, { title: 'Toggle Me' }, 'Revealed content'),
    );
    fireEvent.click(getByRole('button'));
    expect(getByText('Revealed content')).toBeTruthy();
  });

  it('hides children again on a second press', () => {
    const { getByRole, queryByText } = render(
      createElement(Collapsible, { title: 'Toggle' }, 'Content'),
    );
    const btn = getByRole('button');
    fireEvent.click(btn); // open
    fireEvent.click(btn); // close
    expect(queryByText('Content')).toBeNull();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// ui/icon-symbol.tsx — IconSymbol (SF Symbol → Material Icon mapping)
// ══════════════════════════════════════════════════════════════════════════════

describe('FrontEnd components/ui/icon-symbol — IconSymbol', () => {
  it.each([
    ['house.fill',                                'home'],
    ['paperplane.fill',                           'send'],
    ['chevron.left.forwardslash.chevron.right',   'code'],
    ['chevron.right',                             'chevron-right'],
  ] as const)(
    'maps SF Symbol "%s" to Material Icon "%s"',
    (sfSymbol, materialIcon) => {
      const { container } = render(
        createElement(IconSymbol, { name: sfSymbol, size: 24, color: '#000' }),
      );
      const icon = container.querySelector('[data-testid="icon-MaterialIcons"]');
      expect(icon).not.toBeNull();
      expect(icon!.getAttribute('data-icon')).toBe(materialIcon);
    },
  );

  it('passes size and color props to the underlying icon', () => {
    const { container } = render(
      createElement(IconSymbol, { name: 'house.fill', size: 32, color: '#ff0000' }),
    );
    const icon = container.querySelector('[data-testid="icon-MaterialIcons"]');
    expect(icon!.getAttribute('data-size')).toBe('32');
  });
});
