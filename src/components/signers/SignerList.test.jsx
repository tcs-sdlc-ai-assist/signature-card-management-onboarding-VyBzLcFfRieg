import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { SignerList } from './SignerList.jsx';
import { AccountContext } from '../../context/AccountContext.jsx';
import { SIGNER_STATUSES } from '../../constants/constants.js';

/**
 * Mock signer data for tests.
 */
const MOCK_SIGNERS_LIST = [
  {
    id: 'sig-001',
    accountId: 'acct-1001',
    firstName: 'Emily',
    lastName: 'Chen',
    fullName: 'Emily Chen',
    role: 'authorized_signer',
    status: SIGNER_STATUSES.ACTIVE,
    email: 'emily.chen@example.com',
    phone: '(555) 234-5678',
    lastFourSSN: '4589',
  },
  {
    id: 'sig-002',
    accountId: 'acct-1001',
    firstName: 'Marcus',
    lastName: 'Williams',
    fullName: 'Marcus Williams',
    role: 'authorized_signer',
    status: SIGNER_STATUSES.LOCKED,
    email: 'marcus.williams@example.com',
    phone: '(555) 345-6789',
    lastFourSSN: '7823',
  },
  {
    id: 'sig-003',
    accountId: 'acct-1001',
    firstName: 'David',
    lastName: 'Nguyen',
    fullName: 'David Nguyen',
    role: 'authorized_signer',
    status: SIGNER_STATUSES.PENDING,
    email: 'david.nguyen@example.com',
    phone: '(555) 567-8901',
    lastFourSSN: '9012',
  },
];

const MOCK_SELECTED_ACCOUNT = {
  id: 'acct-1001',
  accountNumber: '****7821',
  accountName: 'Mitchell & Associates Operating',
  accountType: 'business_checking',
  status: 'active',
  signerCount: 3,
};

/**
 * Builds a mock AccountContext value with sensible defaults.
 *
 * @param {Object} [overrides] - Properties to override on the default context.
 * @returns {Object} A mock AccountContext value.
 */
function buildMockAccountContext(overrides = {}) {
  return {
    accounts: [MOCK_SELECTED_ACCOUNT],
    selectedAccount: MOCK_SELECTED_ACCOUNT,
    signers: MOCK_SIGNERS_LIST,
    stagedChanges: {
      additions: [],
      edits: [],
      removals: [],
      totalChanges: 0,
      hasChanges: false,
    },
    submissionResult: null,
    loading: false,
    error: null,
    sortConfig: {
      sortBy: 'fullName',
      sortDirection: 'asc',
    },
    filterConfig: {
      status: '',
      query: '',
    },
    selectAccount: vi.fn(),
    addSigner: vi.fn(),
    editSigner: vi.fn(),
    removeSigner: vi.fn(() => ({ status: 'success', message: 'Signer removed.' })),
    unlockSigner: vi.fn(() => ({ status: 'success', message: 'Signer unlocked.' })),
    resendInvitation: vi.fn(() => ({ status: 'success', message: 'Invitation resent.' })),
    submitChanges: vi.fn(),
    clearChanges: vi.fn(),
    clearError: vi.fn(),
    clearSubmissionResult: vi.fn(),
    setSortConfig: vi.fn(),
    setFilterConfig: vi.fn(),
    refreshSigners: vi.fn(),
    ...overrides,
  };
}

/**
 * Renders the SignerList wrapped in the AccountContext provider with the
 * given context value.
 *
 * @param {Object} [contextOverrides] - Overrides for the mock account context.
 * @param {Object} [props] - Props to pass to SignerList.
 * @returns {{ contextValue: Object }} The mock context value for assertions.
 */
function renderSignerList(contextOverrides = {}, props = {}) {
  const contextValue = buildMockAccountContext(contextOverrides);

  render(
    <AccountContext.Provider value={contextValue}>
      <SignerList {...props} />
    </AccountContext.Provider>
  );

  return { contextValue };
}

