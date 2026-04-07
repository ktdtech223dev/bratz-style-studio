import React, { useEffect, useRef, useState } from 'react';

export default function Modal({ children, onClose, title }) {
  const [entered, setEntered] = useState(false);
  const overlayRef = useRef(null);
  const contentRef = useRef(null);

  /* slide-in */
  useEffect(() => {
    requestAnimationFrame(() => setEntered(true));
  }, []);

  /* trap focus */
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    const focusable = el.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    function handleTab(e) {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
      if (e.key === 'Escape') onClose?.();
    }

    el.addEventListener('keydown', handleTab);
    first?.focus();

    return () => el.removeEventListener('keydown', handleTab);
  }, [onClose]);

  /* click backdrop to close */
  function handleBackdropClick(e) {
    if (e.target === overlayRef.current) onClose?.();
  }

  return (
    <div
      ref={overlayRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-[90] flex items-end justify-center"
      style={{
        background: entered ? 'rgba(0,0,0,0.65)' : 'rgba(0,0,0,0)',
        backdropFilter: entered ? 'blur(8px)' : 'blur(0)',
        WebkitBackdropFilter: entered ? 'blur(8px)' : 'blur(0)',
        transition: 'background 0.3s ease, backdrop-filter 0.3s ease',
      }}
      role="dialog"
      aria-modal="true"
      aria-label={title || 'Modal'}
    >
      <div
        ref={contentRef}
        className="relative w-full max-w-lg rounded-t-3xl overflow-hidden"
        style={{
          background: 'var(--panel-bg, #2d0040)',
          transform: entered ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1)',
          maxHeight: '85vh',
          overflowY: 'auto',
        }}
      >
        {/* close button */}
        <button
          onClick={onClose}
          className="touch-target absolute top-3 right-3 flex items-center justify-center rounded-full"
          style={{
            width: 36,
            height: 36,
            background: 'rgba(255,255,255,0.08)',
            color: '#fff',
            fontSize: 18,
            zIndex: 2,
          }}
          aria-label="Close"
        >
          \u2715
        </button>

        {/* title */}
        {title && (
          <h2
            className="pt-5 pb-2 px-5 text-center"
            style={{
              fontFamily: "'Pacifico', cursive",
              fontSize: 20,
              color: '#ff69b4',
            }}
          >
            {title}
          </h2>
        )}

        {/* content */}
        <div className="px-5 pb-6">{children}</div>
      </div>
    </div>
  );
}
