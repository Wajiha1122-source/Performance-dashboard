import React from "react";
import { motion } from "framer-motion";

export default function MetricCard({ icon: Icon, label, value, change, tone = "gold" }) {
  return (
    <motion.article className={`metric-card ${tone}`} whileHover={{ y: -4, scale: 1.01 }}>
      <div className="metric-icon">{Icon && <Icon size={20} />}</div>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{change}</small>
    </motion.article>
  );
}
