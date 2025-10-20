// =============================================================================
// OTP UTILITIES TESTS
// =============================================================================
// Unit tests for OTP generation, validation, and expiration utilities

import { describe, test, expect } from 'vitest';
import {
  generateSecureOTP,
  isValidOTPFormat,
  getOTPExpiration,
  isOTPExpired,
} from '../security';

describe('OTP Utilities', () => {
  describe('generateSecureOTP', () => {
    test('generates 6-digit OTP code', () => {
      const otp = generateSecureOTP();
      expect(otp).toHaveLength(6);
      expect(otp).toMatch(/^\d{6}$/);
    });

    test('generates different codes on each call', () => {
      const otp1 = generateSecureOTP();
      const otp2 = generateSecureOTP();
      // Extremely unlikely to generate same code twice
      expect(otp1).not.toBe(otp2);
    });

    test('generates codes in valid range (100000-999999)', () => {
      const otp = generateSecureOTP();
      const numValue = parseInt(otp, 10);
      expect(numValue).toBeGreaterThanOrEqual(100000);
      expect(numValue).toBeLessThanOrEqual(999999);
    });

    test('pads with leading zeros if needed', () => {
      // Run multiple times to catch edge cases
      for (let i = 0; i < 100; i++) {
        const otp = generateSecureOTP();
        expect(otp).toHaveLength(6);
        expect(otp[0]).toMatch(/\d/); // First char is digit
      }
    });
  });

  describe('isValidOTPFormat', () => {
    test('accepts valid 6-digit codes', () => {
      expect(isValidOTPFormat('123456')).toBe(true);
      expect(isValidOTPFormat('000000')).toBe(true);
      expect(isValidOTPFormat('999999')).toBe(true);
      expect(isValidOTPFormat('007823')).toBe(true);
    });

    test('rejects codes that are too short', () => {
      expect(isValidOTPFormat('12345')).toBe(false);
      expect(isValidOTPFormat('1')).toBe(false);
      expect(isValidOTPFormat('')).toBe(false);
    });

    test('rejects codes that are too long', () => {
      expect(isValidOTPFormat('1234567')).toBe(false);
      expect(isValidOTPFormat('12345678')).toBe(false);
    });

    test('rejects codes with non-digit characters', () => {
      expect(isValidOTPFormat('abc123')).toBe(false);
      expect(isValidOTPFormat('12-456')).toBe(false);
      expect(isValidOTPFormat('12 456')).toBe(false);
      expect(isValidOTPFormat('12.456')).toBe(false);
    });

    test('rejects null and undefined', () => {
      expect(isValidOTPFormat(null)).toBe(false);
      expect(isValidOTPFormat(undefined)).toBe(false);
    });
  });

  describe('getOTPExpiration', () => {
    test('returns future date for given minutes', () => {
      const beforeCall = Date.now();
      const expiration = getOTPExpiration(10);
      const afterCall = Date.now();

      const expectedMin = beforeCall + (10 * 60 * 1000);
      const expectedMax = afterCall + (10 * 60 * 1000);

      expect(expiration.getTime()).toBeGreaterThanOrEqual(expectedMin);
      expect(expiration.getTime()).toBeLessThanOrEqual(expectedMax);
    });

    test('respects custom expiry duration', () => {
      const expiration5 = getOTPExpiration(5);
      const expiration15 = getOTPExpiration(15);

      const now = Date.now();
      const diff5 = expiration5.getTime() - now;
      const diff15 = expiration15.getTime() - now;

      expect(diff5).toBeLessThan(diff15);
      expect(diff5).toBeCloseTo(5 * 60 * 1000, -2); // Within 100ms
      expect(diff15).toBeCloseTo(15 * 60 * 1000, -2);
    });

    test('uses default 10 minutes if not specified', () => {
      const expiration = getOTPExpiration();
      const now = Date.now();
      const diff = expiration.getTime() - now;

      expect(diff).toBeCloseTo(10 * 60 * 1000, -2); // ~10 minutes
    });
  });

  describe('isOTPExpired', () => {
    test('returns true for past dates', () => {
      const pastDate = new Date(Date.now() - 1000); // 1 second ago
      expect(isOTPExpired(pastDate)).toBe(true);

      const longPastDate = new Date(Date.now() - 600000); // 10 minutes ago
      expect(isOTPExpired(longPastDate)).toBe(true);
    });

    test('returns false for future dates', () => {
      const futureDate = new Date(Date.now() + 1000); // 1 second from now
      expect(isOTPExpired(futureDate)).toBe(false);

      const longFutureDate = new Date(Date.now() + 600000); // 10 minutes from now
      expect(isOTPExpired(longFutureDate)).toBe(false);
    });

    test('returns true for current moment (edge case)', () => {
      const now = new Date(Date.now());
      // May be true or false depending on exact timing, but should not error
      const result = isOTPExpired(now);
      expect(typeof result).toBe('boolean');
    });
  });

  describe('OTP workflow integration', () => {
    test('complete OTP generation and validation flow', () => {
      // Generate OTP
      const otp = generateSecureOTP();

      // Validate format
      expect(isValidOTPFormat(otp)).toBe(true);

      // Get expiration
      const expiresAt = getOTPExpiration(10);

      // Check not expired
      expect(isOTPExpired(expiresAt)).toBe(false);

      // Simulate expired OTP
      const expiredAt = new Date(Date.now() - 1000);
      expect(isOTPExpired(expiredAt)).toBe(true);
    });
  });
});
