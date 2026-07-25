'use client';

import React, { useEffect, useRef, useState, ReactNode } from 'react';
import styles from './ScrollReveal.module.css';

interface ScrollRevealProps {
  children: ReactNode;
  animation?: 'fade-up' | 'fade-down' | 'slide-left' | 'slide-right' | 'scale-up';
  delay?: 0 | 100 | 200 | 300 | 400 | 500;
  duration?: 500 | 700 | 1000;
  threshold?: number;
  className?: string;
  triggerOnce?: boolean;
  style?: React.CSSProperties;
}

export default function ScrollReveal({
  children,
  animation = 'fade-up',
  delay = 0,
  duration = 700,
  threshold = 0.1,
  className = '',
  triggerOnce = true,
  style,
}: ScrollRevealProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsRevealed(true);
          if (triggerOnce && ref.current) {
            observer.unobserve(ref.current);
          }
        } else if (!triggerOnce) {
          setIsRevealed(false);
        }
      },
      {
        root: null,
        rootMargin: '0px',
        threshold,
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) observer.unobserve(ref.current);
    };
  }, [threshold, triggerOnce]);

  const wrapperClasses = [
    styles.revealWrapper,
    styles[animation],
    styles[`delay-${delay}`],
    styles[`duration-${duration}`],
    isRevealed ? styles.revealed : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div ref={ref} className={wrapperClasses} style={style}>
      {children}
    </div>
  );
}
