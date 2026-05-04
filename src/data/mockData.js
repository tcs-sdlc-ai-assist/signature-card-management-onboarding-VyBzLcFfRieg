/**
 * Mock data fixtures for MVP development and demos.
 *
 * All data structures mirror the production schema for seamless future migration.
 * Import individual exports as needed — avoid importing the entire module.
 *
 * @module mockData
 */

import { v4 as uuidv4 } from 'uuid';
import { CARD_STATUSES, SIGNER_STATUSES } from '../constants/constants.js';

// ---- Controlling Party / User Credentials ----

/** @type {Object} Mock controlling party user for login */
export const MOCK_USER_CREDENTIALS = {
  username: 'cpuser01',
  password: 'SecurePass123!',
};

/** @type {Object} Mock controlling party profile returned after authentication */
export const MOCK_USER_PROFILE = {
  id: 'usr-001',
  username: 'cpuser01',
  firstName: 'Jordan',
  lastName: 'Mitchell',
  email: 'jordan.mitchell@sigbank.example.com',
  role: 'controlling_party',
  phone: '(555) 123-4567',
  lastLogin: '2025-01-10T14:32:00Z',
  createdAt: '2024-06-15T09:00:00Z',
};

// ---- eSign Tokens ----

/** @type {Object} Valid eSign token example */
export const MOCK_ESIGN_TOKEN_VALID = {
  token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock-valid-token',
  userId: 'usr-001',
  issuedAt: new Date().toISOString(),
  expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
  isValid: true,
};

/** @type {Object} Expired eSign token example */
export const MOCK_ESIGN_TOKEN_EXPIRED = {
  token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock-expired-token',
  userId: 'usr-001',
  issuedAt: '2024-12-01T08:00:00Z',
  expiresAt: '2024-12-04T08:00:00Z',
  isValid: false,
};

// ---- Business Banking Accounts ----

/** @type {Array<Object>} Mock business banking accounts */
export const MOCK_ACCOUNTS = [
  {
    id: 'acct-1001',
    accountNumber: '****7821',
    accountNumberFull: '9200004567821',
    accountName: 'Mitchell & Associates Operating',
    accountType: 'business_checking',
    status: 'active',
    signerCount: 3,
    createdAt: '2023-03-10T10:00:00Z',
  },
  {
    id: 'acct-1002',
    accountNumber: '****3456',
    accountNumberFull: '9200008913456',
    accountName: 'Mitchell & Associates Payroll',
    accountType: 'business_checking',
    status: 'active',
    signerCount: 2,
    createdAt: '2023-03-10T10:15:00Z',
  },
  {
    id: 'acct-1003',
    accountNumber: '****9012',
    accountNumberFull: '9200006789012',
    accountName: 'Mitchell & Associates Savings',
    accountType: 'business_savings',
    status: 'active',
    signerCount: 2,
    createdAt: '2023-05-22T14:30:00Z',
  },
  {
    id: 'acct-1004',
    accountNumber: '****5500',
    accountNumberFull: '9200001235500',
    accountName: 'M&A Vendor Payments',
    accountType: 'business_checking',
    status: 'active',
    signerCount: 4,
    createdAt: '2024-01-08T09:00:00Z',
  },
];

// ---- Authorized Signers ----

