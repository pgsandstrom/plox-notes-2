import { useEffect, useRef } from "react";

// this version debounces when obj is changed.
export function useDebounceObject(
  obj: {},
  callback: () => void,
  timeout: number
) {
  useEffect(() => {
    const timer = setTimeout(callback, timeout);
    return () => {
      clearTimeout(timer);
    };
  }, [obj]);
}

// This object debounces when the returned function is called
// Do note that the callback closes over a potentially stale render, which is a problem
export function useDebounceCallback(callback: () => void, timeout: number) {
  const timerRef = useRef<NodeJS.Timeout>();
  return () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(callback, timeout);
  };
}
