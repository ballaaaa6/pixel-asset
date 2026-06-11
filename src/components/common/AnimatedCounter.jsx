import React, { useState, useEffect, useRef } from "react";

export default function AnimatedCounter({ value, formatFn }) {
  const [displayValue, setDisplayValue] = useState(value);
  const prevValueRef = useRef(value);

  useEffect(() => {
    // If the value is not a number, don't animate it
    if (typeof value !== "number" || isNaN(value)) {
      setDisplayValue(value);
      prevValueRef.current = value;
      return;
    }

    const startValue = typeof prevValueRef.current === "number" && !isNaN(prevValueRef.current)
      ? prevValueRef.current
      : value;
    const endValue = value;
    
    if (startValue === endValue) {
      setDisplayValue(endValue);
      return;
    }

    const duration = 750; // duration in ms for smooth rolling feel
    const startTime = performance.now();
    let animationFrameId;

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing: easeOutCubic for a smooth decelerating roll
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      
      const currentValue = startValue + (endValue - startValue) * easeProgress;
      setDisplayValue(currentValue);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        setDisplayValue(endValue);
        prevValueRef.current = endValue;
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [value]);

  if (typeof value !== "number" || isNaN(value)) {
    return <span>{formatFn ? formatFn(value) : value}</span>;
  }

  return <span>{formatFn ? formatFn(displayValue) : displayValue}</span>;
}
