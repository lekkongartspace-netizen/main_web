"use client";

import { useState, useRef, useEffect } from "react";

interface PinInputProps {
  length?: number;
  onComplete: (pin: string) => void;
  disabled?: boolean;
  error?: string;
}

export default function PinInput({ length = 6, onComplete, disabled, error }: PinInputProps) {
  const [values, setValues] = useState<string[]>(Array(length).fill(""));
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    refs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (error) {
      setValues(Array(length).fill(""));
      setTimeout(() => refs.current[0]?.focus(), 100);
    }
  }, [error, length]);

  const handleChange = (index: number, val: string) => {
    if (!/^\d*$/.test(val)) return;

    const newValues = [...values];

    if (val.length > 1) {
      const digits = val.split("").filter((c) => /\d/.test(c));
      for (let i = 0; i < digits.length && index + i < length; i++) {
        newValues[index + i] = digits[i];
      }
      setValues(newValues);
      const nextIdx = Math.min(index + digits.length, length - 1);
      refs.current[nextIdx]?.focus();
      if (newValues.every((v) => v !== "")) {
        onComplete(newValues.join(""));
      }
      return;
    }

    newValues[index] = val;
    setValues(newValues);

    if (val && index < length - 1) {
      refs.current[index + 1]?.focus();
    }

    if (newValues.every((v) => v !== "")) {
      onComplete(newValues.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !values[index] && index > 0) {
      refs.current[index - 1]?.focus();
      const newValues = [...values];
      newValues[index - 1] = "";
      setValues(newValues);
    }
  };

  return (
    <div>
      <div className="flex gap-2 sm:gap-3 justify-center">
        {values.map((val, i) => (
          <div key={i} className="relative">
            <input
              ref={(el) => { refs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={length}
              value={val}
              disabled={disabled}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onFocus={(e) => e.target.select()}
              className={`
                w-11 h-14 sm:w-14 sm:h-16 text-center text-xl sm:text-2xl font-bold rounded-xl border-2
                outline-none transition-all duration-200 text-transparent caret-transparent
                ${error ? "border-red-400 bg-red-50" : "border-gray-200 focus:border-brand-red focus:ring-2 focus:ring-brand-red/20"}
                ${disabled ? "opacity-50 cursor-not-allowed" : ""}
              `}
              style={{ WebkitTextSecurity: "none" } as React.CSSProperties}
            />
            {val && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className={`w-3 h-3 rounded-full ${error ? "bg-red-400" : "bg-gray-800"}`} />
              </div>
            )}
          </div>
        ))}
      </div>
      {error && (
        <p className="text-center text-red-500 text-sm mt-3 fade-in">{error}</p>
      )}
    </div>
  );
}
