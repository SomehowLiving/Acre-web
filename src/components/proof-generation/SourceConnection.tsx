import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GigWorker, IncomeStream } from "@/components/ProofMarks";
import { QRCodeSVG } from "qrcode.react";

interface DataSource {
  id: string;
  name: string;
  type: string;
  icon: "gig" | "income";
}

const dataSources: DataSource[] = [
  { id: "uber", name: "Uber Driver", type: "Ride-sharing", icon: "gig" },
  { id: "swiggy", name: "Swiggy Delivery", type: "Food Delivery", icon: "income" },
  { id: "razorpay", name: "Razorpay Merchant", type: "Payment Gateway", icon: "income" },
  { id: "freelance", name: "Freelancer", type: "Freelance Platform", icon: "gig" },
];

type ConnectionStatus = "idle" | "handshaking" | "attesting" | "sealing" | "connected" | "error";

interface SourceConnectionProps {
  connectedSources: string[];
  onSourceConnect: (sourceId: string) => void;
  onNext: () => void;
  qrUrl?: string;
}

export const SourceConnection: React.FC<SourceConnectionProps> = ({
  connectedSources,
  onSourceConnect,
  onNext,
  qrUrl,
}) => {
  const [connectingSource, setConnectingSource] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("idle");
  const [packets, setPackets] = useState<number[]>([]);

  const handleConnect = async (sourceId: string) => {
    if (connectedSources.includes(sourceId) || connectingSource) return;
    
    setConnectingSource(sourceId);
    setConnectionStatus("handshaking");
    setPackets([]);

    // Show handshake animation while real proof generation happens
    setPackets([1]);
    
    // The actual proof generation is handled by the parent (GenerateProof page)
    // which calls onSourceConnect and triggers Reclaim SDK
    onSourceConnect(sourceId);
  };

  // Watch for when the source gets connected (parent updates connectedSources)
  useEffect(() => {
    if (connectingSource && connectedSources.includes(connectingSource)) {
      setConnectionStatus("connected");
      setTimeout(() => {
        setConnectingSource(null);
        setConnectionStatus("idle");
        setPackets([]);
      }, 500);
    }
  }, [connectedSources, connectingSource]);

  // Animate packets while connecting
  useEffect(() => {
    if (!connectingSource || connectedSources.includes(connectingSource)) return;
    
    const interval = setInterval(() => {
      setPackets((prev) => {
        if (prev.length >= 4) return [1];
        return [...prev, prev.length + 1];
      });
      setConnectionStatus((prev) => {
        if (prev === "handshaking") return "attesting";
        if (prev === "attesting") return "sealing";
        if (prev === "sealing") return "handshaking";
        return prev;
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [connectingSource, connectedSources]);

  const SignalStrength: React.FC<{ active: boolean; connected: boolean }> = ({ active, connected }) => {
    const [filledBars, setFilledBars] = useState(0);

    useEffect(() => {
      if (connected) {
        setFilledBars(3);
        return;
      }
      if (!active) {
        setFilledBars(0);
        return;
      }

      const interval = setInterval(() => {
        setFilledBars((prev) => (prev >= 3 ? 1 : prev + 1));
      }, 400);

      return () => clearInterval(interval);
    }, [active, connected]);

    return (
      <div className="flex items-end gap-0.5 h-4">
        {[1, 2, 3].map((bar) => (
          <motion.div
            key={bar}
            className={`w-1 transition-colors duration-200 ${
              filledBars >= bar
                ? connected
                  ? "bg-secondary"
                  : "bg-primary"
                : "bg-muted"
            }`}
            style={{ height: `${bar * 4 + 4}px` }}
            animate={{
              opacity: filledBars >= bar ? 1 : 0.3,
            }}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl tracking-wide text-foreground mb-2">
          SOURCE CONNECTION
        </h1>
        <p className="text-muted-foreground text-sm">
          Connect your income data sources via encrypted attestation channels
        </p>
      </div>

      {/* QR Code for Reclaim Proof (shown when a source is being connected) */}
      {qrUrl && connectingSource && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-4 p-6 border border-primary/30 bg-primary/5"
        >
          <div className="text-sm font-heading tracking-wider text-primary uppercase">
            Scan QR to verify your income
          </div>
          <div className="bg-white p-4">
            <QRCodeSVG value={qrUrl} size={220} />
          </div>
          <div className="text-xs text-muted-foreground">
            Open this QR code with your phone to log in and verify
          </div>
        </motion.div>
      )}

      {/* Terminal Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {dataSources.map((source) => {
          const isConnected = connectedSources.includes(source.id);
          const isConnecting = connectingSource === source.id;
          
          return (
            <motion.button
              key={source.id}
              onClick={() => handleConnect(source.id)}
              disabled={isConnected || !!connectingSource}
              className={`relative p-6 border text-left transition-all ${
                isConnected
                  ? "border-secondary/50 bg-secondary/5"
                  : isConnecting
                  ? "border-primary/50 bg-primary/5"
                  : "border-border hover:border-primary/30 bg-card"
              } ${!isConnected && !connectingSource ? "cursor-pointer" : ""}`}
              whileHover={!isConnected && !connectingSource ? { y: -2 } : {}}
              style={{
                boxShadow: isConnected
                  ? "4px 4px 0px 0px hsl(var(--secondary) / 0.15)"
                  : isConnecting
                  ? "4px 4px 0px 0px hsl(var(--primary) / 0.15)"
                  : "none",
              }}
            >
              {/* Terminal Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {source.icon === "gig" ? (
                    <GigWorker size={24} state={isConnecting ? "scanning" : isConnected ? "success" : "idle"} />
                  ) : (
                    <IncomeStream size={24} state={isConnecting ? "scanning" : isConnected ? "success" : "idle"} />
                  )}
                  <div>
                    <div className="font-heading text-sm tracking-wide text-foreground">
                      {source.name}
                    </div>
                    <div className="text-xs text-muted-foreground">{source.type}</div>
                  </div>
                </div>
                <SignalStrength active={isConnecting} connected={isConnected} />
              </div>

              {/* Connection Status */}
              <div className="h-16 relative">
                <AnimatePresence mode="wait">
                  {isConnecting ? (
                    <motion.div
                      key="connecting"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-2"
                    >
                      {/* TLS Tunnel Visualization */}
                      <div className="relative h-6 bg-muted/20 overflow-hidden">
                        <div className="absolute inset-y-0 left-0 right-0 flex items-center">
                          <div className="w-full h-px bg-border" />
                        </div>
                        {packets.map((packet, i) => (
                          <motion.div
                            key={`${packet}-${i}`}
                            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-primary"
                            initial={{ left: "0%", opacity: 0 }}
                            animate={{ left: "100%", opacity: [0, 1, 1, 0] }}
                            transition={{
                              duration: 0.8,
                              delay: i * 0.15,
                              ease: "easeOut",
                            }}
                          />
                        ))}
                        {/* Encrypted tunnel brackets */}
                        <div className="absolute left-2 top-0 bottom-0 flex items-center text-primary/50 font-mono text-xs">
                          [
                        </div>
                        <div className="absolute right-2 top-0 bottom-0 flex items-center text-primary/50 font-mono text-xs">
                          ]
                        </div>
                      </div>

                      {/* Status Text */}
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-primary animate-pulse" />
                        <span className="text-xs font-heading tracking-wider text-primary uppercase">
                          {connectionStatus === "handshaking" && "Handshaking..."}
                          {connectionStatus === "attesting" && "Attesting..."}
                          {connectionStatus === "sealing" && "Sealing..."}
                          {connectionStatus === "connected" && "Connected"}
                        </span>
                      </div>
                    </motion.div>
                  ) : isConnected ? (
                    <motion.div
                      key="connected"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-2"
                    >
                      <div className="w-1.5 h-1.5 bg-secondary" />
                      <span className="text-xs font-heading tracking-wider text-secondary uppercase">
                        Channel Secured
                      </span>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="idle"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-2"
                    >
                      <div className="w-1.5 h-1.5 bg-muted-foreground/50" />
                      <span className="text-xs text-muted-foreground">
                        Click to initiate TLS attestation
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Continue Action */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <div className="text-sm text-muted-foreground">
          {connectedSources.length} source{connectedSources.length !== 1 ? "s" : ""} connected
        </div>
        <button
          onClick={onNext}
          disabled={connectedSources.length === 0}
          className={`px-6 py-2 font-heading text-sm tracking-wider transition-all ${
            connectedSources.length > 0
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          }`}
        >
          CONFIGURE CIRCUIT →
        </button>
      </div>
    </div>
  );
};
