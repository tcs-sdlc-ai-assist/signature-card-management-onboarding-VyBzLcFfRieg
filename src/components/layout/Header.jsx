/**
 * Application header component with branding and user info.
 *
 * Renders a responsive header bar with the application logo/brand area,
 * authenticated user information display, and a logout button. Includes
 * a mobile hamburger menu for smaller viewports.
 *
 * Integrates with {@link AuthContext} for user state and logout action.
 * Uses HB CSS framework classes for styling consistency and proper
 * ARIA navigation landmarks for accessibility.
 *
 * @module Header
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '../../context/AuthContext.jsx';

/**
 * SIG logo SVG icon for the brand area.
 *
 * @returns {React.ReactElement} An SVG logo icon.
 */
function LogoIcon() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      focusable="false"
      style={{ flexShrink: 0 }}
    >
      <rect width="32" height="32" rx="6" fill="var(--hb-primary-blue)" />
      <text
        x="16"
        y="22"
        textAnchor="middle"
        fill="var(--hb-primary-white)"
        fontSize="14"
        fontWeight="700"
        fontFamily="Roboto, Arial, sans-serif"
      >
        SIG
      </text>
    </svg>
  );
}

/**
 * User avatar SVG icon for the user info display.
 *
 * @returns {React.ReactElement} An SVG user avatar icon.
 */
function UserAvatarIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      style={{ color: 'var(--hb-primary-blue)', flexShrink: 0 }}
    >
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z"
        clipRule="evenodd"
      />
    </svg>
  );
}

/**
 * Hamburger menu SVG icon for mobile navigation toggle.
 *
 * @returns {React.ReactElement} An SVG hamburger icon.
 */
function HamburgerIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fillRule="evenodd"
        d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
        clipRule="evenodd"
      />
    </svg>
  );
}

/**
 * Close SVG icon for dismissing the mobile menu.
 *
 * @returns {React.ReactElement} An SVG close icon.
 */
function CloseIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fillRule="evenodd"
        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
        clipRule="evenodd"
      />
    </svg>
  );
}

/**
 * Logout SVG icon for the logout button.
 *
 * @returns {React.ReactElement} An SVG logout icon.
 */
function LogoutIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      style={{ flexShrink: 0 }}
    >
      <path
        fillRule="evenodd"
        d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z"
        clipRule="evenodd"
      />
    </svg>
  );
}

/**
 * Application header component.
 *
 * Renders a responsive header bar with the application logo/brand,
 * authenticated user information, and a logout button. On smaller
 * viewports, a hamburger menu toggle reveals the user info and
 * logout action in a dropdown panel.
 *
 * Integrates with {@link AuthContext} for user state and logout.
 *
 * @param {Object} [props]
 * @param {string} [props.className] - Additional CSS class names to apply
 *   to the header element.
 * @returns {React.ReactElement} The rendered header component.
 */
