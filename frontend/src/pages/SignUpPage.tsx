import React from 'react';
import { useLocation, useSearch } from 'wouter';
import { SignUp } from '@clerk/clerk-react';
import { ArrowLeft } from 'lucide-react';
import { isAuthEnabled } from '../lib/auth';

export function SignUpPage() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  
  // Parse redirect_url from query params
  const params = new URLSearchParams(searchString);
  const redirectUrl = params.get('redirect_url');
  const afterSignUpUrl = redirectUrl ? decodeURIComponent(redirectUrl) : '/';

  // If Clerk is not configured, show a placeholder
  if (!isAuthEnabled()) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: 'var(--bg-primary)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <header
          style={{
            backgroundColor: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(0,0,0,0.1)',
          }}
        >
          <div
            style={{
              maxWidth: '800px',
              margin: '0 auto',
              padding: '16px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <button
              onClick={() => setLocation('/')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-secondary)',
                fontSize: '14px',
                color: 'rgba(0,0,0,0.7)',
                padding: '8px 0',
              }}
            >
              <ArrowLeft size={18} />
              Back to Search
            </button>
            
            <button
              onClick={() => setLocation('/')}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-primary)',
                fontSize: '20px',
                fontWeight: 600,
                color: '#000',
              }}
            >
              Archipedia
            </button>
          </div>
        </header>

        <main
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 24px',
          }}
        >
          <div
            style={{
              textAlign: 'center',
              maxWidth: '400px',
            }}
          >
            <div
              style={{
                padding: '32px',
                backgroundColor: 'rgba(182, 68, 36, 0.05)',
                border: '1px solid rgba(182, 68, 36, 0.15)',
                borderRadius: '16px',
              }}
            >
              <h1
                style={{
                  fontFamily: 'var(--font-primary)',
                  fontSize: '24px',
                  fontWeight: 600,
                  marginBottom: '16px',
                  color: '#000',
                }}
              >
                Authentication Not Configured
              </h1>
              <p
                style={{
                  fontFamily: 'var(--font-secondary)',
                  fontSize: '15px',
                  color: 'rgba(0,0,0,0.6)',
                  marginBottom: '24px',
                }}
              >
                Set <code style={{ backgroundColor: 'rgba(0,0,0,0.05)', padding: '2px 6px', borderRadius: '4px' }}>VITE_CLERK_PUBLISHABLE_KEY</code> in your environment to enable sign-up.
              </p>
              <button
                onClick={() => setLocation('/')}
                style={{
                  padding: '12px 24px',
                  fontFamily: 'var(--font-secondary)',
                  fontSize: '14px',
                  fontWeight: 500,
                  backgroundColor: 'var(--accent)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                Return to Search
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-primary)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <header
        style={{
          backgroundColor: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(0,0,0,0.1)',
        }}
      >
        <div
          style={{
            maxWidth: '800px',
            margin: '0 auto',
            padding: '16px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <button
            onClick={() => setLocation('/')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font-secondary)',
              fontSize: '14px',
              color: 'rgba(0,0,0,0.7)',
              padding: '8px 0',
            }}
          >
            <ArrowLeft size={18} />
            Back to Search
          </button>
          
          <button
            onClick={() => setLocation('/')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font-primary)',
              fontSize: '20px',
              fontWeight: 600,
              color: '#000',
            }}
          >
            Archipedia
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 24px',
        }}
      >
        <SignUp 
          routing="path" 
          path="/signup"
          signInUrl={redirectUrl ? `/signin?redirect_url=${encodeURIComponent(redirectUrl)}` : '/signin'}
          afterSignUpUrl={afterSignUpUrl}
          appearance={{
            elements: {
              rootBox: {
                width: '100%',
                maxWidth: '400px',
              },
              card: {
                boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
                borderRadius: '16px',
              },
              headerTitle: {
                fontFamily: 'var(--font-primary)',
              },
              headerSubtitle: {
                fontFamily: 'var(--font-secondary)',
              },
              formButtonPrimary: {
                backgroundColor: 'var(--accent)',
                fontFamily: 'var(--font-secondary)',
                '&:hover': {
                  backgroundColor: 'var(--accent)',
                  opacity: 0.9,
                },
              },
              formFieldInput: {
                fontFamily: 'var(--font-secondary)',
              },
              footerActionLink: {
                color: 'var(--accent)',
                fontFamily: 'var(--font-secondary)',
              },
            },
          }}
        />
      </main>
    </div>
  );
}

