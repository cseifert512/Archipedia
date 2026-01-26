/**
 * Authentication utilities for Archipedia
 * Uses Clerk for user authentication
 */

import { useUser, useAuth as useClerkAuth } from "@clerk/clerk-react";

/**
 * Check if Clerk is configured and available
 */
export const isAuthEnabled = (): boolean => {
  return !!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
};

/**
 * Custom hook for authentication state
 * Returns null values if auth is not configured
 */
export const useAuth = () => {
  // If Clerk is not configured, return anonymous state
  if (!isAuthEnabled()) {
    return {
      isAuthenticated: false,
      isLoading: false,
      user: null,
      userId: null,
    };
  }

  try {
    const { user, isLoaded, isSignedIn } = useUser();
    
    return {
      isAuthenticated: isSignedIn ?? false,
      isLoading: !isLoaded,
      user: user ?? null,
      userId: user?.id ?? null,
    };
  } catch {
    // Fallback if Clerk context is not available
    return {
      isAuthenticated: false,
      isLoading: false,
      user: null,
      userId: null,
    };
  }
};

/**
 * Hook to get auth token for API calls
 */
export const useAuthToken = () => {
  if (!isAuthEnabled()) {
    return { getToken: async () => null };
  }

  try {
    const { getToken } = useClerkAuth();
    return { getToken };
  } catch {
    return { getToken: async () => null };
  }
};

/**
 * Get user display info
 */
export const useUserInfo = () => {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated || !user) {
    return {
      displayName: "Guest",
      email: null,
      avatarUrl: null,
      initials: "G",
    };
  }

  const displayName = user.firstName 
    ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`
    : user.emailAddresses?.[0]?.emailAddress?.split("@")[0] ?? "User";
  
  const initials = user.firstName 
    ? `${user.firstName[0]}${user.lastName?.[0] ?? ""}`.toUpperCase()
    : displayName[0]?.toUpperCase() ?? "U";

  return {
    displayName,
    email: user.emailAddresses?.[0]?.emailAddress ?? null,
    avatarUrl: user.imageUrl ?? null,
    initials,
  };
};