/** @type {Array<Object>} Mock authorized signers across accounts */
export const MOCK_SIGNERS = [
  {
    id: 'sig-2001',
    accountId: 'acct-1001',
    firstName: 'Emily',
    lastName: 'Chen',
    fullName: 'Emily Chen',
    role: 'authorized_signer',
    status: SIGNER_STATUSES.ACTIVE,
    email: 'emily.chen@mitchellassoc.example.com',
    phone: '(555) 234-5678',
    address: {
      line1: '1200 Commerce Blvd',
      line2: 'Suite 400',
      city: 'Springfield',
      state: 'IL',
      zip: '62704',
    },
    lastFourSSN: '4589',
    dateOfBirth: '1985-07-14',
    createdAt: '2023-03-12T11:00:00Z',
  },
  {
    id: 'sig-2002',
    accountId: 'acct-1001',
    firstName: 'Marcus',
    lastName: 'Williams',
    fullName: 'Marcus Williams',
    role: 'authorized_signer',
    status: SIGNER_STATUSES.ACTIVE,
    email: 'marcus.williams@mitchellassoc.example.com',
    phone: '(555) 345-6789',
    address: {
      line1: '742 Elm Street',
      line2: '',
      city: 'Springfield',
      state: 'IL',
      zip: '62701',
    },
    lastFourSSN: '7823',
    dateOfBirth: '1990-02-28',
    createdAt: '2023-03-12T11:30:00Z',
  },
  {
    id: 'sig-2003',
    accountId: 'acct-1001',
    firstName: 'Sarah',
    lastName: 'Patel',
    fullName: 'Sarah Patel',
    role: 'authorized_signer',
    status: SIGNER_STATUSES.LOCKED,
    email: 'sarah.patel@mitchellassoc.example.com',
    phone: '(555) 456-7890',
    address: {
      line1: '88 Oak Avenue',
      line2: 'Apt 12B',
      city: 'Springfield',
      state: 'IL',
      zip: '62702',
    },
    lastFourSSN: '1234',
    dateOfBirth: '1978-11-03',
    createdAt: '2023-04-01T09:00:00Z',
  },
  {
    id: 'sig-2004',
    accountId: 'acct-1002',
    firstName: 'Emily',
    lastName: 'Chen',
    fullName: 'Emily Chen',
    role: 'authorized_signer',
    status: SIGNER_STATUSES.ACTIVE,
    email: 'emily.chen@mitchellassoc.example.com',
    phone: '(555) 234-5678',
    address: {
      line1: '1200 Commerce Blvd',
      line2: 'Suite 400',
      city: 'Springfield',
      state: 'IL',
      zip: '62704',
    },
    lastFourSSN: '4589',
    dateOfBirth: '1985-07-14',
    createdAt: '2023-03-12T11:00:00Z',
  },
  {
    id: 'sig-2005',
    accountId: 'acct-1002',
    firstName: 'David',
    lastName: 'Nguyen',
    fullName: 'David Nguyen',
    role: 'authorized_signer',
    status: SIGNER_STATUSES.PENDING,
    email: 'david.nguyen@mitchellassoc.example.com',
    phone: '(555) 567-8901',
    address: {
      line1: '305 Maple Drive',
      line2: '',
      city: 'Springfield',
      state: 'IL',
      zip: '62703',
    },
    lastFourSSN: '9012',
    dateOfBirth: '1992-05-19',
    createdAt: '2024-11-20T15:00:00Z',
  },
  {
    id: 'sig-2006',
    accountId: 'acct-1003',
    firstName: 'Marcus',
    lastName: 'Williams',
    fullName: 'Marcus Williams',
    role: 'authorized_signer',
    status: SIGNER_STATUSES.ACTIVE,
    email: 'marcus.williams@mitchellassoc.example.com',
    phone: '(555) 345-6789',
    address: {
      line1: '742 Elm Street',
      line2: '',
      city: 'Springfield',
      state: 'IL',
      zip: '62701',
    },
    lastFourSSN: '7823',
    dateOfBirth: '1990-02-28',
    createdAt: '2023-05-22T15:00:00Z',
  },
  {
    id: 'sig-2007',
    accountId: 'acct-1003',
    firstName: 'Sarah',
    lastName: 'Patel',
    fullName: 'Sarah Patel',
    role: 'authorized_signer',
    status: SIGNER_STATUSES.ACTIVE,
    email: 'sarah.patel@mitchellassoc.example.com',
    phone: '(555) 456-7890',
    address: {
      line1: '88 Oak Avenue',
      line2: 'Apt 12B',
      city: 'Springfield',
      state: 'IL',
      zip: '62702',
    },
    lastFourSSN: '1234',
    dateOfBirth: '1978-11-03',
    createdAt: '2023-05-22T15:30:00Z',
  },
  {
    id: 'sig-2008',
    accountId: 'acct-1004',
    firstName: 'Emily',
    lastName: 'Chen',
    fullName: 'Emily Chen',
    role: 'authorized_signer',
    status: SIGNER_STATUSES.ACTIVE,
    email: 'emily.chen@mitchellassoc.example.com',
    phone: '(555) 234-5678',
    address: {
      line1: '1200 Commerce Blvd',
      line2: 'Suite 400',
      city: 'Springfield',
      state: 'IL',
      zip: '62704',
    },
    lastFourSSN: '4589',
    dateOfBirth: '1985-07-14',
    createdAt: '2024-01-08T10:00:00Z',
  },
  {
    id: 'sig-2009',
    accountId: 'acct-1004',
    firstName: 'Marcus',
    lastName: 'Williams',
    fullName: 'Marcus Williams',
    role: 'authorized_signer',
    status: SIGNER_STATUSES.ACTIVE,
    email: 'marcus.williams@mitchellassoc.example.com',
    phone: '(555) 345-6789',
    address: {
      line1: '742 Elm Street',
      line2: '',
      city: 'Springfield',
      state: 'IL',
      zip: '62701',
    },
    lastFourSSN: '7823',
    dateOfBirth: '1990-02-28',
    createdAt: '2024-01-08T10:15:00Z',
  },
  {
    id: 'sig-2010',
    accountId: 'acct-1004',
    firstName: 'Rachel',
    lastName: 'Kim',
    fullName: 'Rachel Kim',
    role: 'authorized_signer',
    status: SIGNER_STATUSES.ACTIVE,
    email: 'rachel.kim@mitchellassoc.example.com',
    phone: '(555) 678-9012',
    address: {
      line1: '55 Pine Street',
      line2: 'Unit 7',
      city: 'Springfield',
      state: 'IL',
      zip: '62705',
    },
    lastFourSSN: '3456',
    dateOfBirth: '1988-09-25',
    createdAt: '2024-01-08T10:30:00Z',
  },
  {
    id: 'sig-2011',
    accountId: 'acct-1004',
    firstName: 'James',
    lastName: 'O\'Brien',
    fullName: 'James O\'Brien',
    role: 'authorized_signer',
    status: SIGNER_STATUSES.LOCKED,
    email: 'james.obrien@mitchellassoc.example.com',
    phone: '(555) 789-0123',
    address: {
      line1: '1600 Birch Lane',
      line2: '',
      city: 'Springfield',
      state: 'IL',
      zip: '62706',
    },
    lastFourSSN: '5678',
    dateOfBirth: '1975-12-08',
    createdAt: '2024-02-14T08:00:00Z',
  },
];

