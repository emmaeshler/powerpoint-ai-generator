'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Power } from 'lucide-react';
import { Button } from './ui/button';

interface SessionTimerProps {
  timeoutMinutes?: number;
  onTimeout: () => void;
  onStopServer: () => void;
}

export function SessionTimer({ timeoutMinutes = 30, onTimeout, onStopServer }: SessionTimerProps) {
  const lastActivityRef = useRef(Date.now());
  const timedOutRef = useRef(false);

  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  // Listen for user activity to reset the inactivity timer
  useEffect(() => {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];

    let throttleTimeout: ReturnType<typeof setTimeout> | null = null;
    const handleActivity = () => {
      if (throttleTimeout) return;
      throttleTimeout = setTimeout(() => {
        throttleTimeout = null;
      }, 5000);
      resetTimer();
    };

    events.forEach((event) => window.addEventListener(event, handleActivity, { passive: true }));
    return () => {
      events.forEach((event) => window.removeEventListener(event, handleActivity));
      if (throttleTimeout) clearTimeout(throttleTimeout);
    };
  }, [resetTimer]);

  // Countdown tick - check for inactivity timeout
  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - lastActivityRef.current) / 1000);
      const remaining = Math.max(0, timeoutMinutes * 60 - elapsed);

      // Trigger modal when timeout is reached
      if (remaining <= 0 && !timedOutRef.current) {
        timedOutRef.current = true;
        clearInterval(interval);
        onTimeout();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [timeoutMinutes, onTimeout]);

  return (
    <div className="flex items-center gap-2">
      {/* Stop Server button */}
      <Button
        variant="outline"
        size="sm"
        onClick={onStopServer}
        className="text-xs"
        style={{ color: '#991B1B', borderColor: '#FECACA' }}
      >
        <Power className="w-3.5 h-3.5 mr-1.5" />
        Stop Server
      </Button>
    </div>
  );
}
