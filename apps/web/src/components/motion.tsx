"use client";

import {
  motion,
  useReducedMotion,
  type HTMLMotionProps,
  type Variants,
} from "motion/react";
import { type ReactNode } from "react";
import clsx from "clsx";

const easeOut = [0.22, 1, 0.36, 1] as const;

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: easeOut },
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { duration: 0.45, ease: easeOut },
  },
};

export const stagger: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.09, delayChildren: 0.04 },
  },
};

export function Reveal({
  children,
  className,
  delay = 0,
  y = 18,
  once = true,
  ...rest
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  once?: boolean;
} & Omit<HTMLMotionProps<"div">, "children">) {
  const reduce = useReducedMotion();

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: "-40px 0px" }}
      transition={{ duration: 0.55, delay, ease: easeOut }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

export function Stagger({
  children,
  className,
  once = true,
}: {
  children: ReactNode;
  className?: string;
  once?: boolean;
}) {
  const reduce = useReducedMotion();

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      variants={stagger}
      initial="hidden"
      whileInView="show"
      viewport={{ once, margin: "-40px 0px" }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  if (reduce) {
    return <div className={className}>{children}</div>;
  }
  return (
    <motion.div className={className} variants={fadeUp}>
      {children}
    </motion.div>
  );
}

/** Hero entrance — brand → headline → copy → CTAs */
export function HeroCopy({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  if (reduce) {
    return <div className={className}>{children}</div>;
  }
  return (
    <motion.div
      className={className}
      variants={stagger}
      initial="hidden"
      animate="show"
    >
      {children}
    </motion.div>
  );
}

export function HeroLine({
  children,
  className,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "p" | "h1" | "h2";
}) {
  const reduce = useReducedMotion();
  const Component = motion[Tag];
  if (reduce) {
    const Static = Tag;
    return <Static className={className}>{children}</Static>;
  }
  return (
    <Component className={className} variants={fadeUp}>
      {children}
    </Component>
  );
}

/** Soft floating payment-lane paths behind hero content (Paylane brand) */
export function LaneMotionBackdrop({ className }: { className?: string }) {
  const reduce = useReducedMotion();

  return (
    <div
      className={clsx("pointer-events-none absolute inset-0 overflow-hidden", className)}
      aria-hidden
    >
      <svg
        className="absolute -right-8 top-1/4 h-[70%] w-[min(90%,46rem)] opacity-[0.35] sm:opacity-40"
        viewBox="0 0 720 480"
        fill="none"
      >
        <defs>
          <linearGradient id="laneA" x1="0" y1="0" x2="720" y2="0" gradientUnits="userSpaceOnUse">
            <stop stopColor="#1a5cff" stopOpacity="0" />
            <stop offset="0.35" stopColor="#1a5cff" stopOpacity="0.85" />
            <stop offset="0.75" stopColor="#00b89c" stopOpacity="0.9" />
            <stop offset="1" stopColor="#00b89c" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="laneB" x1="0" y1="80" x2="720" y2="80" gradientUnits="userSpaceOnUse">
            <stop stopColor="#00b89c" stopOpacity="0" />
            <stop offset="0.4" stopColor="#00b89c" stopOpacity="0.7" />
            <stop offset="1" stopColor="#1a5cff" stopOpacity="0" />
          </linearGradient>
        </defs>
        {reduce ? (
          <>
            <path
              d="M20 120 C 180 80, 280 160, 420 140 S 620 60, 700 100"
              stroke="url(#laneA)"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <path
              d="M40 240 C 200 280, 300 200, 460 220 S 640 300, 710 250"
              stroke="url(#laneB)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d="M10 340 C 160 300, 260 380, 420 360 S 620 300, 700 330"
              stroke="url(#laneA)"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.7"
            />
          </>
        ) : (
          <>
            <motion.path
              d="M20 120 C 180 80, 280 160, 420 140 S 620 60, 700 100"
              stroke="url(#laneA)"
              strokeWidth="3"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1.6, ease: easeOut }}
            />
            <motion.path
              d="M40 240 C 200 280, 300 200, 460 220 S 640 300, 710 250"
              stroke="url(#laneB)"
              strokeWidth="2.5"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1.8, delay: 0.15, ease: easeOut }}
            />
            <motion.path
              d="M10 340 C 160 300, 260 380, 420 360 S 620 300, 700 330"
              stroke="url(#laneA)"
              strokeWidth="2"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 0.95, opacity: 0.75 }}
              transition={{ duration: 2, delay: 0.28, ease: easeOut }}
            />
            {/* Moving settlement dots along the lanes */}
            <motion.circle
              r="5"
              fill="#1a5cff"
              initial={{ opacity: 0 }}
              animate={{
                opacity: [0, 1, 1, 0],
                cx: [40, 200, 360, 520, 710],
                cy: [240, 270, 210, 250, 250],
              }}
              transition={{ duration: 4.8, repeat: Infinity, ease: "linear", delay: 0.9 }}
            />
            <motion.circle
              r="4"
              fill="#00b89c"
              initial={{ opacity: 0 }}
              animate={{
                opacity: [0, 1, 1, 0],
                cx: [20, 180, 340, 520, 700],
                cy: [120, 90, 150, 130, 100],
              }}
              transition={{ duration: 5.4, repeat: Infinity, ease: "linear", delay: 2 }}
            />
          </>
        )}
      </svg>
    </div>
  );
}

export function MotionCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  if (reduce) {
    return <div className={className}>{children}</div>;
  }
  return (
    <motion.div
      className={className}
      variants={fadeUp}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
    >
      {children}
    </motion.div>
  );
}
