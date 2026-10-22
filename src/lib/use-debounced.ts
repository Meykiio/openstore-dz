import { useEffect, useState } from "react";

/**
 * A value that follows its input but lags it by `delay` milliseconds.
 *
 * Used for the catalogue's price fields. Those are text inputs, so every keystroke
 * changes the value, and every change was a database round trip: typing "5000"
 * fired four queries and three of them were for a number the buyer was still in
 * the middle of typing.
 *
 * Deliberately not applied to the whole filter object. Chips and the sort select
 * change once per interaction, so debouncing those would add 300ms of lag to a
 * click for no benefit. Only the fields that change per keystroke are debounced.
 */
export function useDebouncedValue<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
