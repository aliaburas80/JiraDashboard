"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { scrollToSection } from "@/lib/utils";
import styles from "./SectionNav.module.scss";

type CSSVars = CSSProperties & Record<`--${string}`, string | number>;

interface Section {
  id: string;
  label: string;
  color: string;
}

interface SectionNavProps {
  sections: Section[];
}

export default function SectionNav({ sections }: SectionNavProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const handleIntersect: IntersectionObserverCallback = (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          setActiveId(entry.target.id);
          break;
        }
      }
    };

    observerRef.current = new IntersectionObserver(handleIntersect, {
      rootMargin: "-20% 0px -70% 0px",
    });

    const observer = observerRef.current;

    sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => {
      observer.disconnect();
    };
  }, [sections]);

  return (
    <nav
      aria-label="Page sections"
      className="fixed right-4 top-1/2 -translate-y-1/2 z-50 hidden lg:flex flex-col gap-3"
    >
      {sections.map(({ id, label, color }) => {
        const isActive = activeId === id;
        const isHovered = hoveredId === id;

        return (
          <div
            key={id}
            className="relative flex items-center justify-end"
            onMouseEnter={() => setHoveredId(id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            {/* Tooltip label — appears to the left of the dot */}
            <span
              aria-hidden="true"
              className={[
                "absolute right-6 whitespace-nowrap rounded px-2 py-1 text-xs font-medium",
                "bg-white/90 dark:bg-neutral-900/90 shadow-md ring-1 ring-black/10 dark:ring-white/10",
                "pointer-events-none select-none",
                "transition-all duration-150",
                isHovered ? "opacity-100 translate-x-0" : "opacity-0 translate-x-1",
                styles.label,
              ].join(" ")}
              // DYNAMIC CSS VARIABLE: section color is an arbitrary
              // caller-supplied value per page.
              style={{ "--section-color": color } as CSSVars}
            >
              {label}
            </span>

            {/* Dot button */}
            <button
              type="button"
              aria-label={`Scroll to ${label}`}
              onClick={() => scrollToSection(id)}
              className={[
                "relative flex items-center justify-center rounded-full transition-all duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                isActive ? "w-3 h-3" : "w-2 h-2 hover:w-2.5 hover:h-2.5",
                styles.dot,
              ].join(" ")}
              data-active={isActive}
              // DYNAMIC CSS VARIABLE: section color is an arbitrary
              // caller-supplied value per page.
              style={{
                "--section-bg": isActive || isHovered ? color : `${color}99`,
                "--section-shadow": `0 0 0 3px ${color}33, 0 0 8px 2px ${color}66`,
              } as CSSVars}
            />
          </div>
        );
      })}
    </nav>
  );
}
