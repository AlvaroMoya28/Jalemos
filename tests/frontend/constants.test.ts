// Node environment — no jsdom needed (pure data and pure functions).
// react-native is redirected to __stubs__/react-native.js via moduleNameMapper.

// ── Imports ────────────────────────────────────────────────────────────────────
const { withElevation, Colors, Brand, Fonts } = require('../../FrontEnd/constants/theme');
const { REVIEW_ISSUES, SEED_APPLICATIONS }    = require('../../FrontEnd/constants/mock-applications');
const { SEED_USERS }                          = require('../../FrontEnd/constants/mock-users');
const { REPORT_REASON_LABELS, SEED_REPORTS }  = require('../../FrontEnd/constants/mock-reports');
const { DETAILED_RIDES }                      = require('../../FrontEnd/constants/mock-rides');

// ══════════════════════════════════════════════════════════════════════════════
// theme.ts
// ══════════════════════════════════════════════════════════════════════════════

describe('FrontEnd constants/theme', () => {

  describe('withElevation', () => {
    it.each([100, 200, 400, 600, 800] as const)(
      'level %i returns a complete shadow object',
      (level) => {
        const shadow = withElevation(level);
        expect(shadow).toMatchObject({
          shadowColor: expect.any(String),
          shadowOffset: { width: 0, height: expect.any(Number) },
          shadowRadius: expect.any(Number),
          shadowOpacity: expect.any(Number),
          elevation: expect.any(Number),
        });
      },
    );

    it('higher levels cast a more prominent shadow (larger elevation value)', () => {
      const e100 = withElevation(100);
      const e800 = withElevation(800);
      expect(e800.elevation).toBeGreaterThan(e100.elevation);
      expect(e800.shadowRadius).toBeGreaterThan(e100.shadowRadius);
    });

    it('includes shadowColor from Brand.colors.shadow', () => {
      const shadow = withElevation(200);
      expect(shadow.shadowColor).toBe(Brand.colors.shadow);
    });

    it('each level returns a distinct elevation value', () => {
      const elevationValues = ([100, 200, 400, 600, 800] as const).map(
        (l) => withElevation(l).elevation,
      );
      const unique = new Set(elevationValues);
      expect(unique.size).toBe(5);
    });
  });

  describe('Colors', () => {
    it('has both light and dark themes', () => {
      expect(Colors).toHaveProperty('light');
      expect(Colors).toHaveProperty('dark');
    });

    it('light and dark themes have exactly the same keys', () => {
      const lightKeys = Object.keys(Colors.light).sort();
      const darkKeys  = Object.keys(Colors.dark).sort();
      expect(lightKeys).toEqual(darkKeys);
    });

    it('required semantic tokens exist in light theme', () => {
      const required = ['text', 'background', 'tint', 'icon', 'screenBg', 'surface'];
      required.forEach((key) => expect(Colors.light).toHaveProperty(key));
    });

    it('required semantic tokens exist in dark theme', () => {
      const required = ['text', 'background', 'tint', 'icon', 'screenBg', 'surface'];
      required.forEach((key) => expect(Colors.dark).toHaveProperty(key));
    });

    it('all color values are non-empty strings', () => {
      [...Object.values(Colors.light), ...Object.values(Colors.dark)].forEach((val) => {
        expect(typeof val).toBe('string');
        expect((val as string).length).toBeGreaterThan(0);
      });
    });
  });

  describe('Brand', () => {
    it('exposes the four main color palettes', () => {
      expect(Brand.colors).toHaveProperty('green');
      expect(Brand.colors).toHaveProperty('blue');
      expect(Brand.colors).toHaveProperty('yellow');
      expect(Brand.colors).toHaveProperty('black');
    });

    it('green.normal is a valid hex color', () => {
      expect(Brand.colors.green.normal).toMatch(/^#[0-9a-fA-F]{6}$/);
    });

    it('spacing tokens are all positive numbers', () => {
      Object.values(Brand.spacing as Record<string, number>).forEach((val) => {
        expect(val).toBeGreaterThan(0);
      });
    });

    it('button sizes have positive height values', () => {
      Object.values(Brand.buttonSizes as Record<string, { height: number }>).forEach(({ height }) => {
        expect(height).toBeGreaterThan(0);
      });
    });
  });

  describe('Fonts', () => {
    it('exports an object with font family keys', () => {
      expect(Fonts).toHaveProperty('sans');
      expect(Fonts).toHaveProperty('heading');
      expect(Fonts).toHaveProperty('mono');
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// mock-applications.ts
// ══════════════════════════════════════════════════════════════════════════════

describe('FrontEnd constants/mock-applications', () => {

  describe('REVIEW_ISSUES', () => {
    it('contains exactly 11 review issues', () => {
      expect(REVIEW_ISSUES).toHaveLength(11);
    });

    it('every issue has a non-empty id and label', () => {
      REVIEW_ISSUES.forEach((issue: { id: string; label: string }) => {
        expect(issue.id.length).toBeGreaterThan(0);
        expect(issue.label.length).toBeGreaterThan(0);
      });
    });

    it('all issue ids are unique', () => {
      const ids = REVIEW_ISSUES.map((i: { id: string }) => i.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe('SEED_APPLICATIONS', () => {
    it('contains 5 seeded applications', () => {
      expect(SEED_APPLICATIONS).toHaveLength(5);
    });

    it('covers all five application statuses', () => {
      const statuses = new Set(SEED_APPLICATIONS.map((a: { status: string }) => a.status));
      expect(statuses).toEqual(
        new Set(['pending', 'under_review', 'needs_correction', 'approved', 'rejected']),
      );
    });

    it('all application ids are unique', () => {
      const ids = SEED_APPLICATIONS.map((a: { id: string }) => a.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('each application has a complete vehicle object', () => {
      SEED_APPLICATIONS.forEach((app: { vehicle: Record<string, string> }) => {
        expect(app.vehicle).toHaveProperty('brand');
        expect(app.vehicle).toHaveProperty('model');
        expect(app.vehicle).toHaveProperty('year');
        expect(app.vehicle).toHaveProperty('plate');
        expect(app.vehicle).toHaveProperty('color');
      });
    });

    it('applications with needs_correction or rejected status have adminFeedback', () => {
      const flagged = SEED_APPLICATIONS.filter((a: { status: string }) =>
        a.status === 'needs_correction' || a.status === 'rejected',
      );
      flagged.forEach((app: { adminFeedback?: { issueIds: string[] } }) => {
        expect(app.adminFeedback).toBeDefined();
        expect(app.adminFeedback!.issueIds.length).toBeGreaterThan(0);
      });
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// mock-users.ts
// ══════════════════════════════════════════════════════════════════════════════

describe('FrontEnd constants/mock-users', () => {

  it('contains 6 seed users', () => {
    expect(SEED_USERS).toHaveLength(6);
  });

  it('all user ids are unique', () => {
    const ids = SEED_USERS.map((u: { id: string }) => u.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all usernames are unique', () => {
    const names = SEED_USERS.map((u: { username: string }) => u.username);
    expect(new Set(names).size).toBe(names.length);
  });

  it('all ratings are between 0 and 5 inclusive', () => {
    SEED_USERS.forEach((u: { rating: number }) => {
      expect(u.rating).toBeGreaterThanOrEqual(0);
      expect(u.rating).toBeLessThanOrEqual(5);
    });
  });

  it('all roles are valid', () => {
    const validRoles = new Set(['admin', 'passenger', 'passenger+driver']);
    SEED_USERS.forEach((u: { role: string }) => {
      expect(validRoles.has(u.role)).toBe(true);
    });
  });

  it('includes at least one user of each role', () => {
    const roles = new Set(SEED_USERS.map((u: { role: string }) => u.role));
    expect(roles.has('admin')).toBe(true);
    expect(roles.has('passenger')).toBe(true);
    expect(roles.has('passenger+driver')).toBe(true);
  });

  it('avatar is two uppercase characters (initials)', () => {
    SEED_USERS.forEach((u: { avatar: string }) => {
      expect(u.avatar).toMatch(/^[A-Z]{2}$/);
    });
  });

  it('trip counts are non-negative integers', () => {
    SEED_USERS.forEach((u: { tripsCount: number; driverTripsCount: number }) => {
      expect(u.tripsCount).toBeGreaterThanOrEqual(0);
      expect(u.driverTripsCount).toBeGreaterThanOrEqual(0);
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// mock-reports.ts
// ══════════════════════════════════════════════════════════════════════════════

describe('FrontEnd constants/mock-reports', () => {

  describe('REPORT_REASON_LABELS', () => {
    const expectedReasons = [
      'bad_behavior', 'dangerous_driving', 'no_show',
      'late_cancellation', 'harassment', 'vehicle_condition', 'other',
    ];

    it('covers all 7 report reason keys', () => {
      expect(Object.keys(REPORT_REASON_LABELS).sort()).toEqual(expectedReasons.sort());
    });

    it('every label is a non-empty string', () => {
      Object.values(REPORT_REASON_LABELS as Record<string, string>).forEach((label) => {
        expect(typeof label).toBe('string');
        expect(label.length).toBeGreaterThan(0);
      });
    });
  });

  describe('SEED_REPORTS', () => {
    it('contains 5 seed reports', () => {
      expect(SEED_REPORTS).toHaveLength(5);
    });

    it('all report ids are unique', () => {
      const ids = SEED_REPORTS.map((r: { id: string }) => r.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('all statuses are valid', () => {
      const validStatuses = new Set(['pending', 'resolved', 'dismissed']);
      SEED_REPORTS.forEach((r: { status: string }) => {
        expect(validStatuses.has(r.status)).toBe(true);
      });
    });

    it('includes at least one pending and one resolved/dismissed report', () => {
      const statuses = new Set(SEED_REPORTS.map((r: { status: string }) => r.status));
      expect(statuses.has('pending')).toBe(true);
      expect(statuses.has('resolved') || statuses.has('dismissed')).toBe(true);
    });

    it('resolved and dismissed reports have adminAction', () => {
      SEED_REPORTS
        .filter((r: { status: string }) => r.status !== 'pending')
        .forEach((r: { adminAction?: { type: string; resolvedAt: string } }) => {
          expect(r.adminAction).toBeDefined();
          expect(r.adminAction!.resolvedAt.length).toBeGreaterThan(0);
        });
    });

    it('all reason values match a key in REPORT_REASON_LABELS', () => {
      SEED_REPORTS.forEach((r: { reason: string }) => {
        expect(REPORT_REASON_LABELS).toHaveProperty(r.reason);
      });
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// mock-rides.ts
// ══════════════════════════════════════════════════════════════════════════════

describe('FrontEnd constants/mock-rides', () => {

  it('contains 4 detailed rides', () => {
    expect(DETAILED_RIDES).toHaveLength(4);
  });

  it('all ride ids are unique', () => {
    const ids = DETAILED_RIDES.map((r: { id: string }) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('price is positive for every ride', () => {
    DETAILED_RIDES.forEach((r: { price: number }) => {
      expect(r.price).toBeGreaterThan(0);
    });
  });

  it('availableSeats does not exceed totalSeats', () => {
    DETAILED_RIDES.forEach((r: { totalSeats: number; availableSeats: number }) => {
      expect(r.availableSeats).toBeLessThanOrEqual(r.totalSeats);
      expect(r.availableSeats).toBeGreaterThanOrEqual(0);
    });
  });

  it('origin and destination coordinates are within valid lat/lng ranges', () => {
    DETAILED_RIDES.forEach((r: {
      fromCoords: { lat: number; lng: number };
      toCoords:   { lat: number; lng: number };
    }) => {
      [r.fromCoords, r.toCoords].forEach(({ lat, lng }) => {
        expect(lat).toBeGreaterThanOrEqual(-90);
        expect(lat).toBeLessThanOrEqual(90);
        expect(lng).toBeGreaterThanOrEqual(-180);
        expect(lng).toBeLessThanOrEqual(180);
      });
    });
  });

  it('each driver has a valid rating between 0 and 5', () => {
    DETAILED_RIDES.forEach((r: { driver: { rating: number } }) => {
      expect(r.driver.rating).toBeGreaterThanOrEqual(0);
      expect(r.driver.rating).toBeLessThanOrEqual(5);
    });
  });

  it('each driver has at least one review', () => {
    DETAILED_RIDES.forEach((r: { driver: { reviews: unknown[] } }) => {
      expect(r.driver.reviews.length).toBeGreaterThan(0);
    });
  });

  it('all review ratings are between 1 and 5', () => {
    DETAILED_RIDES.forEach((r: { driver: { reviews: { rating: number }[] } }) => {
      r.driver.reviews.forEach(({ rating }) => {
        expect(rating).toBeGreaterThanOrEqual(1);
        expect(rating).toBeLessThanOrEqual(5);
      });
    });
  });

  it('all drivers are marked as verified', () => {
    DETAILED_RIDES.forEach((r: { driver: { verified: boolean } }) => {
      expect(r.driver.verified).toBe(true);
    });
  });
});
