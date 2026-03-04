"use client";

import { useState, useEffect } from "react";
import { Clock, Lock } from "lucide-react";

/**
 * Returns the next Tuesday at 3:00 PM EST.
 * If it's currently past Tuesday 3 PM, returns the following Tuesday.
 */
function getNextDeadline(): Date {
  const now = new Date();
  // Work in EST/EDT — use America/New_York offset
  const estNow = new Date(
    now.toLocaleString("en-US", { timeZone: "America/New_York" })
  );

  const day = estNow.getDay(); // 0=Sun, 2=Tue
  const hour = estNow.getHours();
  const minute = estNow.getMinutes();

  let daysUntilTuesday = (2 - day + 7) % 7;

  // If it's Tuesday but past 3 PM, go to next Tuesday
  if (daysUntilTuesday === 0 && (hour > 15 || (hour === 15 && minute > 0))) {
    daysUntilTuesday = 7;
  }

  const deadline = new Date(estNow);
  deadline.setDate(deadline.getDate() + daysUntilTuesday);
  deadline.setHours(15, 0, 0, 0);
  return deadline;
}

function isLocked(): boolean {
  const now = new Date();
  const estNow = new Date(
    now.toLocaleString("en-US", { timeZone: "America/New_York" })
  );
  const day = estNow.getDay();
  const hour = estNow.getHours();
  const minute = estNow.getMinutes();

  // Locked if it's Tuesday after 3 PM through end of Tuesday
  return day === 2 && (hour > 15 || (hour === 15 && minute > 0));
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return "0h 0m";
  const totalMinutes = Math.floor(ms / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function DeadlineBanner() {
  const [locked, setLocked] = useState(false);
  const [countdown, setCountdown] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    function tick() {
      const nowLocked = isLocked();
      setLocked(nowLocked);

      if (nowLocked) {
        setCountdown("");
      } else {
        const deadline = getNextDeadline();
        const estNow = new Date(
          new Date().toLocaleString("en-US", { timeZone: "America/New_York" })
        );
        const diff = deadline.getTime() - estNow.getTime();
        setCountdown(formatCountdown(diff));
      }
    }

    tick();
    const interval = setInterval(tick, 30000); // update every 30s
    return () => clearInterval(interval);
  }, []);

  if (!mounted) {
    return (
      <div className="rounded-2xl px-4 py-3 bg-cream-dark animate-pulse h-14" />
    );
  }

  if (locked) {
    return (
      <div className="rounded-2xl px-4 py-3 bg-danger/10 border border-danger/20 flex items-center gap-3">
        <Lock className="w-5 h-5 text-danger shrink-0" />
        <div>
          <p className="text-sm font-semibold text-danger">
            Ordering Locked for This Week
          </p>
          <p className="text-xs text-danger/70">
            The Tuesday 3:00 PM EST deadline has passed.
          </p>
        </div>
      </div>
    );
  }

  // Determine urgency color
  const deadline = getNextDeadline();
  const estNow = new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/New_York" })
  );
  const hoursLeft = (deadline.getTime() - estNow.getTime()) / 3600000;
  const isUrgent = hoursLeft < 6;

  return (
    <div
      className={`rounded-2xl px-4 py-3 flex items-center gap-3 transition-colors ${
        isUrgent
          ? "bg-warning-light border border-warning/30"
          : "bg-cream-dark border border-cream-dark"
      }`}
    >
      <Clock
        className={`w-5 h-5 shrink-0 ${isUrgent ? "text-warning" : "text-charcoal-light"}`}
      />
      <div className="flex-1">
        <p className="text-sm font-medium text-charcoal">
          Order deadline:{" "}
          <span className={`font-semibold ${isUrgent ? "text-warning" : "text-wine"}`}>
            {countdown}
          </span>{" "}
          remaining
        </p>
        <p className="text-xs text-charcoal-light">
          Tuesday 3:00 PM EST weekly cutoff
        </p>
      </div>
    </div>
  );
}

export { isLocked };
