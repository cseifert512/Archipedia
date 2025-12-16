import React, { useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

import { LensFrame } from "../components/LensFrame";
import { Footer } from "../components/Footer";
import { Badge } from "../components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../components/ui/accordion";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Button } from "../components/ui/button";

import { trackEnterpriseEvent } from "../lib/analytics";
import { usePageMeta } from "../lib/seo";

function getApiBaseUrl(): string {
  const raw = (import.meta as any).env?.VITE_API_BASE_URL as string | undefined;
  return (raw && raw.trim()) ? raw.trim().replace(/\/+$/, "") : "http://localhost:8000";
}

const CALENDLY_DEMO_URL = "https://calendly.com/archipedia/demo"; // TODO: replace with real Calendly link
const ONE_PAGER_PATH = "/archipedia-enterprise-one-pager.pdf"; // placeholder PDF in /public

type FormState = {
  name: string;
  email: string;
  company: string;
  role: string;
  assetCount: string;
  deployment: string;
  message: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function validate(state: FormState): FormErrors {
  const e: FormErrors = {};
  if (!state.email.trim()) e.email = "Work email is required.";
  else if (!isEmail(state.email)) e.email = "Enter a valid email address.";
  if (!state.company.trim()) e.company = "Firm / organization is required.";
  if (!state.message.trim()) e.message = "Add a short note (what you want to index, who will use it).";
  return e;
}

function Section({
  id,
  eyebrow,
  title,
  children,
}: {
  id?: string;
  eyebrow?: string;
  title?: string;
  children?: React.ReactNode;
}) {
  return (
    <section id={id} className="container" style={{ paddingTop: "72px" }}>
      {(eyebrow || title) && (
        <div className="mb-6">
          {eyebrow && <div className="caption mb-2">{eyebrow}</div>}
          {title && <h2 className="heading-m">{title}</h2>}
        </div>
      )}
      {children}
    </section>
  );
}

function EnterpriseTopbar({
  onBookDemo,
  onTalkToSales,
}: {
  onBookDemo: () => void;
  onTalkToSales: () => void;
}) {
  const [, setLocation] = useLocation();

  return (
    <header className="fixed top-0 left-0 right-0 flex justify-center" style={{ paddingTop: "16px", zIndex: 50 }}>
      <div style={{ width: "75%", maxWidth: "75%", overflow: "hidden" }}>
        <LensFrame className="px-14 rounded-b-lg">
          <div className="flex items-center justify-between" style={{ paddingTop: "10px", paddingBottom: "10px" }}>
            <button
              type="button"
              onClick={() => setLocation("/")}
              className="hover:opacity-80 transition-opacity"
              style={{ fontFamily: "var(--font-primary)", color: "#000000", paddingLeft: "8px" }}
            >
              <div style={{ fontSize: "18px", fontWeight: 500, letterSpacing: "-0.01em" }}>ARCHIPEDIA</div>
              <div style={{ fontSize: "12px", fontWeight: 300, opacity: 0.7 }}>Enterprise</div>
            </button>

            <div className="flex items-center gap-2" style={{ paddingRight: "8px" }}>
              <button
                type="button"
                onClick={onTalkToSales}
                className="hover:opacity-90 transition-all"
                style={{
                  fontFamily: "var(--font-primary)",
                  fontSize: "12px",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  borderRadius: "10px",
                  border: "1px solid rgba(0,0,0,0.18)",
                  background: "rgba(255,255,255,0.55)",
                  padding: "10px 12px",
                  backdropFilter: "blur(6px)",
                  WebkitBackdropFilter: "blur(6px)",
                }}
              >
                Talk to sales
              </button>
              <button
                type="button"
                onClick={onBookDemo}
                className="hover:opacity-90 transition-all"
                style={{
                  fontFamily: "var(--font-primary)",
                  fontSize: "12px",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  borderRadius: "10px",
                  border: "1px solid rgba(0,0,0,0.12)",
                  background: "var(--accent)",
                  padding: "10px 12px",
                }}
              >
                Book a demo
              </button>
            </div>
          </div>
        </LensFrame>
      </div>
    </header>
  );
}

function ArchitectureDiagram() {
  return (
    <div className="glass rounded-xl border border-[var(--border-light)] p-6 overflow-x-auto">
      <svg width="980" height="260" viewBox="0 0 980 260" role="img" aria-label="Enterprise architecture diagram">
        <defs>
          <style>{`
            .box { fill: rgba(255,255,255,0.55); stroke: rgba(0,0,0,0.14); stroke-width: 1.25; }
            .label { font-family: Inter, ui-sans-serif, system-ui; font-size: 12px; fill: rgba(0,0,0,0.85); }
            .muted { fill: rgba(0,0,0,0.55); font-size: 11px; }
            .title { font-family: "Space Grotesk", ui-sans-serif, system-ui; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; }
            .line { stroke: rgba(0,0,0,0.22); stroke-width: 1.25; fill: none; }
            .boundary { fill: rgba(255, 200, 0, 0.06); stroke: rgba(0,0,0,0.14); stroke-dasharray: 5 4; }
          `}</style>
        </defs>

        <rect x="18" y="22" width="944" height="216" rx="14" className="boundary" />
        <text x="34" y="44" className="title">Customer tenant</text>

        <rect x="60" y="72" width="160" height="58" rx="12" className="box" />
        <text x="82" y="98" className="label">Client</text>
        <text x="82" y="116" className="muted">Browser / UI</text>

        <rect x="260" y="72" width="160" height="58" rx="12" className="box" />
        <text x="282" y="98" className="label">API</text>
        <text x="282" y="116" className="muted">Auth + query</text>

        <rect x="460" y="62" width="200" height="78" rx="12" className="box" />
        <text x="482" y="92" className="label">Embedding / Index</text>
        <text x="482" y="110" className="muted">Images + PDFs → vectors</text>

        <rect x="700" y="62" width="220" height="78" rx="12" className="box" />
        <text x="722" y="92" className="label">Vector index</text>
        <text x="722" y="110" className="muted">FAISS (per-tenant)</text>

        <rect x="460" y="160" width="200" height="58" rx="12" className="box" />
        <text x="482" y="186" className="label">Metadata store</text>
        <text x="482" y="204" className="muted">Projects / tags / ACL</text>

        <rect x="700" y="160" width="220" height="58" rx="12" className="box" />
        <text x="722" y="186" className="label">Asset storage</text>
        <text x="722" y="204" className="muted">Object store / files</text>

        <rect x="60" y="160" width="360" height="58" rx="12" className="box" />
        <text x="82" y="186" className="label">Connectors (optional)</text>
        <text x="82" y="204" className="muted">Drive / Dropbox / SharePoint / S3</text>

        <path className="line" d="M220 101 L260 101" />
        <path className="line" d="M420 101 L460 101" />
        <path className="line" d="M660 101 L700 101" />
        <path className="line" d="M560 140 L560 160" />
        <path className="line" d="M660 189 L700 189" />
        <path className="line" d="M420 189 L460 189" />
        <path className="line" d="M420 189 L420 189" />
        <path className="line" d="M240 189 L260 189" />
      </svg>
    </div>
  );
}

export function EnterprisePage() {
  usePageMeta({
    title: "Archipedia Enterprise — Your firm’s entire design archive. Searchable by image.",
    description:
      "Archipedia Enterprise indexes your private project archive so teams can retrieve precedents, details, and visual patterns in seconds—without leaking IP.",
  });

  const contactRef = useRef<HTMLDivElement | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitOk, setSubmitOk] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [state, setState] = useState<FormState>({
    name: "",
    email: "",
    company: "",
    role: "",
    assetCount: "a few thousand",
    deployment: "single-tenant (recommended)",
    message: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const features = useMemo(
    () => [
      { title: "Private internal indexing", desc: "Index images + PDFs into a permissioned workspace. Your archive stays yours." },
      { title: "Visual search", desc: "Upload any image → retrieve similar internal work and details." },
      { title: "Metadata + filters", desc: "Project type, year, client, studio, location, tags—fast slicing, no filename games." },
      { title: "Boards / collections", desc: "Save precedent sets and share them across teams." },
      { title: "Node-based workflows", desc: "Combine queries, weights, and filters into repeatable explorations.", badge: "Roadmap" },
      { title: "Access control", desc: "Workspace roles + scoped permissions (Admin / Editor / Viewer)." },
      { title: "Audit trail", desc: "Who searched what, what was shared, and when—exportable for governance.", badge: "Roadmap" },
      { title: "Admin tools", desc: "Ingest monitor, reindexing, source management, and connector controls.", badge: "Roadmap" },
    ],
    [],
  );

  const faqs = useMemo(
    () => [
      {
        q: "Can you index our internal projects and keep them private?",
        a: "Yes. Enterprise is designed for private, permissioned indexing: data is isolated per workspace/tenant and access can be scoped by team, studio, or project.",
      },
      {
        q: "Do you train models on our data?",
        a: "Configurable. Enterprise deployments can be set up so customer data is excluded from any retention and training workflows. Your embeddings and indexes are built for your workspace.",
      },
      {
        q: "What file types do you support?",
        a: "Images (JPG/PNG) and PDFs are the baseline. If you have a specific archive format (decks, boards, exported BIM sheets), we’ll scope it during discovery.",
      },
      {
        q: "Can we restrict access by studio / project / team?",
        a: "Yes. Enterprise is built around roles and scoped permissions. We can align it to your existing org structure and folder conventions.",
      },
      {
        q: "Can we host this in our environment?",
        a: "Often, yes. We can support single-tenant and (when required) private cloud / VPC-style deployments. We’ll confirm requirements in the first call.",
      },
      {
        q: "What’s the minimum data needed to get value?",
        a: "A pilot typically starts with a representative slice: a few thousand assets is enough to validate workflows, taxonomy, and retrieval quality before scaling.",
      },
      {
        q: "How does this differ from our DAM/SharePoint search?",
        a: "DAM search is usually filename/metadata-first. Archipedia is visual-first: you can retrieve by image similarity, then refine with metadata and collections—closer to how designers actually search.",
      },
      {
        q: "Do you support BIM/CAD?",
        a: "Not as native BIM/CAD parsing in the core workflow today. Many teams start by indexing exported sheets (PDFs/images) and key visuals. If BIM/CAD is a must-have, we’ll treat it as an enterprise scope item.",
      },
      {
        q: "How do you handle attribution and citations for external precedents?",
        a: "If you enable blending with public precedents, we can preserve source attribution and links, and keep external results clearly separated from internal content.",
      },
      {
        q: "What does pricing look like?",
        a: "Enterprise pricing depends on asset count, deployment needs, and support level. Pilot packages are available; annual contracts are typical for teams and firms.",
      },
    ],
    [],
  );

  const scrollToContact = () => {
    trackEnterpriseEvent("request_access", { location: "topbar_or_hero" });
    contactRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const onBookDemo = () => {
    trackEnterpriseEvent("book_demo", { location: "topbar_or_hero" });
    window.open(CALENDLY_DEMO_URL, "_blank", "noopener,noreferrer");
  };

  const onDownloadOnePager = () => {
    trackEnterpriseEvent("download_one_pager", { location: "hero" });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitOk(false);

    const v = validate(state);
    setErrors(v);
    if (Object.keys(v).length) {
      toast.error("Fix the highlighted fields.");
      return;
    }

    setSubmitting(true);
    try {
      const base = getApiBaseUrl();
      const res = await fetch(`${base}/enterprise/lead`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: state.name || undefined,
          email: state.email,
          company: state.company,
          role: state.role || undefined,
          asset_count: state.assetCount,
          deployment: state.deployment,
          message: state.message,
          source: "enterprise_page",
        }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Request failed (${res.status})`);
      }

      setSubmitOk(true);
      toast.success("Request received — we’ll reach out shortly.");
      trackEnterpriseEvent("request_access", { location: "form_submit", ok: true });
    } catch (err: any) {
      const msg = err?.message ? String(err.message) : "Submission failed.";
      setSubmitError(msg);
      toast.error("Couldn’t submit. Try again or book a demo.");
      trackEnterpriseEvent("request_access", { location: "form_submit", ok: false, error: msg });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] relative">
      <EnterpriseTopbar onBookDemo={onBookDemo} onTalkToSales={scrollToContact} />

      <main
        style={{
          paddingTop: "110px",
          paddingBottom: "170px",
        }}
      >
        {/* Hero */}
        <section className="container" style={{ paddingTop: "56px" }}>
          <div className="grid gap-10 md:grid-cols-2 items-start">
            <div>
              <div className="caption mb-3">Archipedia for Teams</div>
              <h1 className="heading-l" style={{ maxWidth: "20ch" }}>
                Your firm’s entire design archive. Searchable by image.
              </h1>
              <p className="body-l" style={{ marginTop: "14px", maxWidth: "56ch" }}>
                Archipedia Enterprise indexes your private project archive so teams can retrieve precedents, details, and visual patterns in seconds—without leaking IP.
              </p>

              <ul className="body-m" style={{ marginTop: "18px", display: "grid", gap: "8px" }}>
                <li>• Private index of your internal work</li>
                <li>• Permissions + audit trail</li>
                <li>• Single-tenant or VPC deployment options</li>
              </ul>

              <div className="flex flex-wrap items-center gap-3" style={{ marginTop: "22px" }}>
                <button
                  type="button"
                  onClick={onBookDemo}
                  className="hover:opacity-90 transition-all"
                  style={{
                    fontFamily: "var(--font-primary)",
                    fontSize: "14px",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    borderRadius: "12px",
                    border: "1px solid rgba(0,0,0,0.12)",
                    background: "var(--accent)",
                    padding: "14px 16px",
                  }}
                >
                  Book a demo
                </button>
                <button
                  type="button"
                  onClick={scrollToContact}
                  className="hover:opacity-90 transition-all"
                  style={{
                    fontFamily: "var(--font-primary)",
                    fontSize: "14px",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    borderRadius: "12px",
                    border: "1px solid rgba(0,0,0,0.18)",
                    background: "rgba(255,255,255,0.55)",
                    padding: "14px 16px",
                    backdropFilter: "blur(6px)",
                    WebkitBackdropFilter: "blur(6px)",
                  }}
                >
                  Request access
                </button>
                <a
                  href={ONE_PAGER_PATH}
                  download
                  onClick={onDownloadOnePager}
                  className="hover:underline"
                  style={{
                    fontFamily: "var(--font-primary)",
                    fontSize: "14px",
                    fontWeight: 300,
                    opacity: 0.8,
                  }}
                >
                  Download one-pager
                </a>
              </div>
            </div>

            <div>
              <LensFrame className="rounded-xl p-4">
                <div className="relative rounded-xl overflow-hidden">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg overflow-hidden border border-[rgba(0,0,0,0.12)]">
                      <img
                        src="https://images.unsplash.com/photo-1677161795040-7cf4d7007312?w=900"
                        alt="UI montage placeholder"
                        className="w-full h-[220px] object-cover"
                      />
                    </div>
                    <div className="rounded-lg overflow-hidden border border-[rgba(0,0,0,0.12)]">
                      <img
                        src="https://images.unsplash.com/photo-1582719478170-2ba9c81b11b6?w=900"
                        alt="UI montage placeholder"
                        className="w-full h-[220px] object-cover"
                      />
                    </div>
                    <div className="rounded-lg overflow-hidden border border-[rgba(0,0,0,0.12)] col-span-2">
                      <img
                        src="https://images.unsplash.com/photo-1654371404345-845d8aa147f3?w=1200"
                        alt="UI montage placeholder"
                        className="w-full h-[220px] object-cover"
                      />
                    </div>
                  </div>

                  <div
                    className="absolute top-3 left-3 px-2 py-1 rounded"
                    style={{
                      background: "rgba(0,0,0,0.75)",
                      color: "#fff",
                      fontFamily: "var(--font-primary)",
                      fontSize: "11px",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                    }}
                  >
                    Private library
                  </div>
                </div>
              </LensFrame>
              <div className="body-s" style={{ marginTop: "10px", opacity: 0.7 }}>
                Visuals are placeholders—swap in your real product screenshots when ready.
              </div>
            </div>
          </div>
        </section>

        {/* Social proof strip */}
        <section className="container" style={{ paddingTop: "36px" }}>
          <div className="glass rounded-xl border border-[var(--border-light)] p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="caption mb-2">Built for architecture + design teams</div>
                <div className="body-m">Studios • Schools • ID teams • Visualization groups</div>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-2 rounded-full border border-[rgba(0,0,0,0.12)] body-s bg-white/50">Studios</span>
                <span className="px-3 py-2 rounded-full border border-[rgba(0,0,0,0.12)] body-s bg-white/50">Schools</span>
                <span className="px-3 py-2 rounded-full border border-[rgba(0,0,0,0.12)] body-s bg-white/50">ID teams</span>
                <span className="px-3 py-2 rounded-full border border-[rgba(0,0,0,0.12)] body-s bg-white/50">Viz groups</span>
                <span className="px-3 py-2 rounded-full border border-dashed border-[rgba(0,0,0,0.18)] body-s bg-white/30">Pilot partners: your logo here</span>
              </div>
            </div>
          </div>
        </section>

        {/* Problem → Outcome */}
        <Section id="why" eyebrow="Why enterprise buys" title="Institutional memory, retrieved fast.">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="glass rounded-xl border border-[var(--border-light)] p-6">
              <div className="caption mb-3">The pain</div>
              <ul className="body-m" style={{ display: "grid", gap: "10px" }}>
                <li>• Project knowledge is trapped in folders, PDFs, old decks, and personal drives.</li>
                <li>• Teams redo precedent research from scratch.</li>
                <li>• New staff can’t find relevant internal examples.</li>
                <li>• Great ideas disappear when people leave.</li>
              </ul>
            </div>
            <div className="glass rounded-xl border border-[var(--border-light)] p-6">
              <div className="caption mb-3">The outcomes</div>
              <ul className="body-m" style={{ display: "grid", gap: "10px" }}>
                <li>• Search past work visually, not by filename.</li>
                <li>• Faster concept-to-direction alignment.</li>
                <li>• Reusable details + assemblies discovered early.</li>
                <li>• Better onboarding + consistent quality.</li>
              </ul>
            </div>
          </div>
        </Section>

        {/* What you get */}
        <Section id="features" eyebrow="What you get" title="A private precedent engine for your firm.">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div key={f.title} className="glass glass-hover rounded-xl border border-[var(--border-light)] p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="heading-s" style={{ fontSize: "18px", lineHeight: 1.25 }}>
                    {f.title}
                  </div>
                  {f.badge && (
                    <Badge variant="outline" className="bg-white/60 border-[rgba(0,0,0,0.12)] text-[12px]">
                      {f.badge}
                    </Badge>
                  )}
                </div>
                <div className="body-m" style={{ marginTop: "10px" }}>
                  {f.desc}
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Security + deployment */}
        <Section id="security" eyebrow="Security, privacy, deployment" title="Security-review friendly.">
          <div className="grid gap-6 lg:grid-cols-2 items-start">
            <div className="glass rounded-xl border border-[var(--border-light)] p-6">
              <div className="caption mb-3">Data isolation</div>
              <ul className="body-m" style={{ display: "grid", gap: "10px" }}>
                <li>
                  <strong>Single-tenant</strong> (recommended default): dedicated workspace boundaries and indexes.
                </li>
                <li>
                  <strong>Optional private cloud / VPC</strong>: supported in enterprise deployments when required by IT.
                </li>
              </ul>

              <div className="caption mb-3" style={{ marginTop: "18px" }}>Data handling</div>
              <ul className="body-m" style={{ display: "grid", gap: "10px" }}>
                <li>• Your data is used only for your workspace.</li>
                <li>• Configurable: customer data can be excluded from any training/retention workflows.</li>
              </ul>

              <div className="caption mb-3" style={{ marginTop: "18px" }}>Auth + access control</div>
              <ul className="body-m" style={{ display: "grid", gap: "10px" }}>
                <li>• Role-based permissions: Admin, Editor, Viewer.</li>
                <li>• SSO/SAML (Okta / Google Workspace): supported in enterprise deployments (scope-dependent).</li>
              </ul>

              <div className="caption mb-3" style={{ marginTop: "18px" }}>Compliance posture</div>
              <div className="body-m">
                No empty claims. We’re security-review friendly: we can provide architecture diagrams, data flow, and vendor questionnaire responses.
              </div>
            </div>

            <div className="space-y-4">
              <ArchitectureDiagram />
              <div className="body-s" style={{ opacity: 0.7 }}>
                Diagram is representative. Exact components depend on deployment and connectors.
              </div>
            </div>
          </div>
        </Section>

        {/* Integrations */}
        <Section id="integrations" eyebrow="Integrations & ingestion" title="Connect your archive.">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="glass rounded-xl border border-[var(--border-light)] p-6">
              <div className="caption mb-3">Sources</div>
              <ul className="body-m" style={{ display: "grid", gap: "10px" }}>
                <li>• Folder upload / batch import (baseline)</li>
                <li>• S3 bucket import (pilot)</li>
                <li>• Google Drive / Dropbox / SharePoint connectors (roadmap)</li>
              </ul>
            </div>
            <div className="glass rounded-xl border border-[var(--border-light)] p-6">
              <div className="caption mb-3">Ingestion pipeline</div>
              <div className="body-m">
                We ingest images + PDFs, generate embeddings, store metadata, and build a searchable vector index. Typical pilots index a few thousand–tens of thousands of assets.
              </div>
            </div>
          </div>
        </Section>

        {/* Implementation */}
        <Section id="implementation" eyebrow="Implementation" title="Days, not months.">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              { t: "Discovery (1–2 hrs)", d: "Choose data sources, permissions, and success criteria." },
              { t: "Pilot index (days)", d: "Ingest a representative slice of your archive." },
              { t: "Team rollout", d: "Onboarding, workflows, and feedback loop." },
              { t: "Scale + governance", d: "Expand coverage, connectors, and policies." },
            ].map((s) => (
              <div key={s.t} className="glass glass-hover rounded-xl border border-[var(--border-light)] p-6">
                <div className="heading-s" style={{ fontSize: "18px" }}>{s.t}</div>
                <div className="body-m" style={{ marginTop: "10px" }}>{s.d}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* ROI / Use cases */}
        <Section id="roi" eyebrow="ROI / Use cases" title="Make the work you already did usable again.">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              { t: "Precedent research in minutes", d: "Reduce time spent searching and re-creating reference sets." },
              { t: "Reduce repeated work", d: "Spot similar details and solutions across teams early." },
              { t: "Onboard new staff faster", d: "New hires find internal examples without tribal knowledge." },
              { t: "Shorten alignment cycles", d: "Move from concept to direction with shared boards." },
            ].map((u) => (
              <div key={u.t} className="glass rounded-xl border border-[var(--border-light)] p-6">
                <div className="heading-s" style={{ fontSize: "18px" }}>{u.t}</div>
                <div className="body-m" style={{ marginTop: "10px" }}>{u.d}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* Pricing */}
        <Section id="pricing" eyebrow="Pricing" title="Serious, enterprise-friendly.">
          <div className="glass rounded-xl border border-[var(--border-light)] p-6">
            <div className="body-m">
              Enterprise pricing depends on asset count, deployment needs, and support level. Pilot packages available. Annual contracts for teams; single-tenant for firms.
            </div>
          </div>
        </Section>

        {/* One-pager */}
        <Section id="one-pager" eyebrow="One-pager" title="Share internally.">
          <div className="glass rounded-xl border border-[var(--border-light)] p-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="heading-s" style={{ fontSize: "18px" }}>Archipedia Enterprise PDF</div>
              <div className="body-m" style={{ marginTop: "8px" }}>
                A concise overview for partners and IT. (Placeholder—replace with your final PDF.)
              </div>
            </div>
            <a
              href={ONE_PAGER_PATH}
              download
              onClick={() => trackEnterpriseEvent("download_one_pager", { location: "one_pager_section" })}
              className="hover:opacity-90 transition-opacity"
              style={{
                fontFamily: "var(--font-primary)",
                fontSize: "12px",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                borderRadius: "12px",
                border: "1px solid rgba(0,0,0,0.12)",
                background: "rgba(255,255,255,0.55)",
                padding: "12px 14px",
                backdropFilter: "blur(6px)",
                WebkitBackdropFilter: "blur(6px)",
              }}
              rel="noopener noreferrer"
              target="_blank"
            >
              Download one-pager
            </a>
          </div>
        </Section>

        {/* FAQ */}
        <Section id="faq" eyebrow="FAQ" title="Buyer questions, answered.">
          <div className="glass rounded-xl border border-[var(--border-light)] p-6">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((f, idx) => (
                <AccordionItem key={f.q} value={`item-${idx}`}>
                  <AccordionTrigger>{f.q}</AccordionTrigger>
                  <AccordionContent>
                    <div className="body-m">{f.a}</div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </Section>

        {/* Contact form */}
        <section className="container" style={{ paddingTop: "72px" }}>
          <div ref={contactRef} id="contact" />
          <div className="mb-6">
            <div className="caption mb-2">Request access / Talk to sales</div>
            <h2 className="heading-m">Show your archive searchable by image.</h2>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="glass rounded-xl border border-[var(--border-light)] p-6">
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="caption" htmlFor="name">Name</label>
                    <Input
                      id="name"
                      value={state.name}
                      onChange={(e) => setState((s) => ({ ...s, name: e.target.value }))}
                      placeholder="Your name"
                      className="mt-2 bg-white/60"
                    />
                  </div>
                  <div>
                    <label className="caption" htmlFor="role">Role</label>
                    <Input
                      id="role"
                      value={state.role}
                      onChange={(e) => setState((s) => ({ ...s, role: e.target.value }))}
                      placeholder="Principal, PM, Design Lead…"
                      className="mt-2 bg-white/60"
                    />
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="caption" htmlFor="email">Work email *</label>
                    <Input
                      id="email"
                      value={state.email}
                      onChange={(e) => setState((s) => ({ ...s, email: e.target.value }))}
                      placeholder="name@firm.com"
                      className="mt-2 bg-white/60"
                      aria-invalid={Boolean(errors.email)}
                    />
                    {errors.email && <div className="text-[12px] mt-1" style={{ color: "#b00020" }}>{errors.email}</div>}
                  </div>
                  <div>
                    <label className="caption" htmlFor="company">Firm / organization *</label>
                    <Input
                      id="company"
                      value={state.company}
                      onChange={(e) => setState((s) => ({ ...s, company: e.target.value }))}
                      placeholder="Your firm"
                      className="mt-2 bg-white/60"
                      aria-invalid={Boolean(errors.company)}
                    />
                    {errors.company && <div className="text-[12px] mt-1" style={{ color: "#b00020" }}>{errors.company}</div>}
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="caption" htmlFor="assetCount">Archive size (rough)</label>
                    <select
                      id="assetCount"
                      value={state.assetCount}
                      onChange={(e) => setState((s) => ({ ...s, assetCount: e.target.value }))}
                      className="mt-2 w-full rounded-md border border-[rgba(0,0,0,0.12)] bg-white/60 px-3 py-2 text-[14px] outline-none focus:border-[var(--accent)]"
                    >
                      <option value="a few thousand">A few thousand</option>
                      <option value="tens of thousands">Tens of thousands</option>
                      <option value="hundreds of thousands+">Hundreds of thousands+</option>
                      <option value="not sure">Not sure</option>
                    </select>
                  </div>
                  <div>
                    <label className="caption" htmlFor="deployment">Deployment preference</label>
                    <select
                      id="deployment"
                      value={state.deployment}
                      onChange={(e) => setState((s) => ({ ...s, deployment: e.target.value }))}
                      className="mt-2 w-full rounded-md border border-[rgba(0,0,0,0.12)] bg-white/60 px-3 py-2 text-[14px] outline-none focus:border-[var(--accent)]"
                    >
                      <option value="single-tenant (recommended)">Single-tenant (recommended)</option>
                      <option value="private cloud / VPC">Private cloud / VPC</option>
                      <option value="not sure">Not sure</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="caption" htmlFor="message">What should we index? *</label>
                  <Textarea
                    id="message"
                    value={state.message}
                    onChange={(e) => setState((s) => ({ ...s, message: e.target.value }))}
                    placeholder="E.g. project archive folders + PDFs (decks/boards), typical tags, studios, access model…"
                    className="mt-2 bg-white/60"
                    aria-invalid={Boolean(errors.message)}
                  />
                  {errors.message && <div className="text-[12px] mt-1" style={{ color: "#b00020" }}>{errors.message}</div>}
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="bg-[var(--accent)] text-black hover:bg-[var(--accent-hover)]"
                  >
                    {submitting ? "Submitting…" : "Request access"}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="bg-white/60 hover:bg-white/80"
                    onClick={onBookDemo}
                  >
                    Book a demo
                  </Button>
                </div>

                {submitOk && (
                  <div className="body-m" style={{ color: "rgba(0,0,0,0.75)" }}>
                    Received. We’ll follow up via email.
                  </div>
                )}
                {submitError && (
                  <div className="body-m" style={{ color: "#b00020" }}>
                    {submitError}
                  </div>
                )}

                <div className="body-s" style={{ opacity: 0.7 }}>
                  Prefer email?{" "}
                  <a href="mailto:sales@archipedia.ai" className="hover:underline">
                    sales@archipedia.ai
                  </a>{" "}
                  (fallback).
                </div>
              </form>
            </div>

            <div className="glass rounded-xl border border-[var(--border-light)] p-6">
              <div className="caption mb-2">What we sell</div>
              <div className="heading-s" style={{ fontSize: "22px" }}>Archipedia Enterprise = retrieval, not “AI magic.”</div>
              <div className="body-m" style={{ marginTop: "12px" }}>
                A private workspace that turns your internal archive into a fast visual search engine—so teams stop re-doing research and start re-using what already works.
              </div>
              <ul className="body-m" style={{ marginTop: "16px", display: "grid", gap: "10px" }}>
                <li>• Index internal images + PDFs</li>
                <li>• Blend internal with public precedents (optional, permissioned)</li>
                <li>• Boards + sharing for alignment</li>
                <li>• Audit + governance for IT</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="container" style={{ paddingTop: "72px" }}>
          <div className="glass rounded-2xl border border-[var(--border-light)] p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="heading-m">Make your archive usable.</div>
              <div className="body-m" style={{ marginTop: "10px" }}>
                Book a demo and we’ll show your own work searchable by image.
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onBookDemo}
                className="hover:opacity-90 transition-all"
                style={{
                  fontFamily: "var(--font-primary)",
                  fontSize: "14px",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  borderRadius: "12px",
                  border: "1px solid rgba(0,0,0,0.12)",
                  background: "var(--accent)",
                  padding: "14px 16px",
                }}
              >
                Book demo
              </button>
              <button
                type="button"
                onClick={scrollToContact}
                className="hover:opacity-90 transition-all"
                style={{
                  fontFamily: "var(--font-primary)",
                  fontSize: "14px",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  borderRadius: "12px",
                  border: "1px solid rgba(0,0,0,0.18)",
                  background: "rgba(255,255,255,0.55)",
                  padding: "14px 16px",
                  backdropFilter: "blur(6px)",
                  WebkitBackdropFilter: "blur(6px)",
                }}
              >
                Contact sales
              </button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}


