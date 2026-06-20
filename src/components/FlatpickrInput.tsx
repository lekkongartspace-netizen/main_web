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

const pad = (n: number) => String(n).padStart(2, "0");

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
    const el = inputRef.current;
    if (!el) return;

    // React 18 StrictMode (and any re-init) double-invokes this effect in dev,
    // which can leave a stale flatpickr instance + its altInput in the DOM,
    // showing two overlapping date boxes. Tear down any prior instance first.
    const prev = (el as unknown as { _flatpickr?: flatpickr.Instance })._flatpickr;
    if (prev) prev.destroy();

    fpRef.current = flatpickr(el, {
      locale: Thai,
      enableTime,
      noCalendar,
      time_24hr: true,
      // Style the visible (alt) input like every other field so only one,
      // correctly-styled box shows.
      altInputClass: "input-field cursor-pointer " + className,
      // The stored value (real input) stays Gregorian so calcAge and existing
      // data keep working...
      dateFormat: dateFormat || (enableTime ? "d/m/Y H:i" : "d/m/Y"),
      // ...while the visible alt input shows the Buddhist (พ.ศ.) year.
      altInput: true,
      altFormat: "BE",
      defaultDate: value || undefined,
      formatDate: (date, format) => {
        const dd = pad(date.getDate());
        const mm = pad(date.getMonth() + 1);
        const yyyy = date.getFullYear();
        const year = format === "BE" ? yyyy + 543 : yyyy;
        const datePart = `${dd}/${mm}/${year}`;
        if (enableTime) {
          return `${datePart} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
        }
        return datePart;
      },
      onChange: (_, dateStr) => {
        onChange(dateStr);
      },
    });

    return () => {
      fpRef.current?.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (fpRef.current && value) {
      fpRef.current.setDate(value, false);
    }
  }, [value]);

  // Render the real input as type="hidden" so React keeps it hidden across
  // re-renders. flatpickr still reads/writes its value, and shows the formatted
  // (Buddhist-year) value through its visible altInput. Without this, React can
  // re-assert a visible type on re-render, leaving TWO date boxes on screen.
  return <input ref={inputRef} type="hidden" placeholder={placeholder} readOnly />;
}