describe('SignerList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ---- Rendering ----

  describe('rendering', () => {
    it('renders the Authorized Signers heading', () => {
      renderSignerList();

      expect(screen.getByRole('heading', { name: /authorized signers/i })).toBeInTheDocument();
    });

    it('renders all signers with correct names', () => {
      renderSignerList();

      expect(screen.getByText('Emily Chen')).toBeInTheDocument();
      expect(screen.getByText('Marcus Williams')).toBeInTheDocument();
      expect(screen.getByText('David Nguyen')).toBeInTheDocument();
    });

    it('renders signer email addresses', () => {
      renderSignerList();

      expect(screen.getByText('emily.chen@example.com')).toBeInTheDocument();
      expect(screen.getByText('marcus.williams@example.com')).toBeInTheDocument();
      expect(screen.getByText('david.nguyen@example.com')).toBeInTheDocument();
    });

    it('renders signer phone numbers', () => {
      renderSignerList();

      expect(screen.getByText('(555) 234-5678')).toBeInTheDocument();
      expect(screen.getByText('(555) 345-6789')).toBeInTheDocument();
      expect(screen.getByText('(555) 567-8901')).toBeInTheDocument();
    });

    it('renders signer roles as Authorized Signer', () => {
      renderSignerList();

      const roleCells = screen.getAllByText('Authorized Signer');
      expect(roleCells.length).toBe(3);
    });

    it('renders signer status badges', () => {
      renderSignerList();

      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('Locked')).toBeInTheDocument();
      expect(screen.getByText('Pending')).toBeInTheDocument();
    });

    it('renders the signer table with accessible label', () => {
      renderSignerList();

      const table = screen.getByRole('table', { name: /authorized signers list/i });
      expect(table).toBeInTheDocument();
    });

    it('renders column headers for Name, Role, Status, Contact, and Actions', () => {
      renderSignerList();

      expect(screen.getByRole('columnheader', { name: /name/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /role/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /status/i })).toBeInTheDocument();
      expect(screen.getByText('Contact')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });
  });

  // ---- Total count displayed ----

  describe('total count displayed', () => {
    it('displays the total signer count', () => {
      renderSignerList();

      expect(screen.getByText(/3 signers/i)).toBeInTheDocument();
    });

    it('displays singular form for 1 signer', () => {
      renderSignerList({
        signers: [MOCK_SIGNERS_LIST[0]],
      });

      expect(screen.getByText(/1 signer for/i)).toBeInTheDocument();
    });

    it('displays the account name in the signer count text', () => {
      renderSignerList();

      expect(screen.getByText(/Mitchell & Associates Operating/i)).toBeInTheDocument();
    });

    it('displays the account number in the signer count text', () => {
      renderSignerList();

      expect(screen.getByText(/\*\*\*\*7821/)).toBeInTheDocument();
    });
  });

  // ---- Add Signer button ----

  describe('Add Signer button', () => {
    it('renders the Add Signer button when onAddSigner is provided', () => {
      const onAddSigner = vi.fn();
      renderSignerList({}, { onAddSigner });

      const addButton = screen.getByRole('button', { name: /add a new authorized signer/i });
      expect(addButton).toBeInTheDocument();
    });

    it('does not render the Add Signer button when onAddSigner is not provided', () => {
      renderSignerList({}, { onAddSigner: undefined });

      const addButton = screen.queryByRole('button', { name: /add a new authorized signer/i });
      expect(addButton).not.toBeInTheDocument();
    });

    it('calls onAddSigner when the Add Signer button is clicked', async () => {
      const user = userEvent.setup();
      const onAddSigner = vi.fn();
      renderSignerList({}, { onAddSigner });

      const addButton = screen.getByRole('button', { name: /add a new authorized signer/i });
      await user.click(addButton);

      expect(onAddSigner).toHaveBeenCalledTimes(1);
    });
  });

  // ---- Action buttons per signer status ----

  describe('action buttons per signer status', () => {
    it('renders Edit and Remove buttons for all signers when onEditSigner is provided', () => {
      const onEditSigner = vi.fn();
      renderSignerList({}, { onEditSigner });

      const editButtons = screen.getAllByRole('button', { name: /edit signer/i });
      expect(editButtons.length).toBe(3);

      const removeButtons = screen.getAllByRole('button', { name: /remove signer/i });
      expect(removeButtons.length).toBe(3);
    });

    it('renders Unlock button only for locked signers', () => {
      renderSignerList({}, { onEditSigner: vi.fn() });

      const unlockButtons = screen.getAllByRole('button', { name: /unlock signer/i });
      expect(unlockButtons.length).toBe(1);
      expect(unlockButtons[0]).toHaveAttribute('aria-label', 'Unlock signer Marcus Williams');
    });

    it('renders Resend button only for pending signers', () => {
      renderSignerList({}, { onEditSigner: vi.fn() });

      const resendButtons = screen.getAllByRole('button', { name: /resend invitation/i });
      expect(resendButtons.length).toBe(1);
      expect(resendButtons[0]).toHaveAttribute('aria-label', 'Resend invitation to David Nguyen');
    });

    it('does not render Unlock button for active signers', () => {
      renderSignerList({
        signers: [MOCK_SIGNERS_LIST[0]], // Active signer only
      }, { onEditSigner: vi.fn() });

      const unlockButtons = screen.queryAllByRole('button', { name: /unlock signer/i });
      expect(unlockButtons.length).toBe(0);
    });

    it('does not render Resend button for active signers', () => {
      renderSignerList({
        signers: [MOCK_SIGNERS_LIST[0]], // Active signer only
      }, { onEditSigner: vi.fn() });

      const resendButtons = screen.queryAllByRole('button', { name: /resend invitation/i });
      expect(resendButtons.length).toBe(0);
    });

    it('does not render Unlock button for pending signers', () => {
      renderSignerList({
        signers: [MOCK_SIGNERS_LIST[2]], // Pending signer only
      }, { onEditSigner: vi.fn() });

      const unlockButtons = screen.queryAllByRole('button', { name: /unlock signer/i });
      expect(unlockButtons.length).toBe(0);
    });

    it('does not render Resend button for locked signers', () => {
      renderSignerList({
        signers: [MOCK_SIGNERS_LIST[1]], // Locked signer only
      }, { onEditSigner: vi.fn() });

      const resendButtons = screen.queryAllByRole('button', { name: /resend invitation/i });
      expect(resendButtons.length).toBe(0);
    });
  });

  // ---- Action button callbacks ----

  describe('action button callbacks', () => {
    it('calls onEditSigner with the signer object when Edit is clicked', async () => {
      const user = userEvent.setup();
      const onEditSigner = vi.fn();
      renderSignerList({}, { onEditSigner });

      const editButtons = screen.getAllByRole('button', { name: /edit signer/i });
      await user.click(editButtons[0]);

      expect(onEditSigner).toHaveBeenCalledTimes(1);
      expect(onEditSigner).toHaveBeenCalledWith(expect.objectContaining({
        id: expect.any(String),
        fullName: expect.any(String),
      }));
    });

    it('calls unlockSigner when Unlock is clicked', async () => {
      const user = userEvent.setup();
      const unlockSigner = vi.fn(() => ({ status: 'success', message: 'Unlocked.' }));
      renderSignerList({ unlockSigner }, { onEditSigner: vi.fn() });

      const unlockButton = screen.getByRole('button', { name: /unlock signer marcus williams/i });
      await user.click(unlockButton);

      expect(unlockSigner).toHaveBeenCalledTimes(1);
      expect(unlockSigner).toHaveBeenCalledWith('sig-002');
    });

    it('calls resendInvitation when Resend is clicked', async () => {
      const user = userEvent.setup();
      const resendInvitation = vi.fn(() => ({ status: 'success', message: 'Resent.' }));
      renderSignerList({ resendInvitation }, { onEditSigner: vi.fn() });

      const resendButton = screen.getByRole('button', { name: /resend invitation to david nguyen/i });
      await user.click(resendButton);

      expect(resendInvitation).toHaveBeenCalledTimes(1);
      expect(resendInvitation).toHaveBeenCalledWith('sig-003');
    });
  });

  // ---- Sorting ----

  describe('sorting', () => {
    it('calls setSortConfig when a sortable column header is clicked', async () => {
      const user = userEvent.setup();
      const setSortConfig = vi.fn();
      renderSignerList({ setSortConfig });

      const nameHeader = screen.getByRole('columnheader', { name: /name/i });
      await user.click(nameHeader);

      expect(setSortConfig).toHaveBeenCalledTimes(1);
      expect(setSortConfig).toHaveBeenCalledWith(expect.any(Function));
    });

    it('calls setSortConfig when Status column header is clicked', async () => {
      const user = userEvent.setup();
      const setSortConfig = vi.fn();
      renderSignerList({ setSortConfig });

      const statusHeader = screen.getByRole('columnheader', { name: /status/i });
      await user.click(statusHeader);

      expect(setSortConfig).toHaveBeenCalledTimes(1);
    });

    it('calls setSortConfig when Role column header is clicked', async () => {
      const user = userEvent.setup();
      const setSortConfig = vi.fn();
      renderSignerList({ setSortConfig });

      const roleHeader = screen.getByRole('columnheader', { name: /role/i });
      await user.click(roleHeader);

      expect(setSortConfig).toHaveBeenCalledTimes(1);
    });

    it('toggles sort direction when the same column is clicked twice', async () => {
      const user = userEvent.setup();
      const setSortConfig = vi.fn();
      renderSignerList({
        setSortConfig,
        sortConfig: { sortBy: 'fullName', sortDirection: 'asc' },
      });

      const nameHeader = screen.getByRole('columnheader', { name: /name/i });
      await user.click(nameHeader);

      expect(setSortConfig).toHaveBeenCalledTimes(1);

      // Call the updater function to verify it toggles direction
      const updaterFn = setSortConfig.mock.calls[0][0];
      const result = updaterFn({ sortBy: 'fullName', sortDirection: 'asc' });
      expect(result).toEqual({ sortBy: 'fullName', sortDirection: 'desc' });
    });

    it('sets ascending direction when a different column is clicked', async () => {
      const user = userEvent.setup();
      const setSortConfig = vi.fn();
      renderSignerList({
        setSortConfig,
        sortConfig: { sortBy: 'fullName', sortDirection: 'asc' },
      });

      const statusHeader = screen.getByRole('columnheader', { name: /status/i });
      await user.click(statusHeader);

      const updaterFn = setSortConfig.mock.calls[0][0];
      const result = updaterFn({ sortBy: 'fullName', sortDirection: 'asc' });
      expect(result).toEqual({ sortBy: 'status', sortDirection: 'asc' });
    });

    it('activates sort via keyboard Enter on column header', async () => {
      const user = userEvent.setup();
      const setSortConfig = vi.fn();
      renderSignerList({ setSortConfig });

      const nameHeader = screen.getByRole('columnheader', { name: /name/i });
      nameHeader.focus();
      await user.keyboard('{Enter}');

      expect(setSortConfig).toHaveBeenCalledTimes(1);
    });
  });

  // ---- Filtering ----

  describe('filtering by status', () => {
    it('renders the status filter dropdown', () => {
      renderSignerList();

      const filterSelect = screen.getByRole('combobox', { name: /filter signers by status/i });
      expect(filterSelect).toBeInTheDocument();
    });

    it('calls setFilterConfig when status filter is changed', async () => {
      const user = userEvent.setup();
      const setFilterConfig = vi.fn();
      renderSignerList({ setFilterConfig });

      const filterSelect = screen.getByRole('combobox', { name: /filter signers by status/i });
      await user.selectOptions(filterSelect, 'active');

      expect(setFilterConfig).toHaveBeenCalledTimes(1);
      expect(setFilterConfig).toHaveBeenCalledWith(expect.any(Function));

      // Call the updater function to verify it sets the correct status
      const updaterFn = setFilterConfig.mock.calls[0][0];
      const result = updaterFn({ status: '', query: '' });
      expect(result).toEqual({ status: 'active', query: '' });
    });

    it('renders All Statuses option in the filter dropdown', () => {
      renderSignerList();

      const filterSelect = screen.getByRole('combobox', { name: /filter signers by status/i });
      const options = within(filterSelect).getAllByRole('option');

      const allOption = options.find((opt) => opt.textContent === 'All Statuses');
      expect(allOption).toBeDefined();
    });

    it('renders Active, Pending, and Locked options in the filter dropdown', () => {
      renderSignerList();

      const filterSelect = screen.getByRole('combobox', { name: /filter signers by status/i });
      const options = within(filterSelect).getAllByRole('option');
      const optionTexts = options.map((opt) => opt.textContent);

      expect(optionTexts).toContain('Active');
      expect(optionTexts).toContain('Pending');
      expect(optionTexts).toContain('Locked');
    });
  });

  // ---- Search ----

  describe('search', () => {
    it('renders the search input', () => {
      renderSignerList();

      const searchInput = screen.getByRole('textbox', { name: /search signers/i });
      expect(searchInput).toBeInTheDocument();
    });

    it('calls setFilterConfig when search query is typed', async () => {
      const user = userEvent.setup();
      const setFilterConfig = vi.fn();
      renderSignerList({ setFilterConfig });

      const searchInput = screen.getByRole('textbox', { name: /search signers/i });
      await user.type(searchInput, 'Emily');

      expect(setFilterConfig).toHaveBeenCalled();

      // Verify the updater function sets the query
      const lastCall = setFilterConfig.mock.calls[setFilterConfig.mock.calls.length - 1][0];
      const result = lastCall({ status: '', query: '' });
      expect(result.query).toBe('y'); // last character typed
    });
  });

  // ---- Loading state ----

  describe('loading state', () => {
    it('shows loading spinner when loading with no signers', () => {
      renderSignerList({ loading: true, signers: [] });

      expect(screen.getByText(/loading signers/i)).toBeInTheDocument();
    });

    it('shows updating spinner when loading with existing signers', () => {
      renderSignerList({ loading: true });

      expect(screen.getByText(/updating signers/i)).toBeInTheDocument();
    });
  });

  // ---- Error state ----

  describe('error state', () => {
    it('shows error alert when error exists and no signers', () => {
      renderSignerList({ error: 'Failed to load signers.', signers: [] });

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Failed to load signers.')).toBeInTheDocument();
    });

    it('shows warning alert when error exists with signers', () => {
      renderSignerList({ error: 'Partial load failure.' });

      expect(screen.getByText('Partial load failure.')).toBeInTheDocument();
    });
  });

  // ---- Empty state ----

  describe('empty state', () => {
    it('shows info message when no signers match criteria', () => {
      renderSignerList({ signers: [] });

      expect(screen.getByText(/no signers found matching your criteria/i)).toBeInTheDocument();
    });
  });

  // ---- No account selected ----

  describe('no account selected', () => {
    it('shows info message when no account is selected', () => {
      renderSignerList({ selectedAccount: null });

      expect(screen.getByText(/please select an account/i)).toBeInTheDocument();
    });

    it('does not render the signer table when no account is selected', () => {
      renderSignerList({ selectedAccount: null });

      const table = screen.queryByRole('table');
      expect(table).not.toBeInTheDocument();
    });
  });

  // ---- Remove signer modal ----

  describe('remove signer modal', () => {
    it('opens remove confirmation modal when Remove button is clicked', async () => {
      const user = userEvent.setup();
      renderSignerList({}, { onEditSigner: vi.fn() });

      const removeButtons = screen.getAllByRole('button', { name: /remove signer/i });
      await user.click(removeButtons[0]);

      await waitFor(() => {
        expect(screen.getByText(/are you sure you want to remove/i)).toBeInTheDocument();
      });
    });

    it('calls removeSigner when removal is confirmed', async () => {
      const user = userEvent.setup();
      const removeSigner = vi.fn(() => ({ status: 'success', message: 'Removed.' }));
      renderSignerList({ removeSigner }, { onEditSigner: vi.fn() });

      const removeButtons = screen.getAllByRole('button', { name: /remove signer/i });
      await user.click(removeButtons[0]);

      await waitFor(() => {
        expect(screen.getByText(/are you sure you want to remove/i)).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: 'Remove' });
      await user.click(confirmButton);

      expect(removeSigner).toHaveBeenCalledTimes(1);
    });

    it('closes remove modal when Cancel is clicked', async () => {
      const user = userEvent.setup();
      renderSignerList({}, { onEditSigner: vi.fn() });

      const removeButtons = screen.getAllByRole('button', { name: /remove signer/i });
      await user.click(removeButtons[0]);

      await waitFor(() => {
        expect(screen.getByText(/are you sure you want to remove/i)).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByText(/are you sure you want to remove/i)).not.toBeInTheDocument();
      });
    });
  });

  // ---- Action messages ----

  describe('action messages', () => {
    it('shows success message after successful unlock', async () => {
      const user = userEvent.setup();
      const unlockSigner = vi.fn(() => ({
        status: 'success',
        message: 'Signer "Marcus Williams" has been unlocked.',
      }));
      renderSignerList({ unlockSigner }, { onEditSigner: vi.fn() });

      const unlockButton = screen.getByRole('button', { name: /unlock signer marcus williams/i });
      await user.click(unlockButton);

      await waitFor(() => {
        expect(screen.getByText(/marcus williams.*has been unlocked/i)).toBeInTheDocument();
      });
    });

    it('shows success message after successful resend', async () => {
      const user = userEvent.setup();
      const resendInvitation = vi.fn(() => ({
        status: 'success',
        message: 'Invitation resent to "David Nguyen".',
      }));
      renderSignerList({ resendInvitation }, { onEditSigner: vi.fn() });

      const resendButton = screen.getByRole('button', { name: /resend invitation to david nguyen/i });
      await user.click(resendButton);

      await waitFor(() => {
        expect(screen.getByText(/invitation resent to.*david nguyen/i)).toBeInTheDocument();
      });
    });

    it('shows error message when unlock fails', async () => {
      const user = userEvent.setup();
      const unlockSigner = vi.fn(() => ({
        status: 'error',
        message: 'Failed to unlock signer.',
      }));
      renderSignerList({ unlockSigner }, { onEditSigner: vi.fn() });

      const unlockButton = screen.getByRole('button', { name: /unlock signer marcus williams/i });
      await user.click(unlockButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to unlock signer.')).toBeInTheDocument();
      });
    });
  });

  // ---- Screen reader status ----

  describe('screen reader status', () => {
    it('announces signer count to screen readers', () => {
      renderSignerList();

      const srStatus = screen.getByText(/3 signers found/i);
      expect(srStatus).toBeInTheDocument();
    });
  });

  // ---- Edge cases ----

  describe('edge cases', () => {
    it('handles signers without email or phone gracefully', () => {
      const signersNoContact = [
        {
          id: 'sig-100',
          accountId: 'acct-1001',
          firstName: 'No',
          lastName: 'Contact',
          fullName: 'No Contact',
          role: 'authorized_signer',
          status: SIGNER_STATUSES.ACTIVE,
          email: '',
          phone: '',
          lastFourSSN: '0000',
        },
      ];

      renderSignerList({ signers: signersNoContact });

      expect(screen.getByText('No Contact')).toBeInTheDocument();
      expect(screen.getByText(/no contact info/i)).toBeInTheDocument();
    });

    it('handles signer without fullName by using firstName + lastName', () => {
      const signersNoFullName = [
        {
          id: 'sig-200',
          accountId: 'acct-1001',
          firstName: 'Test',
          lastName: 'User',
          fullName: '',
          role: 'authorized_signer',
          status: SIGNER_STATUSES.ACTIVE,
          email: 'test@example.com',
          phone: '(555) 000-0000',
          lastFourSSN: '1111',
        },
      ];

      renderSignerList({ signers: signersNoFullName });

      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    it('does not render Edit buttons when onEditSigner is not provided', () => {
      renderSignerList({}, { onEditSigner: undefined });

      const editButtons = screen.queryAllByRole('button', { name: /edit signer/i });
      expect(editButtons.length).toBe(0);
    });

    it('dismisses action message when dismiss is clicked', async () => {
      const user = userEvent.setup();
      const unlockSigner = vi.fn(() => ({
        status: 'success',
        message: 'Signer unlocked successfully.',
      }));
      renderSignerList({ unlockSigner }, { onEditSigner: vi.fn() });

      const unlockButton = screen.getByRole('button', { name: /unlock signer marcus williams/i });
      await user.click(unlockButton);

      await waitFor(() => {
        expect(screen.getByText('Signer unlocked successfully.')).toBeInTheDocument();
      });

      const dismissButton = screen.getByRole('button', { name: /dismiss alert/i });
      await user.click(dismissButton);

      await waitFor(() => {
        expect(screen.queryByText('Signer unlocked successfully.')).not.toBeInTheDocument();
      });
    });
  });
});