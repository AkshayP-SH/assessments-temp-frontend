import React, { useRef, useState, useEffect } from 'react';

/**
 * TiltCard: Hardware-accelerated 3D perspective tilt container.
 * Reacts to cursor movement with realistic 3D depth, specular glare,
 * and a smooth spring reset. Preserves the exact color palette and children.
 */
export default function TiltCard({
  children,
  className = '',
  maxTilt = 7,
  scale = 1.02,
  glare = true,
  perspective = 1000,
  disabled = false,
  ...props
}) {
  const cardRef = useRef(null);
  const [transform, setTransform] = useState({ rx: 0, ry: 0, s: 1 });
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50, opacity: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    // Disable on touch devices or if user prefers reduced motion
    if (typeof window !== 'undefined') {
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (isTouchDevice || prefersReducedMotion) {
        setIsTouch(true);
      }
    }
  }, []);

  const handleMouseMove = (e) => {
    if (disabled || isTouch || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -maxTilt;
    const rotateY = ((x - centerX) / centerX) * maxTilt;

    setTransform({ rx: rotateX, ry: rotateY, s: scale });
    if (glare) {
      setGlarePos({
        x: (x / rect.width) * 100,
        y: (y / rect.height) * 100,
        opacity: 0.18,
      });
    }
  };

  const handleMouseEnter = () => {
    if (disabled || isTouch) return;
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    if (disabled || isTouch) return;
    setIsHovered(false);
    setTransform({ rx: 0, ry: 0, s: 1 });
    if (glare) {
      setGlarePos((prev) => ({ ...prev, opacity: 0 }));
    }
  };

  return (
    <div
      ref={cardRef}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative transition-all ${
        isHovered ? 'duration-100 ease-out' : 'duration-500 ease-out'
      } will-change-transform ${className}`}
      style={{
        transform:
          !disabled && !isTouch && isHovered
            ? `perspective(${perspective}px) rotateX(${transform.rx.toFixed(2)}deg) rotateY(${transform.ry.toFixed(2)}deg) scale3d(${transform.s}, ${transform.s}, 1)`
            : 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
        transformStyle: 'preserve-3d',
      }}
      {...props}
    >
      {children}
      {glare && !disabled && !isTouch && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-300 z-20"
          style={{
            background: `radial-gradient(circle 280px at ${glarePos.x}% ${glarePos.y}%, rgba(255,255,255,0.22), transparent 75%)`,
            opacity: glarePos.opacity,
          }}
        />
      )}
    </div>
  );
}
