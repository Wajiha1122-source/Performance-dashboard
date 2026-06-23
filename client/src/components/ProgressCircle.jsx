import React from "react";
import { motion } from "framer-motion";

export default function ProgressCircle({ value, size = 96, label = "Performance" }) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="progress-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle className="progress-track" cx={size / 2} cy={size / 2} r={radius} />
        <motion.circle
          className="progress-line"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.1, ease: "easeOut" }}
        />
      </svg>
      <div className="progress-copy">
        <strong>{value}%</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}
