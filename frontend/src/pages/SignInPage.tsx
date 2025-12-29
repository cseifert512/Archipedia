import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft, LogIn, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export function SignInPage() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !password.trim()) {
      toast.error('Please enter your email and password');
      return;
    }

    setIsLoading(true);
    
    // Simulate sign in - replace with actual auth logic
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    toast.info('Authentication coming soon! Stay tuned.');
    setIsLoading(false);
  };

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
        <div
          style={{
            width: '100%',
            maxWidth: '400px',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                backgroundColor: 'rgba(182, 68, 36, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
              }}
            >
              <LogIn size={28} style={{ color: 'var(--accent)' }} />
            </div>
            
            <h1
              style={{
                fontFamily: 'var(--font-primary)',
                fontSize: '28px',
                fontWeight: 600,
                marginBottom: '12px',
                color: '#000',
              }}
            >
              Welcome back
            </h1>
            
            <p
              style={{
                fontFamily: 'var(--font-secondary)',
                fontSize: '15px',
                color: 'rgba(0,0,0,0.6)',
              }}
            >
              Sign in to access your boards and saved projects
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gap: '20px' }}>
              <div>
                <label
                  htmlFor="email"
                  style={{
                    display: 'block',
                    fontFamily: 'var(--font-secondary)',
                    fontSize: '13px',
                    fontWeight: 500,
                    marginBottom: '8px',
                    color: 'rgba(0,0,0,0.7)',
                  }}
                >
                  Email
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail
                    size={18}
                    style={{
                      position: 'absolute',
                      left: '14px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'rgba(0,0,0,0.4)',
                    }}
                  />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    style={{
                      width: '100%',
                      padding: '12px 14px 12px 44px',
                      fontFamily: 'var(--font-secondary)',
                      fontSize: '14px',
                      border: '1px solid rgba(0,0,0,0.15)',
                      borderRadius: '8px',
                      backgroundColor: 'white',
                      outline: 'none',
                      transition: 'border-color 150ms ease',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'var(--accent)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(0,0,0,0.15)';
                    }}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  style={{
                    display: 'block',
                    fontFamily: 'var(--font-secondary)',
                    fontSize: '13px',
                    fontWeight: 500,
                    marginBottom: '8px',
                    color: 'rgba(0,0,0,0.7)',
                  }}
                >
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock
                    size={18}
                    style={{
                      position: 'absolute',
                      left: '14px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'rgba(0,0,0,0.4)',
                    }}
                  />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    style={{
                      width: '100%',
                      padding: '12px 44px 12px 44px',
                      fontFamily: 'var(--font-secondary)',
                      fontSize: '14px',
                      border: '1px solid rgba(0,0,0,0.15)',
                      borderRadius: '8px',
                      backgroundColor: 'white',
                      outline: 'none',
                      transition: 'border-color 150ms ease',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'var(--accent)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(0,0,0,0.15)';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '14px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {showPassword ? (
                      <EyeOff size={18} style={{ color: 'rgba(0,0,0,0.4)' }} />
                    ) : (
                      <Eye size={18} style={{ color: 'rgba(0,0,0,0.4)' }} />
                    )}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-secondary)',
                    fontSize: '13px',
                    color: 'var(--accent)',
                    padding: 0,
                  }}
                  onClick={() => toast.info('Password reset coming soon!')}
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '14px 24px',
                  fontFamily: 'var(--font-secondary)',
                  fontSize: '15px',
                  fontWeight: 500,
                  backgroundColor: 'var(--accent)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.7 : 1,
                  transition: 'all 150ms ease',
                }}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>
            </div>
          </form>

          {/* Coming soon notice */}
          <div
            style={{
              marginTop: '32px',
              padding: '20px',
              backgroundColor: 'rgba(182, 68, 36, 0.05)',
              border: '1px solid rgba(182, 68, 36, 0.15)',
              borderRadius: '12px',
              textAlign: 'center',
            }}
          >
            <p
              style={{
                fontFamily: 'var(--font-secondary)',
                fontSize: '14px',
                color: 'rgba(0,0,0,0.7)',
                margin: 0,
              }}
            >
              🚧 User authentication is coming soon! For now, your boards are saved locally in your browser.
            </p>
          </div>

          {/* Sign up link */}
          <div
            style={{
              marginTop: '24px',
              textAlign: 'center',
            }}
          >
            <p
              style={{
                fontFamily: 'var(--font-secondary)',
                fontSize: '14px',
                color: 'rgba(0,0,0,0.6)',
              }}
            >
              Don't have an account?{' '}
              <button
                type="button"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-secondary)',
                  fontSize: '14px',
                  color: 'var(--accent)',
                  fontWeight: 500,
                  padding: 0,
                }}
                onClick={() => toast.info('Sign up coming soon!')}
              >
                Sign up
              </button>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

