"use client";
import { useEffect, useState } from "react";

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

export function BottomBarClock() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const hours = pad(now.getHours());
  const minutes = pad(now.getMinutes());
  const seconds = pad(now.getSeconds());
  const day = pad(now.getDate());
  const month = pad(now.getMonth() + 1);
  const year = now.getFullYear();

  return (
    <span className="font-mono text-sm select-none">| {hours}:{minutes}:{seconds} - {day}/{month}/{year} |</span>
  );
} 