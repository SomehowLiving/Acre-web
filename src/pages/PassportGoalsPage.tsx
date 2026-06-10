import { useEffect, useState } from "react";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from "recharts";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardTopBar from "@/components/dashboard/DashboardTopBar";
import { useWallet } from "@/contexts/WalletContext";
import {
  fetchGrowth, fetchPassport,
  type GrowthQuest, type GrowthResponse, type PassportResponse,
} from "@/lib/api";

// ─── Score Arc SVG ────────────────────────────────────────────────────────────

function ScoreArc({ score }: { score: number }) {
  const pct = Math.max(0, Math.min(1, (score - 300) / 600));
  const r = 52;
  const cx = 70, cy = 70;
  const startAngle = Math.PI * 0.8;
  const endAngle = Math.PI * 2.2;
  const totalArc = endAngle - startAngle;
  const sweep = pct * totalArc;

  const toXY = (a: number) => ({
    x: cx + r * Math.cos(a),
    y: cy + r * Math.sin(a),
  });

  const s = toXY(startAngle);
  const e = toXY(startAngle + sweep);
  const largeArc = sweep > Math.PI ? 1 : 0;

  const bgEnd = toXY(endAngle);
  const bgArc = endAngle - startAngle;
  const bgLarge = bgArc > Math.PI ? 1 : 0;

  const color = score >= 700 ? "#00e5ff" : score >= 530 ? "#a78bfa" : "#ec4899";

  return (
    <svg width="140" height="100" viewBox="0 0 140 100">
      {/* Background track */}
      <path
        d={`M ${s.x} ${s.y} A ${r} ${r} 0 ${bgLarge} 1 ${bgEnd.x} ${bgEnd.y}`}
        fill="none" stroke="#1e1e2e" strokeWidth="10" strokeLinecap="butt"
      />
      {/* Filled arc */}
      {pct > 0 && (
        <path
          d={`M ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} 1 ${e.x} ${e.y}`}
          fill="none" stroke={color} strokeWidth="10" strokeLinecap="butt"
        />
      )}
      <text x={cx} y={cy - 4} textAnchor="middle" fill={color} fontSize="22" fontWeight="700" fontFamily="monospace">{score}</text>
      <text x={cx} y={cy + 14} textAnchor="middle" fill="#888" fontSize="9">out of 900</text>
    </svg>
  );
}

// ─── Pillar card ──────────────────────────────────────────────────────────────

