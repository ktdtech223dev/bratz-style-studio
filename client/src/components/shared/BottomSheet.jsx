import React, { useEffect, useRef, useState, useCallback } from 'react';

export default function BottomSheet({ children, onClose, height = 'half' }) {
  const [entered, setEntered] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef(0);
  const sheetRef = useRef(null);

  const sheetHeight = height === 'full' ? '92vh' : '55vh';

  useEffect(() => {
    requestAnimationFrame(() => setEntered(true));
  }, []);

  /* dismiss when dragged down enough */
  const handleDismiss = useCallback(() => {
    setEntered(false);
    setTimeout(() => onClose?.(), 320);
  }, [onClose]);

  function handleTouchStart(e) {
    startYRef.current = e.touches[0].clientY;
    setIsDragging(true);
  }

  function handleTouchMove(e) {
    if (!isDragging) return;
    const delta = e.touches[0].clientY - startYRef.current;
    setDragY(Math.max(0, delta));
  }

  function handleTouchEnd() {
    setIsDragging(false);
    if (dragY > 100) {
      handleDismiss();
    } else {
      setDragY(0);
    }
  }

  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) handleDismiss();
  }

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-[80] flex items-end justify-center"
      style={{
        background: entered ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0)',
        transition: 'background 0.3s ease',
      }}
    >
      <div
        ref={sheetRef}
        className="relative w-full max-w-lg rounded-t-3xl overflow-hidden"
        style={{
          background: 'var(--panel-bg, #2d0040)',
          height: sheetHeight,
          transform: entered
            ? `translateY(${dragY}px)`
            : 'translateY(100%)',
          transition: isDragging
            ? 'none'
            : 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1)',
        }}
      >
        {/* drag handle */}
        <div
          className="flex items-center justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={(e) => {
            startYRef.current = e.clientY;
            setIsDragging(true);
            const onMove = (ev) => {
              const delta = ev.clientY - startYRef.current;
              setDragY(Math.max(0, delta));
            };
            const onUp = () => {
              setIsDragging(false);
              if (dragY > 100) handleDismiss();
              else setDragY(0);
              window.removeEventListener('mousemove', onMove);
              window.removeEventListener('mouseup', onUp);
            };
            window.addEventListener('mousemove', onMove);
            window.addEventListener('mouseup', onUp);
          }}
        >
          <div
            className="rounded-full"
            style={{
              width: 40,
              height: 5,
              background: 'rgba(255,255,255,0.2)',
            }}
          />
        </div>

        {/* sheet content */}
        <div
          className="scroll-container px-4 pb-6"
          style={{ height: `calc(${sheetHeight} - 36px)`, overflowY: 'auto' }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
