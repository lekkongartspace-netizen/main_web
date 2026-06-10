"use client";

import { useEffect, useRef } from "react";
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.min.css";
import { Thai } from "flatpickr/dist/l10n/th";

interface FlatpickrInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  enableTime?: boolean;
  noCalendar?: boolean;
  dateFormat?: string;
  className?: string;
}

export default function FlatpickrInput({
  value,
  onChange,
  placeholder = "เลือกวันที่",
  enableTime = false,
  noCalendar = false,
  dateFormat,
  className = "",
}: FlatpickrInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const fpRef = useRef<flatpickr.Instance | null>(null);

  useEffect(() => {
    if (!inputRef.current) return;

    fpRef.current = flatpickr(inputRef.current, {
      locale: Thai,
      enableTime,
      noCalendar,
      time_24hr: true,
      dateFormat: dateFormat || (enableTime ? "d/m/Y H:i" : "d/m/Y"),
      defaultDate: value || undefined,
      onChange: (_, dateStr) => {
        onChange(dateStr);
      },
    });

    return () => {
      fpRef.current?.destroy();
    };
  }, []);

  useEffect(() => {
    if (fpRef.current && value) {
      fpRef.current.setDate(value, false);
    }
  }, [value]);

  return (
    <input
      ref={inputRef}
      placeholder={placeholder}
      readOnly
      className={`input-field cursor-pointer ${className}`}
    />
  );
}
