import React from "react";

export default function NumberTicker({ value, className = "", style = {} }) {
  const str = String(value ?? "");

  return (
    <span className={`number-ticker ${className}`} style={style}>
      {str.split("").map((char, idx) => {
        if (char >= "0" && char <= "9") {
          const digit = parseInt(char, 10);
          return (
            <span key={idx} className="ticker-digit-wrapper">
              <span
                className="ticker-digit-column"
                style={{
                  transform: `translateY(-${digit * 10}%)`,
                  transition: "transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)"
                }}
              >
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                  <span key={num}>{num}</span>
                ))}
              </span>
            </span>
          );
        }
        return (
          <span key={idx} className="ticker-char">
            {char}
          </span>
        );
      })}
    </span>
  );
}
