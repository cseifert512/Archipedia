import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft, Mail, Send } from 'lucide-react';
import { toast } from 'sonner';

export function ContactPage() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email.trim() || !formData.message.trim()) {
      toast.error('Please fill in required fields');
      return;
    }

    setIsSubmitting(true);
    
    // Simulate form submission - replace with actual API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    toast.success('Message sent! We\'ll get back to you soon.');
    setFormData({ name: '', email: '', subject: '', message: '' });
    setIsSubmitting(false);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-primary)',
      }}
    >
      {/* Header */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
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
          maxWidth: '600px',
          margin: '0 auto',
          padding: '60px 24px 100px',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
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
            <Mail size={28} style={{ color: 'var(--accent)' }} />
          </div>
          
          <h1
            style={{
              fontFamily: 'var(--font-primary)',
              fontSize: '32px',
              fontWeight: 600,
              marginBottom: '12px',
              color: '#000',
            }}
          >
            Get in Touch
          </h1>
          
          <p
            style={{
              fontFamily: 'var(--font-secondary)',
              fontSize: '16px',
              color: 'rgba(0,0,0,0.6)',
              maxWidth: '400px',
              margin: '0 auto',
            }}
          >
            Have questions, feedback, or want to learn more about Archipedia? We'd love to hear from you.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label
                  htmlFor="name"
                  style={{
                    display: 'block',
                    fontFamily: 'var(--font-secondary)',
                    fontSize: '13px',
                    fontWeight: 500,
                    marginBottom: '8px',
                    color: 'rgba(0,0,0,0.7)',
                  }}
                >
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Your name"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
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
                  Email *
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="you@example.com"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
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
                htmlFor="subject"
                style={{
                  display: 'block',
                  fontFamily: 'var(--font-secondary)',
                  fontSize: '13px',
                  fontWeight: 500,
                  marginBottom: '8px',
                  color: 'rgba(0,0,0,0.7)',
                }}
              >
                Subject
              </label>
              <input
                id="subject"
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="How can we help?"
                style={{
                  width: '100%',
                  padding: '12px 14px',
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

            <div>
              <label
                htmlFor="message"
                style={{
                  display: 'block',
                  fontFamily: 'var(--font-secondary)',
                  fontSize: '13px',
                  fontWeight: 500,
                  marginBottom: '8px',
                  color: 'rgba(0,0,0,0.7)',
                }}
              >
                Message *
              </label>
              <textarea
                id="message"
                required
                rows={5}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Tell us what's on your mind..."
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  fontFamily: 'var(--font-secondary)',
                  fontSize: '14px',
                  border: '1px solid rgba(0,0,0,0.15)',
                  borderRadius: '8px',
                  backgroundColor: 'white',
                  outline: 'none',
                  resize: 'vertical',
                  minHeight: '120px',
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

            <button
              type="submit"
              disabled={isSubmitting}
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
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.7 : 1,
                transition: 'all 150ms ease',
              }}
            >
              <Send size={18} />
              {isSubmitting ? 'Sending...' : 'Send Message'}
            </button>
          </div>
        </form>

        {/* Alternative contact */}
        <div
          style={{
            marginTop: '48px',
            padding: '24px',
            backgroundColor: 'rgba(0,0,0,0.02)',
            borderRadius: '12px',
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
            Prefer email?{' '}
            <a
              href="mailto:hello@archipedia.ai"
              style={{
                color: 'var(--accent)',
                textDecoration: 'none',
                fontWeight: 500,
              }}
            >
              hello@archipedia.ai
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}