// ---- Cards ----

/** @type {Array<Object>} Mock debit cards associated with signers */
export const MOCK_CARDS = [
  {
    id: 'card-3001',
    signerId: 'sig-2001',
    accountId: 'acct-1001',
    cardNumber: '****4321',
    cardNumberFull: '4111111111114321',
    cardholderName: 'Emily Chen',
    cardType: 'business_debit',
    status: CARD_STATUSES.ACTIVE,
    expirationDate: '12/2027',
    issuedDate: '2024-01-15T00:00:00Z',
    lastUsedDate: '2025-01-09T16:45:00Z',
    dailyLimit: 5000,
    pinSet: true,
  },
  {
    id: 'card-3002',
    signerId: 'sig-2002',
    accountId: 'acct-1001',
    cardNumber: '****8765',
    cardNumberFull: '4111111111118765',
    cardholderName: 'Marcus Williams',
    cardType: 'business_debit',
    status: CARD_STATUSES.ACTIVE,
    expirationDate: '06/2026',
    issuedDate: '2023-06-20T00:00:00Z',
    lastUsedDate: '2025-01-08T09:12:00Z',
    dailyLimit: 5000,
    pinSet: true,
  },
  {
    id: 'card-3003',
    signerId: 'sig-2003',
    accountId: 'acct-1001',
    cardNumber: '****2222',
    cardNumberFull: '4111111111112222',
    cardholderName: 'Sarah Patel',
    cardType: 'business_debit',
    status: CARD_STATUSES.LOCKED,
    expirationDate: '09/2026',
    issuedDate: '2023-09-01T00:00:00Z',
    lastUsedDate: '2024-11-30T14:20:00Z',
    dailyLimit: 3000,
    pinSet: true,
  },
  {
    id: 'card-3004',
    signerId: 'sig-2004',
    accountId: 'acct-1002',
    cardNumber: '****5555',
    cardNumberFull: '4111111111115555',
    cardholderName: 'Emily Chen',
    cardType: 'business_debit',
    status: CARD_STATUSES.ACTIVE,
    expirationDate: '03/2027',
    issuedDate: '2024-03-10T00:00:00Z',
    lastUsedDate: '2025-01-10T11:30:00Z',
    dailyLimit: 10000,
    pinSet: true,
  },
  {
    id: 'card-3005',
    signerId: 'sig-2005',
    accountId: 'acct-1002',
    cardNumber: '****9999',
    cardNumberFull: '4111111111119999',
    cardholderName: 'David Nguyen',
    cardType: 'business_debit',
    status: CARD_STATUSES.PENDING_ACTIVATION,
    expirationDate: '11/2027',
    issuedDate: '2024-11-20T00:00:00Z',
    lastUsedDate: null,
    dailyLimit: 2500,
    pinSet: false,
  },
  {
    id: 'card-3006',
    signerId: 'sig-2006',
    accountId: 'acct-1003',
    cardNumber: '****1111',
    cardNumberFull: '4111111111111111',
    cardholderName: 'Marcus Williams',
    cardType: 'business_debit',
    status: CARD_STATUSES.EXPIRED,
    expirationDate: '01/2025',
    issuedDate: '2023-01-15T00:00:00Z',
    lastUsedDate: '2025-01-02T08:00:00Z',
    dailyLimit: 5000,
    pinSet: true,
  },
  {
    id: 'card-3007',
    signerId: 'sig-2006',
    accountId: 'acct-1003',
    cardNumber: '****7777',
    cardNumberFull: '4111111111117777',
    cardholderName: 'Marcus Williams',
    cardType: 'business_debit',
    status: CARD_STATUSES.ACTIVE,
    expirationDate: '01/2028',
    issuedDate: '2025-01-05T00:00:00Z',
    lastUsedDate: '2025-01-10T17:00:00Z',
    dailyLimit: 5000,
    pinSet: true,
  },
  {
    id: 'card-3008',
    signerId: 'sig-2008',
    accountId: 'acct-1004',
    cardNumber: '****3333',
    cardNumberFull: '4111111111113333',
    cardholderName: 'Emily Chen',
    cardType: 'business_debit',
    status: CARD_STATUSES.ACTIVE,
    expirationDate: '02/2027',
    issuedDate: '2024-02-01T00:00:00Z',
    lastUsedDate: '2025-01-09T13:22:00Z',
    dailyLimit: 7500,
    pinSet: true,
  },
  {
    id: 'card-3009',
    signerId: 'sig-2010',
    accountId: 'acct-1004',
    cardNumber: '****6666',
    cardNumberFull: '4111111111116666',
    cardholderName: 'Rachel Kim',
    cardType: 'business_debit',
    status: CARD_STATUSES.ACTIVE,
    expirationDate: '04/2027',
    issuedDate: '2024-04-15T00:00:00Z',
    lastUsedDate: '2025-01-10T10:05:00Z',
    dailyLimit: 5000,
    pinSet: true,
  },
  {
    id: 'card-3010',
    signerId: 'sig-2011',
    accountId: 'acct-1004',
    cardNumber: '****4444',
    cardNumberFull: '4111111111114444',
    cardholderName: 'James O\'Brien',
    cardType: 'business_debit',
    status: CARD_STATUSES.LOCKED,
    expirationDate: '08/2026',
    issuedDate: '2024-02-14T00:00:00Z',
    lastUsedDate: '2024-12-20T15:45:00Z',
    dailyLimit: 5000,
    pinSet: true,
  },
  {
    id: 'card-3011',
    signerId: 'sig-2003',
    accountId: 'acct-1001',
    cardNumber: '****8888',
    cardNumberFull: '4111111111118888',
    cardholderName: 'Sarah Patel',
    cardType: 'business_debit',
    status: CARD_STATUSES.REPLACED,
    expirationDate: '03/2025',
    issuedDate: '2022-03-01T00:00:00Z',
    lastUsedDate: '2023-08-15T12:00:00Z',
    dailyLimit: 3000,
    pinSet: true,
  },
];

