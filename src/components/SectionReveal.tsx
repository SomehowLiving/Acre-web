import { useRef } from "react";
import { motion, useInView } from "framer-motion";

interface SectionRevealProps {
  children: React.ReactNode;
  className?: string;
}

const SectionReveal = ({ children, className = "" }: SectionRevealProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <div ref={ref} className={`relative ${className}`}>
      {/* Horizontal scan line that "unlocks" the section */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={isInView ? { scaleX: 1 } : {}}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="absolute top-0 left-0 right-0 h-px bg-primary z-10"
        style={{ transformOrigin: "left" }}
      />
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={isInView ? { y: 0, opacity: 1 } : {}}
        transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </div>
  );
};

export default SectionReveal;
