"use client";

import { useState } from "react";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "clear", "0", "back"];

export default function PinPad({
  length = 4,
  onSubmit,
  disabled,
}: {
  length?: number;
  onSubmit: (pin: string) => void;
  disabled?: boolean;
}) {
  const [pin, setPin] = useState("");

  function press(key: string) {
    if (disabled) return;
    if (key === "clear") {
      setPin("");
      return;
    }
    if (key === "back") {
      setPin((p) => p.slice(0, -1));
      return;
    }
    if (pin.length >= length) return;
    const next = pin + key;
    setPin(next);
    if (next.length === length) {
      onSubmit(next);
      setPin("");
    }
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex gap-3">
        {Array.from({ length }).map((_, i) => (
          <div
            key={i}
            className={`h-4 w-4 rounded-full border-2 border-accent ${
              i < pin.length ? "bg-accent" : "bg-transparent"
            }`}
          />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3">
        {KEYS.map((key) => (
          <button
            key={key}
            type="button"
            disabled={disabled}
            onClick={() => press(key)}
            className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-xl font-semibold text-navy shadow-sm active:scale-95 disabled:opacity-50"
          >
            {key === "clear" ? "지우기" : key === "back" ? "←" : key}
          </button>
        ))}
      </div>
    </div>
  );
}