// ---- Rate Limit Counters ----

/** @type {Object} Mock rate limit counters for unlock and PIN resend operations */
export const MOCK_RATE_LIMITS = {
  unlock: {
    userId: 'usr-001',
    date: new Date().toISOString().split('T')[0],
    attemptsUsed: 0,
    maxAttempts: 3,
  },
  resendPin: {
    userId: 'usr-001',
    date: new Date().toISOString().split('T')[0],
    attemptsUsed: 0,
    maxAttempts: 3,
  },
};

/** @type {Object} Mock rate limit counters at warning threshold */
export const MOCK_RATE_LIMITS_WARNING = {
  unlock: {
    userId: 'usr-001',
    date: new Date().toISOString().split('T')[0],
    attemptsUsed: 2,
    maxAttempts: 3,
  },
  resendPin: {
    userId: 'usr-001',
    date: new Date().toISOString().split('T')[0],
    attemptsUsed: 2,
    maxAttempts: 3,
  },
};

/** @type {Object} Mock rate limit counters fully exhausted */
export const MOCK_RATE_LIMITS_EXHAUSTED = {
  unlock: {
    userId: 'usr-001',
    date: new Date().toISOString().split('T')[0],
    attemptsUsed: 3,
    maxAttempts: 3,
  },
  resendPin: {
    userId: 'usr-001',
    date: new Date().toISOString().split('T')[0],
    attemptsUsed: 3,
    maxAttempts: 3,
  },
};

