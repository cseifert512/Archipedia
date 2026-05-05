import React from 'react';
import { UserButton as ClerkUserButton } from '@clerk/clerk-react';
import { useAuth, isAuthEnabled } from '../lib/auth';

interface UserButtonProps {
  /** Show text label next to the button */
  showLabel?: boolean;
  /** Custom class name */
  className?: string;
}

/**
 * User button component that shows:
 * - Sign in button if not authenticated
 * - User avatar/dropdown if authenticated
 * - Nothing if auth is not configured
 */
export function UserButton({ className = '' }: UserButtonProps) {
  const { isAuthenticated, isLoading } = useAuth();

  // Anonymous users shouldn't be blocked or prompted on first use.
  if (!isAuthEnabled()) {
    return null;
  }

  // Loading state
  if (isLoading) {
    return (
      <div 
        className={`w-8 h-8 rounded-full bg-gray-200 animate-pulse ${className}`}
      />
    );
  }

  // Authenticated: show Clerk's UserButton
  if (isAuthenticated) {
    return (
      <ClerkUserButton 
        afterSignOutUrl="/"
        appearance={{
          elements: {
            avatarBox: {
              width: '32px',
              height: '32px',
            },
            userButtonPopoverCard: {
              boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
              borderRadius: '12px',
            },
            userButtonPopoverActionButton: {
              fontFamily: 'var(--font-secondary)',
            },
            userButtonPopoverActionButtonText: {
              fontFamily: 'var(--font-secondary)',
            },
            userButtonPopoverFooter: {
              display: 'none',
            },
          },
        }}
      />
    );
  }

  return null;
}

/**
 * Compact user indicator for headers
 */
export function UserIndicator() {
  const { isAuthenticated, isLoading } = useAuth();

  if (!isAuthEnabled()) {
    return null;
  }

  if (isLoading) {
    return <div className="w-6 h-6 rounded-full bg-gray-200 animate-pulse" />;
  }

  if (isAuthenticated) {
    return (
      <ClerkUserButton 
        afterSignOutUrl="/"
        appearance={{
          elements: {
            avatarBox: {
              width: '24px',
              height: '24px',
            },
          },
        }}
      />
    );
  }

  return null;
}