function Pillar({
  icon, label, status, items,
}: { icon: string; label: string; status: "verified" | "pending" | "none"; items: string[] }) {
  const colors = { verified: "text-secondary border-secondary/30 bg-secondary/5", pending: "text-yellow-400 border-yellow-600/30 bg-yellow-600/5", none: "text-muted-foreground border-border bg-muted/20" };
  const badges = { verified: "VERIFIED", pending: "PENDING", none: "NOT SET" };
  return (
    <div className={`p-4 border ${colors[status]} flex flex-col gap-2`}>
      <div className="flex items-center justify-between">
        <span className="text-lg">{icon}</span>
        <span className={`text-xs font-heading px-1.5 py-0.5 border ${colors[status]}`}>{badges[status]}</span>
      </div>
      <p className="font-heading text-sm">{label}</p>
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item} className="text-xs text-muted-foreground flex items-start gap-1.5">
            <span className="mt-0.5 shrink-0">{status === "verified" ? "✓" : "·"}</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Quest card ───────────────────────────────────────────────────────────────

function QuestCard({ quest }: { quest: GrowthQuest }) {
  const pct = Math.min(100, Math.round((quest.progressMonths / Math.max(1, quest.targetMonths)) * 100));
  return (
    <div className="p-4 border border-border bg-card space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-heading text-sm">{quest.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{quest.description}</p>
        </div>
        <span className="text-xs text-secondary border border-secondary/30 px-2 py-0.5 shrink-0 whitespace-nowrap">+{quest.pointsGap} pts</span>
      </div>
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Progress</span>
          <span>{pct}%</span>
        </div>
        <div className="h-1.5 bg-muted overflow-hidden">
          <div className="h-full bg-secondary transition-all duration-700" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <div className="text-xs border border-secondary/20 bg-secondary/5 px-3 py-2 text-secondary">
        Reward: {quest.reward}
      </div>
    </div>
  );
}

// ─── Delta pill ───────────────────────────────────────────────────────────────

function Delta({ label, pts }: { label: string; pts: number }) {
  return (
    <div className="flex items-center justify-between p-2.5 border border-border bg-background/50 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-heading ${pts > 0 ? "text-secondary" : "text-muted-foreground"}`}>
        {pts > 0 ? `+${pts}` : pts} pts
      </span>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

const PassportGoalsPage = () => {
  const { account } = useWallet();
  const [passport, setPassport] = useState<PassportResponse | null>(null);
  const [growth, setGrowth] = useState<GrowthResponse | null>(null);
  const [tab, setTab] = useState<"passport" | "journey" | "goals">("passport");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!account) { setPassport(null); setGrowth(null); return; }
    setLoading(true);
    Promise.all([
      fetchPassport(account).catch(() => null),
      fetchGrowth(account).catch(() => null),
    ]).then(([p, g]) => {
      setPassport(p);
      setGrowth(g as GrowthResponse | null);
    }).finally(() => setLoading(false));
  }, [account]);

  const p = passport?.passport;
  const score = p?.blueScore?.score ?? 0;
  const tier  = p?.blueScore?.tier ?? "Blue Basic";
  const signals = p?.blueScore?.signals;
  const history = p?.history;
  const journey = passport?.journey ?? [];
  const quests  = growth?.quests ?? [];

  // Radar data from breakdown
  const bd = p?.blueScore?.breakdown;
  const radarData = bd ? [
    { subject: "Income",      A: Math.round((bd.earnings?.normalized    ?? 0) * 100) },
    { subject: "Consistency", A: Math.round((bd.tenure?.normalized      ?? 0) * 100) },
    { subject: "Rating",      A: Math.round((bd.rating?.normalized      ?? 0) * 100) },
    { subject: "Activity",    A: Math.round((bd.activity?.normalized    ?? 0) * 100) },
    { subject: "Completion",  A: Math.round((bd.reliability?.normalized ?? 0) * 100) },
  ] : [];

  const tierColor = tier === "Blue Prime" ? "text-secondary border-secondary/40" : tier === "Blue Plus" ? "text-purple-400 border-purple-400/40" : "text-pink-400 border-pink-400/40";
  const tabs = [
    { id: "passport" as const, label: "Passport" },
    { id: "journey"  as const, label: "Work Journey" },
    { id: "goals"    as const, label: "Goals & Quests" },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col ml-[240px]">
        <DashboardTopBar />
        <main className="p-6 space-y-5">

          {/* Header */}
          <section className="p-6 border border-border bg-card">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p className="text-xs tracking-widest text-muted-foreground uppercase">Identity · Reputation · Goals</p>
                <h1 className="font-heading text-2xl mt-1">Financial Passport</h1>
                <p className="text-sm text-muted-foreground mt-1.5 max-w-xl">
                  Your ZK-verified proof of work — portable across lenders, owned by you, zero PII exposed.
                </p>
              </div>
              {account && (
                <div className="text-right text-xs text-muted-foreground font-mono">
                  <p>Wallet</p>
                  <p className="mt-0.5">{account.slice(0, 6)}…{account.slice(-6)}</p>
                  <p className="text-secondary mt-1">Algorand TestNet</p>
                </div>
              )}
            </div>
          </section>

          {/* Tabs */}
          <div className="flex gap-0 border-b border-border">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-5 py-2.5 text-xs font-heading tracking-wide border-b-2 transition-colors ${
                  tab === t.id ? "border-secondary text-secondary" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {loading && (
            <div className="text-xs text-muted-foreground py-4 text-center animate-pulse">Loading your passport…</div>
          )}

          {!loading && !account && (
            <div className="p-6 border border-border bg-card text-sm text-muted-foreground text-center">
              Connect your wallet to view your Financial Passport.
            </div>
          )}

          {/* ── TAB: PASSPORT ─────────────────────────────────────────────── */}
          {!loading && account && tab === "passport" && (
            <>
              {/* Score card + pillars row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                {/* Score card */}
                <div className="lg:col-span-1 p-5 border border-border bg-card flex flex-col items-center gap-4">
                  <ScoreArc score={score} />
                  <div className="text-center">
                    <span className={`text-sm font-heading px-3 py-1 border ${tierColor}`}>{tier}</span>
                    {p?.pointsToNextTier != null && p.pointsToNextTier > 0 && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {p.pointsToNextTier} pts to <span className="text-secondary">{p.nextTierLabel}</span>
                      </p>
                    )}
                    {tier === "Blue Prime" && (
                      <p className="text-xs text-secondary mt-2">Maximum tier reached</p>
                    )}
                  </div>
                  <div className="w-full space-y-2 text-xs">
                    <div className="flex justify-between border-b border-border pb-1.5">
                      <span className="text-muted-foreground">Credit limit</span>
                      <span className="font-heading">₹{(p?.finance?.currentCreditLimit ?? 0).toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between border-b border-border pb-1.5">
                      <span className="text-muted-foreground">Trips verified</span>
                      <span className="font-heading">{(p?.finance?.riderCount ?? 0).toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between border-b border-border pb-1.5">
                      <span className="text-muted-foreground">Platform rating</span>
                      <span className="font-heading">{(p?.finance?.riderRating ?? 0).toFixed(2)}★</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Fraud risk</span>
                      <span className={`font-heading ${p?.trust?.fraudRisk === "Low" ? "text-secondary" : "text-yellow-400"}`}>
                        {p?.trust?.fraudRisk ?? "—"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Trust pillars */}
                <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Pillar
                    icon="🏛️"
                    label="Government Identity"
                    status={p?.identity?.kycVerified ? "verified" : "pending"}
                    items={[
                      "Aadhaar via DigiLocker (Setu)",
                      "Indian citizen: confirmed",
                      "Age 18+: confirmed",
                      "Verified human: confirmed",
                      "Zero raw PII stored",
                    ]}
                  />
                  <Pillar
                    icon="⚡"
                    label="Platform Proof (ZK)"
                    status={signals?.source !== "address_seed" ? "verified" : "pending"}
                    items={[
                      `Source: ${signals?.source === "reclaim_proof" ? "Reclaim zk-TLS" : signals?.source === "onchain_derived" ? "On-chain record" : "Proof pending"}`,
                      `${(signals?.trips ?? 0).toLocaleString("en-IN")} trips on record`,
                      `₹${Math.round((signals?.earnings ?? 0) / 1000)}k/mo income band`,
                      "ECDSA signature verified",
                      "Wallet address bound",
                    ]}
                  />
                  <Pillar
                    icon="🔗"
                    label="On-Chain Record"
                    status={p?.identity?.identityBonded ? "verified" : "none"}
                    items={[
                      "Algorand TestNet: App 764223486",
                      `Consent anchor: ${history?.verificationCount ? "on-chain" : "pending"}`,
                      `${history?.verificationCount ?? 0} verification(s) recorded`,
                      history?.returning ? "Returning user +20 pts" : "First verification",
                      "Proof hash replay-guarded",
                    ]}
                  />
                </div>
              </div>

              {/* Radar chart */}
              {radarData.length > 0 && (
                <div className="p-5 border border-border bg-card">
                  <p className="font-heading text-sm mb-3 uppercase tracking-wide">Score Dimension Profile</p>
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    <ResponsiveContainer width={220} height={180}>
                      <RadarChart cx="50%" cy="50%" outerRadius={70} data={radarData}>
                        <PolarGrid stroke="#1e1e2e" />
                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: "#888" }} />
                        <Radar dataKey="A" stroke="#00e5ff" fill="#00e5ff" fillOpacity={0.15} strokeWidth={1.5} />
                        <Tooltip
                          contentStyle={{ background: "#0d0d14", border: "1px solid #222", fontSize: 11 }}
                          formatter={(v: number) => [`${v}%`, "Score"]}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs w-full">
                      {[
                        { label: "Income Stability (30%)", value: signals?.earnings ? `₹${Math.round(signals.earnings / 1000)}k/mo` : "—", pts: bd?.earnings?.contribution },
                        { label: "Consistency (25%)",      value: signals?.tenure != null ? `${signals.tenure} months` : "—",        pts: bd?.tenure?.contribution },
                        { label: "Platform Rating (20%)",  value: signals?.rating ? `${signals.rating.toFixed(2)}★` : "—",           pts: bd?.rating?.contribution },
                        { label: "Activity Volume (15%)",  value: signals?.trips ? `${signals.trips.toLocaleString("en-IN")} trips` : "—", pts: bd?.activity?.contribution },
                        { label: "Completion Rate (10%)",  value: signals?.completionRate ? `${signals.completionRate}%` : "—",      pts: bd?.reliability?.contribution },
                      ].map((r) => (
                        <div key={r.label} className="flex items-center justify-between p-2 border border-border bg-background/50">
                          <div>
                            <p className="text-muted-foreground">{r.label}</p>
                            <p className="font-heading mt-0.5">{r.value}</p>
                          </div>
                          <span className="text-secondary font-heading shrink-0">+{r.pts ?? 0}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ACRE history panel */}
              {history && (
                <div className="p-5 border border-border bg-card">
                  <p className="font-heading text-sm mb-3 uppercase tracking-wide">ACRE Reputation History</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    {[
                      { label: "Verifications", value: String(history.verificationCount) },
                      { label: "Months on ACRE", value: String(history.acreMonths) },
                      { label: "Returning User", value: history.returning ? "Yes (+20 pts)" : "No" },
                      { label: "Last Verified", value: history.daysSinceLastVerification != null ? `${history.daysSinceLastVerification}d ago` : "—" },
                    ].map((s) => (
                      <div key={s.label} className="p-3 border border-border bg-background/50">
                        <p className="text-muted-foreground uppercase">{s.label}</p>
                        <p className={`font-heading mt-1 ${s.label === "Returning User" && history.returning ? "text-secondary" : ""}`}>{s.value}</p>
                      </div>
                    ))}
                  </div>
                  {!history.returning && (
                    <p className="text-xs text-muted-foreground mt-3">
                      Re-verify after 30+ days for the +20 reputation bonus — permanently visible on your passport.
                    </p>
                  )}
                </div>
              )}

              {/* Trust summary row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="p-4 border border-secondary/20 bg-secondary/5">
                  <p className="font-heading text-sm mb-1">Privacy Guarantee</p>
                  <ul className="space-y-1 text-muted-foreground">
                    {["No Aadhaar number stored", "No raw income amount shared", "No platform credentials retained", "Only hashes + boolean flags"].map((l) => (
                      <li key={l} className="flex gap-1.5"><span className="text-secondary">✓</span>{l}</li>
                    ))}
                  </ul>
                </div>
                <div className="p-4 border border-border bg-card">
                  <p className="font-heading text-sm mb-1">Proof Freshness</p>
                  <p className="text-muted-foreground">Last verified: <span className="font-heading text-foreground">{p?.trust?.scoreVerifiedDaysAgo ?? "—"} days ago</span></p>
                  <p className="text-muted-foreground mt-1">Proof valid for: <span className="font-heading text-foreground">{p?.trust?.incomeProofExpiryDays ?? 28} days</span></p>
                  <p className="text-muted-foreground mt-1">Updates: <span className="font-heading text-foreground">{p?.trust?.reputationUpdateCadence}</span></p>
                </div>
                <div className="p-4 border border-border bg-card">
                  <p className="font-heading text-sm mb-1">Pipeline</p>
                  <ol className="space-y-1 text-muted-foreground">
                    {(passport?.pipeline ?? []).map((step, i) => (
                      <li key={step} className="flex gap-2">
                        <span className="text-secondary shrink-0">{i + 1}.</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </>
          )}

          {/* ── TAB: JOURNEY ─────────────────────────────────────────────── */}
          {!loading && account && tab === "journey" && (
            <>
              <div className="p-5 border border-border bg-card">
                <p className="font-heading text-sm mb-1 uppercase tracking-wide">ZK-Verified Work History</p>
                <p className="text-xs text-muted-foreground mb-5">
                  All data derived from Reclaim Protocol zero-knowledge proofs — no raw platform data shared.
                </p>

                <div className="relative pl-8 border-l-2 border-muted space-y-8">
                  {journey.map((step, i) => {
                    const isLatest = i === journey.length - 1;
                    return (
                      <div key={i} className="relative">
                        {/* Timeline dot */}
                        <div className={`absolute -left-[41px] top-1 w-5 h-5 flex items-center justify-center border-2 border-background ${isLatest ? "bg-secondary" : "bg-muted"}`}>
                          <span className={`text-xs font-heading ${isLatest ? "text-background" : "text-muted-foreground"}`}>{i + 1}</span>
                        </div>

                        <div className="p-4 border border-border bg-card space-y-3">
                          <div className="flex items-start justify-between gap-3 flex-wrap">
                            <div>
                              <p className="font-heading">{step.platform}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{step.tenure}</p>
                            </div>
                            {step.growthFromPrevious && (
                              <span className="text-xs text-secondary border border-secondary/30 px-2 py-0.5">
                                +{step.growthFromPrevious}% income growth
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                            {[
                              { label: "Income Band", value: step.incomeBand },
                              { label: "Rating",      value: `${step.rating}★` },
                              { label: "Completion",  value: `${step.completionRate}%` },
                              { label: "ZK Proof",    value: isLatest && signals?.source === "reclaim_proof" ? "Verified ✓" : "On record" },
                            ].map((f) => (
                              <div key={f.label} className="p-2 border border-border bg-background/50">
                                <p className="text-muted-foreground uppercase">{f.label}</p>
                                <p className="font-heading mt-0.5">{f.value}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div className="p-4 border border-border bg-card">
                  <p className="text-xs text-muted-foreground uppercase">Total Tenure</p>
                  <p className="font-heading text-2xl mt-1">{passport?.totalTenureMonths ?? "—"} mo</p>
                </div>
                <div className="p-4 border border-border bg-card">
                  <p className="text-xs text-muted-foreground uppercase">Income Growth</p>
                  <p className="font-heading text-2xl mt-1 text-secondary">{passport?.totalGrowth ?? "—"}</p>
                </div>
                <div className="p-4 border border-border bg-card">
                  <p className="text-xs text-muted-foreground uppercase">Reliability</p>
                  <p className="font-heading text-lg mt-1">{passport?.reliability ?? "—"}</p>
                </div>
              </div>

              <div className="p-4 border border-secondary/20 bg-secondary/5 text-xs text-muted-foreground">
                <span className="text-secondary font-heading">How lenders read this: </span>
                Cross-platform tenure and income growth prove you're a serious worker — not a one-off earner. Each step was proven via a Reclaim ZK proof; no raw credentials or earnings statements were shared with ACRE or any lender.
              </div>
            </>
          )}

          {/* ── TAB: GOALS ───────────────────────────────────────────────── */}
          {!loading && account && tab === "goals" && (
            <>
              {/* Score improvement levers */}
              {growth?.scoreDeltas && (
                <div className="p-5 border border-border bg-card">
                  <p className="font-heading text-sm mb-1 uppercase tracking-wide">Score Impact — What Moves Your Number</p>
                  <p className="text-xs text-muted-foreground mb-4">
                    Simulated point gain from a single realistic improvement in each dimension.
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    <Delta label="Earn 20% more / month" pts={growth.scoreDeltas.earnings} />
                    <Delta label="+3 consistent months" pts={growth.scoreDeltas.tenure} />
                    <Delta label="Rating +0.2★" pts={growth.scoreDeltas.rating} />
                    <Delta label="Completion rate +5%" pts={growth.scoreDeltas.completion} />
                    <Delta label="+200 trips" pts={growth.scoreDeltas.trips} />
                    <Delta label="Re-verify (reputation)" pts={growth.scoreDeltas.reputationBonus} />
                  </div>
                  {growth.pointsToNextTier != null && growth.pointsToNextTier > 0 && (
                    <div className="mt-4 p-3 border border-secondary/30 bg-secondary/5 text-xs">
                      <span className="text-secondary font-heading">Next tier: </span>
                      <span className="text-secondary">{growth.nextTierLabel}</span>
                      <span className="text-muted-foreground"> — {growth.pointsToNextTier} pts away. </span>
                      <span className="text-muted-foreground">Best move: focus on the highest delta above.</span>
                    </div>
                  )}
                </div>
              )}

              {/* Quests */}
              {quests.length > 0 ? (
                <div className="space-y-3">
                  <p className="font-heading text-sm uppercase tracking-wide px-1">Active Quests</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {quests.map((q) => <QuestCard key={q.id} quest={q} />)}
                  </div>
                </div>
              ) : (
                <div className="p-5 border border-border bg-card text-sm text-muted-foreground">
                  No active quests — you may already be at Blue Prime. Submit a fresh proof to refresh goals.
                </div>
              )}

              {/* Verified skills */}
              {(growth?.skills?.length ?? 0) > 0 && (
                <div className="p-5 border border-border bg-card">
                  <p className="font-heading text-sm mb-3 uppercase tracking-wide">Verified Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {growth!.skills.map((skill) => (
                      <span key={skill} className="text-xs px-3 py-1.5 border border-secondary/30 text-secondary bg-secondary/5">
                        ✓ {skill}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    Skills are derived from your ZK-verified proof data. No self-reported data accepted.
                  </p>
                </div>
              )}

              {/* Recommendations */}
              {(growth?.recommendations?.length ?? 0) > 0 && (
                <div className="p-5 border border-border bg-card space-y-3">
                  <p className="font-heading text-sm uppercase tracking-wide">Personalised Recommendations</p>
                  {growth!.recommendations.map((r, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 border border-border bg-background/50 text-sm">
                      <span className="text-secondary font-heading shrink-0">{i + 1}.</span>
                      <p className="text-muted-foreground">{r}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* What-if CTA */}
              <div className="p-5 border border-secondary/20 bg-secondary/5 flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="font-heading text-sm">Want to model exact changes?</p>
                  <p className="text-xs text-muted-foreground mt-1">Use the What-If Credit Simulator to set specific income, tenure, and rating values and see your exact projected score.</p>
                </div>
                <a href="/dashboard/simulator" className="px-4 py-2 border border-secondary text-secondary text-xs font-heading hover:bg-secondary/10 transition-colors whitespace-nowrap">
                  Open Simulator →
                </a>
              </div>
            </>
          )}

        </main>
      </div>
    </div>
  );
};

export default PassportGoalsPage;