// ---- Audit Log Seed Data ----

/** @type {Array<Object>} Mock audit log entries */
export const MOCK_AUDIT_LOG = [
  {
    id: uuidv4(),
    timestamp: '2025-01-10T14:32:00Z',
    userId: 'usr-001',
    userName: 'Jordan Mitchell',
    action: 'LOGIN',
    description: 'User logged in successfully.',
    ipAddress: '192.168.1.100',
    metadata: {},
  },
  {
    id: uuidv4(),
    timestamp: '2025-01-10T14:35:12Z',
    userId: 'usr-001',
    userName: 'Jordan Mitchell',
    action: 'SEARCH_SIGNER',
    description: 'Searched for signer: Emily Chen',
    ipAddress: '192.168.1.100',
    metadata: { query: 'Emily Chen' },
  },
  {
    id: uuidv4(),
    timestamp: '2025-01-10T14:36:45Z',
    userId: 'usr-001',
    userName: 'Jordan Mitchell',
    action: 'VIEW_CARD',
    description: 'Viewed card details for card ****4321.',
    ipAddress: '192.168.1.100',
    metadata: { cardId: 'card-3001', signerId: 'sig-2001' },
  },
  {
    id: uuidv4(),
    timestamp: '2025-01-09T10:15:00Z',
    userId: 'usr-001',
    userName: 'Jordan Mitchell',
    action: 'LOCK_CARD',
    description: 'Locked card ****2222 for signer Sarah Patel.',
    ipAddress: '192.168.1.100',
    metadata: { cardId: 'card-3003', signerId: 'sig-2003', reason: 'Reported lost' },
  },
  {
    id: uuidv4(),
    timestamp: '2025-01-08T16:20:00Z',
    userId: 'usr-001',
    userName: 'Jordan Mitchell',
    action: 'UNLOCK_CARD',
    description: 'Unlocked card ****8765 for signer Marcus Williams.',
    ipAddress: '192.168.1.100',
    metadata: { cardId: 'card-3002', signerId: 'sig-2002' },
  },
  {
    id: uuidv4(),
    timestamp: '2025-01-07T09:00:00Z',
    userId: 'usr-001',
    userName: 'Jordan Mitchell',
    action: 'RESEND_PIN',
    description: 'Resent PIN for card ****5555 to signer Emily Chen.',
    ipAddress: '192.168.1.100',
    metadata: { cardId: 'card-3004', signerId: 'sig-2004' },
  },
  {
    id: uuidv4(),
    timestamp: '2025-01-05T11:45:00Z',
    userId: 'usr-001',
    userName: 'Jordan Mitchell',
    action: 'REPLACE_CARD',
    description: 'Initiated replacement for card ****8888 for signer Sarah Patel.',
    ipAddress: '192.168.1.100',
    metadata: { cardId: 'card-3011', signerId: 'sig-2003', newCardId: 'card-3003' },
  },
  {
    id: uuidv4(),
    timestamp: '2025-01-05T08:30:00Z',
    userId: 'usr-001',
    userName: 'Jordan Mitchell',
    action: 'ACTIVATE_CARD',
    description: 'Activated card ****7777 for signer Marcus Williams.',
    ipAddress: '192.168.1.100',
    metadata: { cardId: 'card-3007', signerId: 'sig-2006' },
  },
  {
    id: uuidv4(),
    timestamp: '2025-01-04T13:10:00Z',
    userId: 'usr-001',
    userName: 'Jordan Mitchell',
    action: 'LOGIN_FAILED',
    description: 'Failed login attempt — invalid password.',
    ipAddress: '192.168.1.100',
    metadata: { reason: 'invalid_password' },
  },
  {
    id: uuidv4(),
    timestamp: '2025-01-03T17:00:00Z',
    userId: 'usr-001',
    userName: 'Jordan Mitchell',
    action: 'LOGOUT',
    description: 'User logged out.',
    ipAddress: '192.168.1.100',
    metadata: {},
  },
];

