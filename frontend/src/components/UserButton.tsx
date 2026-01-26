import React from 'react';
import { useLocation } from 'wouter';
import { UserButton as ClerkUserButton } from '@clerk/clerk-react';
import { User, LogIn } from 'lucide-react';
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
export function UserButton({ showLabel = false, className = '' }: UserButtonProps) {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading } = useAuth();

  // If auth is not enabled, show a simple sign-in link
  if (!isAuthEnabled()) {
    return (
      <button
        onClick={() => setLocation('/signin')}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors hover:bg-black/5 ${className}`}
        style={{
          fontFamily: 'var(--font-secondary)',
          fontSize: '13px',
          color: 'rgba(0,0,0,0.7)',
          border: 'none',
          background: 'none',
          cursor: 'pointer',
        }}
      >
        <User size={16} />
        {showLabel && <span>Sign in</span>}
      </button>
    );
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

  // Not authenticated: show sign in button
  return (
    <button
      onClick={() => setLocation('/signin')}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all hover:bg-black/5 ${className}`}
      style={{
        fontFamily: 'var(--font-secondary)',
        fontSize: '13px',
        color: 'rgba(0,0,0,0.7)',
        border: '1px solid rgba(0,0,0,0.1)',
        background: 'white',
        cursor: 'pointer',
      }}
    >
      <LogIn size={16} />
      {showLabel && <span>Sign in</span>}
    </button>
  );
}

/**
 * Compact user indicator for headers
 */
export function UserIndicator() {
  const [, setLocation] = useLocation();
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

  return (
    <button
      onClick={() => setLocation('/signin')}
      className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
      title="Sign in"
    >
      <User size={14} className="text-gray-600" />
    </button>
  );
}

