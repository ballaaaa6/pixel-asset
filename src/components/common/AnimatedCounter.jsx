import React, { useState, useEffect } from "react";

function OdometerDigit({ digit }) {
  const [currentDigit, setCurrentDigit] = useState(digit);

  useEffect(() => {
    setCurrentDigit(digit);
  }, [digit]);

  // Digits 0-9 stacked vertically
  const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

  return (
    <span className="odo-digit-container">
      {/* Hidden placeholder to establish correct width, height, and perfect CSS baseline */}
      <span style={{ visibility: "hidden" }}>0</span>
      <span
        className="odo-digit-strip"
        style={{
          transform: `translateY(-${currentDigit * 10}%)`
        }}
      >
        {digits.map((d) => (
          <span key={d} className="odo-digit-num">
            {d}
          </span>
        ))}
      </span>
    </span>
  );
}

export default function AnimatedCounter({ value, formatFn }) {
  // Format value to a string
  const formattedStr = formatFn ? formatFn(value) : String(value);

  // Map characters to static letters/symbols or rolling digits
  const charArray = formattedStr.split("");

  return (
    <span className="odo-wrapper">
      {charArray.map((char, index) => {
        const isDigit = /\d/.test(char);
        if (isDigit) {
          return (
            <OdometerDigit
              key={`${index}-${char}`}
              digit={parseInt(char, 10)}
            />
          );
        }
        return (
          <span key={index} className="odo-static-char">
            {char}
          </span>
        );
      })}
    </span>
  );
}
