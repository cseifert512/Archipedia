import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Menu, X, Building2, Mail } from 'lucide-react';

interface HamburgerMenuProps {
  className?: string;
}

export function HamburgerMenu({ className }: HamburgerMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [, setLocation] = useLocation();

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close menu on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const menuItems = [
    {
      label: 'Enterprise',
      icon: Building2,
      href: '/enterprise',
    },
    {
      label: 'Contact',
      icon: Mail,
      href: '/contact',
    },
  ];

  const handleNavigation = (href: string) => {
    setIsOpen(false);
    setLocation(href);
  };

  return (
    <div ref={menuRef} className={className} style={{ position: 'relative' }}>
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={isOpen}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '40px',
          height: '40px',
          backgroundColor: isOpen ? 'rgba(0,0,0,0.08)' : 'transparent',
          border: '1px solid rgba(0,0,0,0.1)',
          borderRadius: '8px',
          cursor: 'pointer',
          transition: 'all 150ms ease',
        }}
        onMouseEnter={(e) => {
          if (!isOpen) {
            e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.currentTarget.style.backgroundColor = 'transparent';
          }
        }}
      >
        {isOpen ? (
          <X size={20} strokeWidth={1.5} color="#000" />
        ) : (
          <Menu size={20} strokeWidth={1.5} color="#000" />
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: '200px',
            backgroundColor: 'white',
            border: '1px solid rgba(0,0,0,0.1)',
            borderRadius: '12px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
            overflow: 'hidden',
            zIndex: 1000,
            animation: 'slideDown 150ms ease-out',
          }}
        >
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={() => handleNavigation(item.href)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  padding: '14px 16px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderBottom: index < menuItems.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-secondary)',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#000',
                  textAlign: 'left',
                  transition: 'background-color 150ms ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.04)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <Icon size={18} strokeWidth={1.5} style={{ opacity: 0.7 }} />
                {item.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Animation keyframes */}
      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

