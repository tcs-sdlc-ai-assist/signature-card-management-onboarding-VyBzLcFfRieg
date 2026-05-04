import { describe, it, expect } from 'vitest';
import {
  maskAccountNumber,
  maskCardNumber,
  maskEmail,
  maskPhone,
  maskSSN,
  sanitizeForLog,
} from './maskingUtils.js';

describe('maskingUtils', () => {
  // ---- maskAccountNumber ----

  describe('maskAccountNumber', () => {
    it('masks a full account number showing only the last 4 digits', () => {
      const result = maskAccountNumber('9200004567821');

      expect(result).toBe('****7821');
    });

    it('masks a different account number showing only the last 4 digits', () => {
      const result = maskAccountNumber('9200008913456');

      expect(result).toBe('****3456');
    });

    it('returns the input unchanged if it has 4 or fewer digits', () => {
      expect(maskAccountNumber('1234')).toBe('1234');
      expect(maskAccountNumber('123')).toBe('123');
      expect(maskAccountNumber('1')).toBe('1');
    });

    it('returns empty string for null input', () => {
      expect(maskAccountNumber(null)).toBe('');
    });

    it('returns empty string for undefined input', () => {
      expect(maskAccountNumber(undefined)).toBe('');
    });

    it('returns empty string for empty string input', () => {
      expect(maskAccountNumber('')).toBe('');
    });

    it('returns empty string for non-string input', () => {
      expect(maskAccountNumber(12345678)).toBe('');
      expect(maskAccountNumber(true)).toBe('');
      expect(maskAccountNumber({})).toBe('');
    });

    it('handles account numbers with non-digit characters', () => {
      const result = maskAccountNumber('9200-0045-67821');

      expect(result).toBe('****7821');
    });

    it('handles already masked account numbers (e.g. ****7821)', () => {
      const result = maskAccountNumber('****7821');

      // Only 4 digits present, so returns as-is
      expect(result).toBe('****7821');
    });

    it('masks a 5-digit number correctly', () => {
      const result = maskAccountNumber('12345');

      expect(result).toBe('****2345');
    });
  });

  // ---- maskCardNumber ----

  describe('maskCardNumber', () => {
    it('masks a full card number showing only the last 4 digits', () => {
      const result = maskCardNumber('4111111111114321');

      expect(result).toBe('****4321');
    });

    it('masks a different card number showing only the last 4 digits', () => {
      const result = maskCardNumber('4111111111118765');

      expect(result).toBe('****8765');
    });

    it('returns the input unchanged if it has 4 or fewer digits', () => {
      expect(maskCardNumber('4321')).toBe('4321');
      expect(maskCardNumber('123')).toBe('123');
    });

    it('returns empty string for null input', () => {
      expect(maskCardNumber(null)).toBe('');
    });

    it('returns empty string for undefined input', () => {
      expect(maskCardNumber(undefined)).toBe('');
    });

    it('returns empty string for empty string input', () => {
      expect(maskCardNumber('')).toBe('');
    });

    it('returns empty string for non-string input', () => {
      expect(maskCardNumber(4111111111114321)).toBe('');
    });

    it('handles card numbers with spaces and dashes', () => {
      const result = maskCardNumber('4111-1111-1111-4321');

      expect(result).toBe('****4321');
    });
  });

  // ---- maskEmail ----

  describe('maskEmail', () => {
    it('partially masks the local part of an email address', () => {
      const result = maskEmail('emily.chen@mitchellassoc.example.com');

      expect(result).not.toBe('emily.chen@mitchellassoc.example.com');
      expect(result).toContain('@mitchellassoc.example.com');
      // Should start with 'e' and end with 'n' before the @
      expect(result[0]).toBe('e');
      expect(result).toMatch(/^e\*+n@mitchellassoc\.example\.com$/);
    });

    it('masks a short local part email', () => {
      const result = maskEmail('ab@example.com');

      // Local part has 2 chars, so first char + *** + domain
      expect(result).toContain('@example.com');
      expect(result[0]).toBe('a');
    });

    it('masks a single character local part email', () => {
      const result = maskEmail('a@example.com');

      expect(result).toContain('@example.com');
      expect(result[0]).toBe('a');
    });

    it('preserves the domain part completely', () => {
      const result = maskEmail('test@domain.org');

      expect(result).toContain('@domain.org');
    });

    it('returns empty string for null input', () => {
      expect(maskEmail(null)).toBe('');
    });

    it('returns empty string for undefined input', () => {
      expect(maskEmail(undefined)).toBe('');
    });

    it('returns empty string for empty string input', () => {
      expect(maskEmail('')).toBe('');
    });

    it('returns empty string for non-string input', () => {
      expect(maskEmail(12345)).toBe('');
    });

    it('returns the input unchanged if there is no @ symbol', () => {
      const result = maskEmail('noemailhere');

      expect(result).toBe('noemailhere');
    });

    it('masks a longer local part with limited asterisks', () => {
      const result = maskEmail('verylonglocalpart@example.com');

      expect(result).toContain('@example.com');
      expect(result[0]).toBe('v');
      // The masked middle should be at most 5 asterisks
      const localPart = result.split('@')[0];
      const asterisks = localPart.match(/\*/g);
      expect(asterisks).not.toBeNull();
      expect(asterisks.length).toBeLessThanOrEqual(5);
    });

    it('masks a 3-character local part correctly', () => {
      const result = maskEmail('abc@test.com');

      expect(result).toContain('@test.com');
      expect(result[0]).toBe('a');
      const atIndex = result.indexOf('@');
      expect(result[atIndex - 1]).toBe('c');
    });
  });

  // ---- maskPhone ----

  describe('maskPhone', () => {
    it('masks a phone number showing only the last 4 digits', () => {
      const result = maskPhone('(555) 234-5678');

      expect(result).not.toBe('(555) 234-5678');
      expect(result).toContain('5678');
      expect(result).toBe('(***) ***-5678');
    });

    it('masks a different phone number', () => {
      const result = maskPhone('(555) 456-7890');

      expect(result).toContain('7890');
      expect(result).toBe('(***) ***-7890');
    });

    it('masks a plain digit phone number', () => {
      const result = maskPhone('5552345678');

      expect(result).toContain('5678');
      expect(result).toBe('(***) ***-5678');
    });

    it('returns the input unchanged if it has 4 or fewer digits', () => {
      expect(maskPhone('1234')).toBe('1234');
      expect(maskPhone('123')).toBe('123');
    });

    it('returns empty string for null input', () => {
      expect(maskPhone(null)).toBe('');
    });

    it('returns empty string for undefined input', () => {
      expect(maskPhone(undefined)).toBe('');
    });

    it('returns empty string for empty string input', () => {
      expect(maskPhone('')).toBe('');
    });

    it('returns empty string for non-string input', () => {
      expect(maskPhone(5551234567)).toBe('');
    });

    it('masks a phone number with country code', () => {
      const result = maskPhone('+1 (555) 234-5678');

      expect(result).toContain('5678');
    });
  });

  // ---- maskSSN ----

  describe('maskSSN', () => {
    it('masks a full SSN showing only the last 4 digits', () => {
      const result = maskSSN('123-45-6789');

      expect(result).toBe('***-**-6789');
    });

    it('masks a SSN without dashes', () => {
      const result = maskSSN('123456789');

      expect(result).toBe('***-**-6789');
    });

    it('returns the input unchanged if it has 4 or fewer digits', () => {
      expect(maskSSN('4589')).toBe('4589');
      expect(maskSSN('123')).toBe('123');
    });

    it('returns empty string for null input', () => {
      expect(maskSSN(null)).toBe('');
    });

    it('returns empty string for undefined input', () => {
      expect(maskSSN(undefined)).toBe('');
    });

    it('returns empty string for empty string input', () => {
      expect(maskSSN('')).toBe('');
    });

    it('returns empty string for non-string input', () => {
      expect(maskSSN(123456789)).toBe('');
    });
  });

  // ---- sanitizeForLog ----

  describe('sanitizeForLog', () => {
    it('masks email fields in an object', () => {
      const input = {
        email: 'emily.chen@mitchellassoc.example.com',
        name: 'Emily Chen',
      };

      const result = sanitizeForLog(input);

      expect(result.email).not.toBe('emily.chen@mitchellassoc.example.com');
      expect(result.email).toContain('@mitchellassoc.example.com');
      expect(result.name).toBe('Emily Chen');
    });

    it('masks phone fields in an object', () => {
      const input = {
        phone: '(555) 234-5678',
        action: 'add_signer',
      };

      const result = sanitizeForLog(input);

      expect(result.phone).not.toBe('(555) 234-5678');
      expect(result.phone).toContain('5678');
      expect(result.action).toBe('add_signer');
    });

    it('masks accountNumber fields in an object', () => {
      const input = {
        accountNumber: '9200004567821',
        status: 'active',
      };

      const result = sanitizeForLog(input);

      expect(result.accountNumber).not.toBe('9200004567821');
      expect(result.accountNumber).toContain('7821');
      expect(result.status).toBe('active');
    });

    it('masks accountNumberFull fields in an object', () => {
      const input = {
        accountNumberFull: '9200004567821',
      };

      const result = sanitizeForLog(input);

      expect(result.accountNumberFull).not.toBe('9200004567821');
      expect(result.accountNumberFull).toContain('7821');
    });

    it('masks cardNumber fields in an object', () => {
      const input = {
        cardNumber: '4111111111114321',
      };

      const result = sanitizeForLog(input);

      expect(result.cardNumber).not.toBe('4111111111114321');
      expect(result.cardNumber).toContain('4321');
    });

    it('masks cardNumberFull fields in an object', () => {
      const input = {
        cardNumberFull: '4111111111118765',
      };

      const result = sanitizeForLog(input);

      expect(result.cardNumberFull).not.toBe('4111111111118765');
      expect(result.cardNumberFull).toContain('8765');
    });

    it('masks ssn fields in an object', () => {
      const input = {
        ssn: '123-45-6789',
      };

      const result = sanitizeForLog(input);

      expect(result.ssn).toBe('***-**-6789');
    });

    it('redacts password fields', () => {
      const input = {
        password: 'SecurePass123!',
        username: 'cpuser01',
      };

      const result = sanitizeForLog(input);

      expect(result.password).toBe('[REDACTED]');
      expect(result.username).toBe('cpuser01');
    });

    it('redacts token fields', () => {
      const input = {
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock-valid-token',
        result: 'success',
      };

      const result = sanitizeForLog(input);

      expect(result.token).toBe('[REDACTED]');
      expect(result.result).toBe('success');
    });

    it('redacts refreshToken fields', () => {
      const input = {
        refreshToken: 'some-refresh-token-value',
        action: 'refresh',
      };

      const result = sanitizeForLog(input);

      expect(result.refreshToken).toBe('[REDACTED]');
      expect(result.action).toBe('refresh');
    });

    it('redacts pin fields', () => {
      const input = {
        pin: '1234',
        cardId: 'card-3001',
      };

      const result = sanitizeForLog(input);

      expect(result.pin).toBe('[REDACTED]');
      expect(result.cardId).toBe('card-3001');
    });

    it('redacts securityAnswer fields', () => {
      const input = {
        securityAnswer: 'MySecretAnswer',
        questionId: 'q1',
      };

      const result = sanitizeForLog(input);

      expect(result.securityAnswer).toBe('[REDACTED]');
      expect(result.questionId).toBe('q1');
    });

    it('masks dateOfBirth fields', () => {
      const input = {
        dateOfBirth: '1985-07-14',
        name: 'Emily',
      };

      const result = sanitizeForLog(input);

      expect(result.dateOfBirth).toBe('***');
      expect(result.name).toBe('Emily');
    });

    it('passes through non-PII primitive fields unchanged', () => {
      const input = {
        action: 'login',
        status: 'success',
        count: 42,
        isActive: true,
      };

      const result = sanitizeForLog(input);

      expect(result.action).toBe('login');
      expect(result.status).toBe('success');
      expect(result.count).toBe(42);
      expect(result.isActive).toBe(true);
    });

    it('recursively sanitizes nested objects', () => {
      const input = {
        signer: {
          email: 'nested@example.com',
          phone: '(555) 999-8888',
          name: 'Test User',
        },
        action: 'add',
      };

      const result = sanitizeForLog(input);

      expect(result.signer.email).not.toBe('nested@example.com');
      expect(result.signer.email).toContain('@example.com');
      expect(result.signer.phone).not.toBe('(555) 999-8888');
      expect(result.signer.phone).toContain('8888');
      expect(result.signer.name).toBe('Test User');
      expect(result.action).toBe('add');
    });

    it('recursively sanitizes deeply nested objects', () => {
      const input = {
        level1: {
          level2: {
            email: 'deep@example.com',
            password: 'secret',
          },
        },
      };

      const result = sanitizeForLog(input);

      expect(result.level1.level2.email).not.toBe('deep@example.com');
      expect(result.level1.level2.email).toContain('@example.com');
      expect(result.level1.level2.password).toBe('[REDACTED]');
    });

    it('sanitizes arrays of objects', () => {
      const input = [
        { email: 'first@example.com', name: 'First' },
        { email: 'second@example.com', name: 'Second' },
      ];

      const result = sanitizeForLog(input);

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(2);
      expect(result[0].email).not.toBe('first@example.com');
      expect(result[0].email).toContain('@example.com');
      expect(result[0].name).toBe('First');
      expect(result[1].email).not.toBe('second@example.com');
      expect(result[1].email).toContain('@example.com');
      expect(result[1].name).toBe('Second');
    });

    it('sanitizes arrays nested within objects', () => {
      const input = {
        signers: [
          { email: 'a@test.com', phone: '(555) 111-2222' },
          { email: 'b@test.com', phone: '(555) 333-4444' },
        ],
      };

      const result = sanitizeForLog(input);

      expect(Array.isArray(result.signers)).toBe(true);
      expect(result.signers[0].email).not.toBe('a@test.com');
      expect(result.signers[0].phone).toContain('2222');
      expect(result.signers[1].email).not.toBe('b@test.com');
      expect(result.signers[1].phone).toContain('4444');
    });

    it('returns null for null input', () => {
      expect(sanitizeForLog(null)).toBeNull();
    });

    it('returns undefined for undefined input', () => {
      expect(sanitizeForLog(undefined)).toBeUndefined();
    });

    it('returns primitive values unchanged', () => {
      expect(sanitizeForLog('hello')).toBe('hello');
      expect(sanitizeForLog(42)).toBe(42);
      expect(sanitizeForLog(true)).toBe(true);
      expect(sanitizeForLog(false)).toBe(false);
    });

    it('returns an empty object for empty object input', () => {
      const result = sanitizeForLog({});

      expect(result).toEqual({});
    });

    it('returns an empty array for empty array input', () => {
      const result = sanitizeForLog([]);

      expect(result).toEqual([]);
    });

    it('does not mutate the original object', () => {
      const input = {
        email: 'test@example.com',
        password: 'secret',
        name: 'Test',
      };

      const originalEmail = input.email;
      const originalPassword = input.password;
      const originalName = input.name;

      sanitizeForLog(input);

      expect(input.email).toBe(originalEmail);
      expect(input.password).toBe(originalPassword);
      expect(input.name).toBe(originalName);
    });

    it('handles objects with mixed PII and non-PII fields', () => {
      const input = {
        email: 'user@example.com',
        phone: '(555) 123-4567',
        accountNumber: '9200001234567',
        password: 'secret123',
        token: 'jwt-token-value',
        action: 'submit',
        status: 'success',
        confirmationId: 'CONF-12345678',
      };

      const result = sanitizeForLog(input);

      expect(result.email).not.toBe('user@example.com');
      expect(result.email).toContain('@example.com');
      expect(result.phone).not.toBe('(555) 123-4567');
      expect(result.phone).toContain('4567');
      expect(result.accountNumber).not.toBe('9200001234567');
      expect(result.accountNumber).toContain('4567');
      expect(result.password).toBe('[REDACTED]');
      expect(result.token).toBe('[REDACTED]');
      expect(result.action).toBe('submit');
      expect(result.status).toBe('success');
      expect(result.confirmationId).toBe('CONF-12345678');
    });

    it('handles lastFourSSN field by passing through', () => {
      const input = {
        lastFourSSN: '4589',
        name: 'Emily',
      };

      const result = sanitizeForLog(input);

      expect(result.lastFourSSN).toBe('4589');
      expect(result.name).toBe('Emily');
    });

    it('handles lastFourSSN with non-string value', () => {
      const input = {
        lastFourSSN: 4589,
      };

      const result = sanitizeForLog(input);

      // Non-string value for lastFourSSN — masker returns '' but since it's not a string,
      // the PII_FIELD_MASKERS check (typeof value === 'string') will skip it
      expect(result.lastFourSSN).toBe(4589);
    });

    it('handles max depth protection for deeply nested objects', () => {
      // Build a deeply nested object (more than 10 levels)
      let deepObj = { value: 'deep' };
      for (let i = 0; i < 15; i++) {
        deepObj = { nested: deepObj };
      }

      const result = sanitizeForLog(deepObj);

      // Should not throw and should handle the depth limit
      expect(result).toBeDefined();
    });

    it('only applies masker when value is a string for PII fields', () => {
      const input = {
        email: 12345, // non-string email
        phone: true,  // non-string phone
        accountNumber: null, // null accountNumber
      };

      const result = sanitizeForLog(input);

      // Non-string PII values should be passed through as-is (not masked)
      expect(result.email).toBe(12345);
      expect(result.phone).toBe(true);
      expect(result.accountNumber).toBeNull();
    });
  });
});