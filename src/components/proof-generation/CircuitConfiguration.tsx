import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Slider } from "@/components/ui/slider";
import { AlgorandChain, ShieldProof } from "@/components/ProofMarks";
import type { CircuitParams } from "@/pages/GenerateProof";

interface CircuitConfigurationProps {
  params: CircuitParams;
  onParamsChange: (params: CircuitParams) => void;
  onBack: () => void;
  onGenerate: () => void;
}

export const CircuitConfiguration: React.FC<CircuitConfigurationProps> = ({
  params,
  onParamsChange,
  onBack,
  onGenerate,
}) => {
  const [animatedThreshold, setAnimatedThreshold] = useState(params.incomeThreshold);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedThreshold(params.incomeThreshold);
    }, 50);
    return () => clearTimeout(timer);
  }, [params.incomeThreshold]);

  const formatCurrency = (value: number) => {
    return `₹${value.toLocaleString("en-IN")}`;
  };

  // Circuit diagram node positions based on params
  const getCircuitPaths = () => {
    const threshold = (params.incomeThreshold - 25000) / 75000;
    const period = (params.consistencyPeriod - 3) / 9;
    const isMaxPrivacy = params.privacyLevel === "maximum";

    return {
      threshold,
      period,
      isMaxPrivacy,
    };
  };

  const circuit = getCircuitPaths();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl tracking-wide text-foreground mb-2">
          CIRCUIT CONFIGURATION
        </h1>
        <p className="text-muted-foreground text-sm">
          Configure ZK-SNARK circuit parameters for proof generation
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Parameter Controls */}
        <div className="space-y-6">
          {/* Income Threshold */}
          <div className="p-6 border border-border bg-card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary" />
                <span className="font-heading text-sm tracking-wide">INCOME THRESHOLD</span>
              </div>
              <span className="font-heading text-lg text-primary mono-data">
                {formatCurrency(params.incomeThreshold)}
              </span>
            </div>
            <Slider
              value={[params.incomeThreshold]}
              onValueChange={([value]) =>
                onParamsChange({ ...params, incomeThreshold: value })
              }
              min={25000}
              max={100000}
              step={5000}
              className="w-full"
            />
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>₹25,000</span>
              <span>₹100,000</span>
            </div>
          </div>

          {/* Consistency Period */}
          <div className="p-6 border border-border bg-card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-secondary" />
                <span className="font-heading text-sm tracking-wide">CONSISTENCY PERIOD</span>
              </div>
              <span className="font-heading text-lg text-secondary mono-data">
                {params.consistencyPeriod} months
              </span>
            </div>
            <Slider
              value={[params.consistencyPeriod]}
              onValueChange={([value]) =>
                onParamsChange({ ...params, consistencyPeriod: value })
              }
              min={3}
              max={12}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>3 months</span>
              <span>12 months</span>
            </div>
          </div>

          {/* Privacy Level */}
          <div className="p-6 border border-border bg-card">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 bg-foreground" />
              <span className="font-heading text-sm tracking-wide">PRIVACY LEVEL</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {(["standard", "maximum"] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => onParamsChange({ ...params, privacyLevel: level })}
                  className={`p-4 border text-left transition-all ${
                    params.privacyLevel === level
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-muted-foreground/50"
                  }`}
                >
                  <div className="font-heading text-sm tracking-wide uppercase mb-1">
                    {level}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {level === "standard"
                      ? "Reveals income band"
                      : "Only binary attestation"}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Circuit Diagram */}
        <div className="p-6 border border-border bg-card">
          <div className="flex items-center gap-2 mb-6">
            <AlgorandChain size={20} state="scanning" />
            <span className="font-heading text-sm tracking-wide">CIRCUIT TOPOLOGY</span>
          </div>

          <div className="relative h-80 bg-muted/20">
            <svg
              viewBox="0 0 200 160"
              className="w-full h-full"
              fill="none"
              strokeWidth="1.5"
              strokeLinecap="square"
            >
              {/* Input Gates */}
              <g className="stroke-muted-foreground">
                <rect x="10" y="20" width="20" height="20" />
                <text x="20" y="33" className="text-[6px] fill-muted-foreground text-center" textAnchor="middle">IN</text>
                
                <rect x="10" y="70" width="20" height="20" />
                <text x="20" y="83" className="text-[6px] fill-muted-foreground text-center" textAnchor="middle">IN</text>
                
                <rect x="10" y="120" width="20" height="20" />
                <text x="20" y="133" className="text-[6px] fill-muted-foreground text-center" textAnchor="middle">IN</text>
              </g>

              {/* Dynamic Circuit Paths */}
              <motion.path
                d={`M30 30 L60 30 L60 ${50 + circuit.threshold * 30} L90 ${50 + circuit.threshold * 30}`}
                className="stroke-primary"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5 }}
              />
              
              <motion.path
                d={`M30 80 L50 80 L50 ${60 + circuit.period * 20} L90 ${60 + circuit.period * 20}`}
                className="stroke-secondary"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              />
              
              <motion.path
                d={`M30 130 L${circuit.isMaxPrivacy ? 70 : 55} 130 L${circuit.isMaxPrivacy ? 70 : 55} ${80 + circuit.period * 10}`}
                className="stroke-foreground"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              />

              {/* Processing Gate */}
              <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <polygon
                  points="90,50 120,70 90,90"
                  className="stroke-primary fill-none"
                />
                <text x="98" y="73" className="text-[5px] fill-primary" textAnchor="middle">MUL</text>
              </motion.g>

              {/* Hash Gate */}
              <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <rect x="130" y="55" width="30" height="30" className="stroke-secondary fill-none" />
                <text x="145" y="73" className="text-[5px] fill-secondary" textAnchor="middle">HASH</text>
              </motion.g>

              {/* Connection to Hash */}
              <motion.path
                d="M120 70 L130 70"
                className="stroke-primary"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.3, delay: 0.5 }}
              />

              {/* Output */}
              <motion.path
                d="M160 70 L180 70"
                className="stroke-secondary"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.3, delay: 0.6 }}
              />

              <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                <circle cx="185" cy="70" r="8" className="stroke-secondary fill-secondary/20" />
                <text x="185" y="73" className="text-[5px] fill-secondary" textAnchor="middle">OUT</text>
              </motion.g>

              {/* Privacy Shield (Maximum) */}
              {circuit.isMaxPrivacy && (
                <motion.g
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <rect x="75" y="100" width="40" height="25" className="stroke-warning fill-warning/10" strokeDasharray="2 2" />
                  <text x="95" y="116" className="text-[5px] fill-warning" textAnchor="middle">REDACT</text>
                </motion.g>
              )}

              {/* Node dots */}
              <circle cx="60" cy="30" r="2" className="fill-primary" />
              <circle cx="50" cy="80" r="2" className="fill-secondary" />
              <circle cx={circuit.isMaxPrivacy ? 70 : 55} cy="130" r="2" className="fill-foreground" />
            </svg>

            {/* Circuit Stats */}
            <div className="absolute bottom-4 left-4 right-4 flex justify-between text-xs">
              <div className="text-muted-foreground">
                Constraints: <span className="text-foreground mono-data">847</span>
              </div>
              <div className="text-muted-foreground">
                R1CS: <span className="text-foreground mono-data">groth16_bn254</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <button
          onClick={onBack}
          className="px-6 py-2 font-heading text-sm tracking-wider text-muted-foreground hover:text-foreground transition-colors"
        >
          ← BACK
        </button>
        <button
          onClick={onGenerate}
          className="px-6 py-2 font-heading text-sm tracking-wider bg-primary text-primary-foreground hover:bg-primary/90 transition-all flex items-center gap-2"
        >
          <ShieldProof size={16} />
          GENERATE PROOF →
        </button>
      </div>
    </div>
  );
};