// ---- Helper: look-up functions ----

/**
 * Returns signers for a given account ID.
 * @param {string} accountId
 * @returns {Array<Object>}
 */
export function getSignersByAccountId(accountId) {
  return MOCK_SIGNERS.filter((signer) => signer.accountId === accountId);
}

/**
 * Returns cards for a given signer ID.
 * @param {string} signerId
 * @returns {Array<Object>}
 */
export function getCardsBySignerId(signerId) {
  return MOCK_CARDS.filter((card) => card.signerId === signerId);
}

/**
 * Returns cards for a given account ID.
 * @param {string} accountId
 * @returns {Array<Object>}
 */
export function getCardsByAccountId(accountId) {
  return MOCK_CARDS.filter((card) => card.accountId === accountId);
}

/**
 * Returns a single signer by ID.
 * @param {string} signerId
 * @returns {Object|undefined}
 */
export function getSignerById(signerId) {
  return MOCK_SIGNERS.find((signer) => signer.id === signerId);
}

/**
 * Returns a single card by ID.
 * @param {string} cardId
 * @returns {Object|undefined}
 */
export function getCardById(cardId) {
  return MOCK_CARDS.find((card) => card.id === cardId);
}

/**
 * Returns a single account by ID.
 * @param {string} accountId
 * @returns {Object|undefined}
 */
export function getAccountById(accountId) {
  return MOCK_ACCOUNTS.find((account) => account.id === accountId);
}

/**
 * Searches signers by name, email, or last four SSN across all accounts.
 * @param {string} query - Search term (case-insensitive)
 * @returns {Array<Object>}
 */
export function searchSigners(query) {
  if (!query || query.trim().length < 2) {
    return [];
  }
  const lowerQuery = query.toLowerCase().trim();
  return MOCK_SIGNERS.filter(
    (signer) =>
      signer.fullName.toLowerCase().includes(lowerQuery) ||
      signer.firstName.toLowerCase().includes(lowerQuery) ||
      signer.lastName.toLowerCase().includes(lowerQuery) ||
      signer.email.toLowerCase().includes(lowerQuery) ||
      signer.lastFourSSN.includes(lowerQuery)
  );
}

/**
 * Searches cards by masked card number or cardholder name.
 * @param {string} query - Search term (case-insensitive)
 * @returns {Array<Object>}
 */
export function searchCards(query) {
  if (!query || query.trim().length < 2) {
    return [];
  }
  const lowerQuery = query.toLowerCase().trim();
  return MOCK_CARDS.filter(
    (card) =>
      card.cardNumber.toLowerCase().includes(lowerQuery) ||
      card.cardholderName.toLowerCase().includes(lowerQuery)
  );
}