export function Header({ className = '' }) {
  const { user, isAuthenticated, logout } = useAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef(null);
  const toggleButtonRef = useRef(null);

  /**
   * Handles the logout button click.
   */
  const handleLogout = useCallback(() => {
    setMobileMenuOpen(false);

    if (typeof logout === 'function') {
      try {
        logout();
      } catch {
        // Logout errors must not break the header.
      }
    }
  }, [logout]);

  /**
   * Toggles the mobile menu open/closed state.
   */
  const handleToggleMobileMenu = useCallback(() => {
    setMobileMenuOpen((prev) => !prev);
  }, []);

  /**
   * Closes the mobile menu.
   */
  const handleCloseMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  /**
   * Handles keyboard events on the mobile menu toggle button.
   *
   * @param {React.KeyboardEvent} event - The keyboard event.
   */
  const handleToggleKeyDown = useCallback((event) => {
    if (event.key === 'Escape' && mobileMenuOpen) {
      event.preventDefault();
      setMobileMenuOpen(false);
      if (toggleButtonRef.current) {
        toggleButtonRef.current.focus();
      }
    }
  }, [mobileMenuOpen]);

  /**
   * Closes the mobile menu when clicking outside of it.
   */
  useEffect(() => {
    if (!mobileMenuOpen) {
      return;
    }

    const handleClickOutside = (event) => {
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target) &&
        toggleButtonRef.current &&
        !toggleButtonRef.current.contains(event.target)
      ) {
        setMobileMenuOpen(false);
      }
    };

    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false);
        if (toggleButtonRef.current) {
          toggleButtonRef.current.focus();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [mobileMenuOpen]);

  const userName = user
    ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'User'
    : '';

  const userRole = user
    ? user.role === 'controlling_party'
      ? 'Controlling Party'
      : (user.role || '')
    : '';

  const headerClassName = [className].filter(Boolean).join(' ');

  return (
    <header
      className={headerClassName}
      role="banner"
      style={{
        width: '100%',
        backgroundColor: 'var(--hb-primary-white)',
        borderBottom: '2px solid var(--hb-primary-blue)',
        boxShadow: 'var(--hb-shadow-sm)',
        position: 'sticky',
        top: 0,
        zIndex: 'var(--hb-z-sticky)',
      }}
    >
      <div
        className="fluid-wrapper"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '64px',
        }}
      >
        {/* Brand area */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--hb-space-sm)',
          }}
        >
          <LogoIcon />
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              lineHeight: 1.2,
            }}
          >
            <span
              style={{
                fontSize: 'var(--hb-font-size-lg)',
                fontWeight: 700,
                color: 'var(--hb-primary-blue)',
                letterSpacing: '0.02em',
              }}
            >
              SIG Card Management
            </span>
            <span
              style={{
                fontSize: 'var(--hb-font-size-xs)',
                color: 'var(--hb-secondary-gray)',
                fontWeight: 400,
              }}
            >
              Secure Card Management Portal
            </span>
          </div>
        </div>

        {/* Desktop user info and logout — hidden on mobile */}
        {isAuthenticated && user && (
          <nav
            aria-label="User actions"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--hb-space-md)',
            }}
          >
            {/* Desktop user info */}
            <div
              className="d-none d-sm-flex"
              style={{
                alignItems: 'center',
                gap: 'var(--hb-space-sm)',
              }}
            >
              <UserAvatarIcon />
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  lineHeight: 1.3,
                }}
              >
                <span
                  style={{
                    fontSize: 'var(--hb-font-size-sm)',
                    fontWeight: 500,
                    color: 'var(--hb-primary-black)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '180px',
                  }}
                >
                  {userName}
                </span>
                {userRole && (
                  <span
                    style={{
                      fontSize: 'var(--hb-font-size-xs)',
                      color: 'var(--hb-secondary-gray)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {userRole}
                  </span>
                )}
              </div>
            </div>

            {/* Desktop logout button */}
            <button
              type="button"
              className="button-secondary-2 button-sm d-none d-sm-flex"
              onClick={handleLogout}
              aria-label="Log out of your account"
              style={{
                gap: 'var(--hb-space-xs)',
              }}
            >
              <LogoutIcon />
              Log Out
            </button>

            {/* Mobile hamburger toggle */}
            <div
              style={{
                position: 'relative',
              }}
            >
              <button
                ref={toggleButtonRef}
                type="button"
                className="d-sm-none"
                onClick={handleToggleMobileMenu}
                onKeyDown={handleToggleKeyDown}
                aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                aria-expanded={mobileMenuOpen ? 'true' : 'false'}
                aria-controls="mobile-nav-menu"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '40px',
                  height: '40px',
                  padding: 0,
                  border: '1px solid var(--hb-secondary-gray-light)',
                  borderRadius: 'var(--hb-radius-sm)',
                  backgroundColor: 'var(--hb-primary-white)',
                  color: 'var(--hb-primary-black)',
                  cursor: 'pointer',
                  transition: 'background-color var(--hb-transition-fast)',
                }}
              >
                {mobileMenuOpen ? <CloseIcon /> : <HamburgerIcon />}
              </button>

              {/* Mobile dropdown menu */}
              {mobileMenuOpen && (
                <div
                  ref={mobileMenuRef}
                  id="mobile-nav-menu"
                  role="menu"
                  aria-label="User navigation menu"
                  className="d-sm-none"
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + var(--hb-space-xs))',
                    right: 0,
                    minWidth: '220px',
                    backgroundColor: 'var(--hb-primary-white)',
                    borderRadius: 'var(--hb-radius-md)',
                    boxShadow: 'var(--hb-shadow-md)',
                    border: '1px solid var(--hb-secondary-gray-light)',
                    zIndex: 'var(--hb-z-dropdown)',
                    overflow: 'hidden',
                    animation: 'hb-fade-in var(--hb-transition-fast)',
                  }}
                >
                  {/* Mobile user info */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--hb-space-sm)',
                      padding: 'var(--hb-space-md)',
                      borderBottom: '1px solid var(--hb-secondary-gray-light)',
                    }}
                    role="menuitem"
                  >
                    <UserAvatarIcon />
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        lineHeight: 1.3,
                        minWidth: 0,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 'var(--hb-font-size-sm)',
                          fontWeight: 500,
                          color: 'var(--hb-primary-black)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {userName}
                      </span>
                      {userRole && (
                        <span
                          style={{
                            fontSize: 'var(--hb-font-size-xs)',
                            color: 'var(--hb-secondary-gray)',
                          }}
                        >
                          {userRole}
                        </span>
                      )}
                      {user.email && (
                        <span
                          style={{
                            fontSize: 'var(--hb-font-size-xs)',
                            color: 'var(--hb-secondary-gray)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                          title={user.email}
                        >
                          {user.email}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Mobile logout button */}
                  <div
                    style={{
                      padding: 'var(--hb-space-sm)',
                    }}
                  >
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleLogout}
                      aria-label="Log out of your account"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--hb-space-sm)',
                        width: '100%',
                        padding: 'var(--hb-space-sm) var(--hb-space-md)',
                        border: 'none',
                        borderRadius: 'var(--hb-radius-sm)',
                        backgroundColor: 'transparent',
                        color: 'var(--hb-secondary-red)',
                        fontSize: 'var(--hb-font-size-sm)',
                        fontWeight: 500,
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background-color var(--hb-transition-fast)',
                      }}
                    >
                      <LogoutIcon />
                      Log Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </nav>
        )}

        {/* Unauthenticated state — show nothing on the right */}
        {!isAuthenticated && (
          <div
            style={{
              fontSize: 'var(--hb-font-size-sm)',
              color: 'var(--hb-secondary-gray)',
            }}
            aria-live="polite"
          >
            {/* Intentionally empty — no user actions when not authenticated */}
          </div>
        )}
      </div>
    </header>
  );
}

Header.propTypes = {
  className: PropTypes.string,
};

export default Header;