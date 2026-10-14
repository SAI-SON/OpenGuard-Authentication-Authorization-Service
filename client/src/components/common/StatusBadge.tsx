import React from "react";

interface StatusBadgeProps {
  status: "ALLOW" | "DENY" | "allow" | "deny" | "active" | "suspended" | "pending" | "ok" | "degraded" | "error" | string;
  size?: "sm" | "md";
  showDot?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = "md",
  showDot = true,
}) => {
  const norm = status.toUpperCase();

  let colorClasses = "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
  let dotColor = "bg-slate-400";

  if (norm === "ALLOW" || norm === "ACTIVE" || norm === "OK") {
    colorClasses = "bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50";
    dotColor = "bg-emerald-500";
  } else if (norm === "DENY" || norm === "SUSPENDED" || norm === "ERROR") {
    colorClasses = "bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/50";
    dotColor = "bg-rose-500";
  } else if (norm === "PENDING" || norm === "DEGRADED") {
    colorClasses = "bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/50";
    dotColor = "bg-amber-500";
  }

  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs font-semibold";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${sizeClasses} ${colorClasses} tracking-wide`}
    >
      {showDot && <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />}
      {status}
    </span>
  );
};
