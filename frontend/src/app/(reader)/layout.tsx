import React from "react";

export default function ReaderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="reader-root min-h-screen bg-[var(--reader-bg)] text-[var(--reader-text)] transition-colors duration-150">
      {/* 
        Hard Guardrail: ZERO Lenis and ZERO GSAP inside (reader) route group.
        Uses native browser scrolling for optimal performance and accurate scroll tracking.
      */}
      {children}
    </div>
  );
}
