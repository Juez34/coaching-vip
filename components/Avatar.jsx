import React from "react";

export default function Avatar({ url, name, size = "md" }) {
  // Gestion des différentes tailles
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-14 h-14 text-base",
    xl: "w-20 h-20 text-xl"
  };

  // Générer les initiales à partir du nom
  const getInitials = (fullName) => {
    if (!fullName) return "U";
    return fullName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (url) {
    return (
      <img
        src={url}
        alt={name || "Avatar"}
        className={`${sizeClasses[size]} rounded-full object-cover border border-slate-700 shadow-sm shrink-0`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-400 font-bold flex items-center justify-center shadow-sm shrink-0`}
    >
      {getInitials(name)}
    </div>
  );
}
