import React from "react";

interface ProofMarkProps {
  size?: number;
  className?: string;
  state?: "idle" | "scanning" | "success" | "error";
}

const stateClass = (state: string) => {
  if (state === "scanning") return "proof-mark-scanning";
  if (state === "success") return "proof-mark-success";
  if (state === "error") return "proof-mark-error";
  return "";
};

// 1. Shield-Proof — hexagon with internal circuit checkmark
export const ShieldProof: React.FC<ProofMarkProps> = ({ size = 24, className = "", state = "idle" }) => (
  <div className={`${stateClass(state)} ${className}`}>
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter">
      <polygon points="12,2 21,6.5 21,12 12,22 3,12 3,6.5" className="stroke-foreground scan-path" strokeDasharray={state === "scanning" ? "30" : "none"} />
      <polyline points="8,12 11,15 16,9" className="stroke-primary scan-path" strokeDasharray={state === "scanning" ? "20" : "none"} />
      <circle cx="8" cy="12" r="0.8" className="fill-primary" />
      <circle cx="16" cy="9" r="0.8" className="fill-primary" />
    </svg>
  </div>
);

// 2. Zero-Knowledge — two overlapping circles with diagonal
export const ZeroKnowledge: React.FC<ProofMarkProps> = ({ size = 24, className = "", state = "idle" }) => (
  <div className={`${stateClass(state)} ${className}`}>
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter">
      <circle cx="9" cy="12" r="6" className="stroke-foreground scan-path" strokeDasharray={state === "scanning" ? "30" : "none"} />
      <circle cx="15" cy="12" r="6" className="stroke-foreground scan-path" strokeDasharray={state === "scanning" ? "30" : "none"} />
      <line x1="6" y1="18" x2="18" y2="6" className="stroke-primary scan-path" />
    </svg>
  </div>
);

// 3. Income-Stream — three horizontal lines with pulse dots
export const IncomeStream: React.FC<ProofMarkProps> = ({ size = 24, className = "", state = "idle" }) => (
  <div className={`${stateClass(state)} ${className}`}>
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter">
      <line x1="3" y1="7" x2="18" y2="7" className="stroke-foreground scan-path" />
      <line x1="3" y1="12" x2="14" y2="12" className="stroke-foreground scan-path" />
      <line x1="3" y1="17" x2="20" y2="17" className="stroke-foreground scan-path" />
      <circle cx="5" cy="7" r="1" className="fill-primary" style={{ animation: state === "scanning" ? "pulse-dot 2s ease-in-out infinite" : "none" }} />
      <circle cx="5" cy="12" r="1" className="fill-secondary" style={{ animation: state === "scanning" ? "pulse-dot 2s ease-in-out 0.3s infinite" : "none" }} />
      <circle cx="5" cy="17" r="1" className="fill-primary" style={{ animation: state === "scanning" ? "pulse-dot 2s ease-in-out 0.6s infinite" : "none" }} />
    </svg>
  </div>
);

// 4. Lock-Verified — padlock with particle-breaking shackle
export const LockVerified: React.FC<ProofMarkProps> = ({ size = 24, className = "", state = "idle" }) => (
  <div className={`${stateClass(state)} ${className}`}>
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter">
      <rect x="5" y="11" width="14" height="10" className="stroke-foreground scan-path" />
      <path d="M8 11V7a4 4 0 0 1 4-4h0" className="stroke-foreground scan-path" />
      <line x1="16" y1="7" x2="16" y2="11" className="stroke-muted-foreground" strokeDasharray="2 2" />
      <circle cx="14" cy="5" r="0.8" className="fill-primary" />
      <circle cx="17" cy="4" r="0.6" className="fill-primary" opacity="0.6" />
      <circle cx="18" cy="6" r="0.5" className="fill-primary" opacity="0.4" />
      <circle cx="12" cy="16" r="1" className="fill-primary" />
    </svg>
  </div>
);

// 5. Gig-Worker — abstract node with radiating connections
export const GigWorker: React.FC<ProofMarkProps> = ({ size = 24, className = "", state = "idle" }) => (
  <div className={`${stateClass(state)} ${className}`}>
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter">
      <circle cx="12" cy="12" r="3" className="stroke-foreground scan-path" />
      <line x1="12" y1="9" x2="12" y2="3" className="stroke-primary scan-path" />
      <line x1="14.6" y1="13.5" x2="20" y2="17" className="stroke-primary scan-path" />
      <line x1="9.4" y1="13.5" x2="4" y2="17" className="stroke-primary scan-path" />
      <circle cx="12" cy="3" r="1" className="fill-primary" />
      <circle cx="20" cy="17" r="1" className="fill-secondary" />
      <circle cx="4" cy="17" r="1" className="fill-secondary" />
    </svg>
  </div>
);

// 6. Algorand-Chain — three stacked rhombuses with bridges
export const AlgorandChain: React.FC<ProofMarkProps> = ({ size = 24, className = "", state = "idle" }) => (
  <div className={`${stateClass(state)} ${className}`}>
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter">
      <polygon points="12,2 16,5 12,8 8,5" className="stroke-foreground scan-path" />
      <polygon points="12,8.5 16,11.5 12,14.5 8,11.5" className="stroke-foreground scan-path" />
      <polygon points="12,15 16,18 12,21 8,18" className="stroke-foreground scan-path" />
      <line x1="12" y1="8" x2="12" y2="8.5" className="stroke-primary" />
      <line x1="12" y1="14.5" x2="12" y2="15" className="stroke-primary" />
    </svg>
  </div>
);

// 7. Proof-Valid — square with corner brackets and centered dot
export const ProofValid: React.FC<ProofMarkProps> = ({ size = 24, className = "", state = "idle" }) => (
  <div className={`${stateClass(state)} ${className}`}>
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter">
      {/* Corner brackets */}
      <polyline points="3,8 3,3 8,3" className="stroke-foreground scan-path" />
      <polyline points="16,3 21,3 21,8" className="stroke-foreground scan-path" />
      <polyline points="21,16 21,21 16,21" className="stroke-foreground scan-path" />
      <polyline points="8,21 3,21 3,16" className="stroke-foreground scan-path" />
      {/* Center target */}
      <circle cx="12" cy="12" r="2" className="stroke-primary scan-path" />
      <circle cx="12" cy="12" r="0.8" className="fill-primary" />
    </svg>
  </div>
);

// 8. Data-Minimal — cylinder with ghosted body
export const DataMinimal: React.FC<ProofMarkProps> = ({ size = 24, className = "", state = "idle" }) => (
  <div className={`${stateClass(state)} ${className}`}>
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter">
      {/* Ghosted body */}
      <line x1="6" y1="7" x2="6" y2="19" className="stroke-muted-foreground" opacity="0.2" />
      <line x1="18" y1="7" x2="18" y2="19" className="stroke-muted-foreground" opacity="0.2" />
      <ellipse cx="12" cy="19" rx="6" ry="2.5" className="stroke-muted-foreground" opacity="0.15" />
      {/* Visible top ring */}
      <ellipse cx="12" cy="7" rx="6" ry="2.5" className="stroke-foreground scan-path" />
      <circle cx="12" cy="7" r="0.8" className="fill-primary" />
    </svg>
  </div>
);

export const ProofMarks = {
  ShieldProof,
  ZeroKnowledge,
  IncomeStream,
  LockVerified,
  GigWorker,
  AlgorandChain,
  ProofValid,
  DataMinimal,
};
