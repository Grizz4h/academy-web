import React, { useState } from "react";
import { GLOSSARY } from "../content/glossary";

interface GlossaryTermProps {
  term: string;
  children: React.ReactNode;
  customGlossary?: { [key: string]: string };
}

type ResolvedGlossaryEntry = {
  label: string;
  short: string;
  long: string;
  synonyms?: string[];
  tags?: string[];
};

function slugify(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[^0-\u00FF\w\s-]/g, "")
    .replace(/_/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function resolveLocalGlossaryEntry(
  term: string,
  customGlossary?: { [key: string]: string }
): ResolvedGlossaryEntry | undefined {
  if (!customGlossary) return undefined;

  const slug = slugify(term);
  const localMatch = Object.entries(customGlossary).find(([key]) => slugify(key) === slug);
  if (!localMatch) return undefined;

  const [key, definition] = localMatch;
  return {
    label: key.charAt(0).toUpperCase() + key.slice(1),
    short: definition,
    long: definition,
    tags: ["Drill"],
  };
}

export function GlossaryTerm({ term, children, customGlossary }: GlossaryTermProps) {
  const slug = slugify(term);

  // Prefer drill-local glossary entries, then fall back to global glossary.
  let entry: ResolvedGlossaryEntry | undefined = resolveLocalGlossaryEntry(term, customGlossary);
  if (!entry) {
    entry = GLOSSARY[slug];
  }
  if (!entry) {
    entry = Object.values(GLOSSARY).find(
      e => slugify(e.label) === slug || (e.synonyms && e.synonyms.some(s => slugify(s) === slug))
    );
  }

  const [show, setShow] = useState(false);

  if (!entry) return <span>{children}</span>;

  const isMobile = typeof window !== "undefined" && window.innerWidth < 800;

  return (
    <span
      tabIndex={0}
      aria-describedby={`glossary-${term}`}
      style={{
        borderBottom: "1px dotted #5191a2",
        cursor: "help",
        background: show ? "rgba(81,145,162,0.08)" : undefined,
        color: "#5191a2",
        outline: show ? "2px solid #5191a2" : undefined,
      }}
      onMouseEnter={() => !isMobile && setShow(true)}
      onMouseLeave={() => !isMobile && setShow(false)}
      onFocus={() => !isMobile && setShow(true)}
      onBlur={() => !isMobile && setShow(false)}
      onClick={() => isMobile && setShow(v => !v)}
    >
      {children}
      {show &&
        (isMobile ? (
          <div
            role="dialog"
            style={{
              position: "fixed",
              left: 0,
              top: 0,
              width: "100vw",
              height: "100vh",
              background: "rgba(0,0,0,0.6)",
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
            }}
          >
            <div
              style={{
                background: "#fff",
                color: "#222",
                borderRadius: 8,
                padding: 24,
                maxWidth: 320,
                boxShadow: "0 2px 16px rgba(0,0,0,0.2)",
                pointerEvents: "auto",
              }}
            >
              <strong>{entry.label}</strong>
              <div style={{ margin: "8px 0" }}>{entry.short}</div>
              <div style={{ fontSize: "0.95em", color: "#444", whiteSpace: "pre-line" }}>{entry.long}</div>
              {entry.synonyms && (
                <div style={{ marginTop: 8, fontSize: "0.85em", color: "#888" }}>
                  <strong>Synonyme:</strong> {entry.synonyms.join(", ")}
                </div>
              )}
              {entry.tags && (
                <div style={{ marginTop: 8, fontSize: "0.85em", color: "#888" }}>
                  <strong>Tags:</strong> {entry.tags.join(", ")}
                </div>
              )}
            </div>
          </div>
        ) : (
          <span
            id={`glossary-${term}`}
            role="tooltip"
            style={{
              position: "absolute",
              background: "#fff",
              color: "#222",
              borderRadius: 6,
              padding: "8px 12px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              zIndex: 9999,
              marginLeft: 8,
              minWidth: 180,
              fontSize: "0.95em",
            }}
          >
            <strong>{entry.label}</strong>
            <div style={{ margin: "4px 0" }}>{entry.short}</div>
            <div style={{ fontSize: "0.95em", color: "#444", whiteSpace: "pre-line" }}>{entry.long}</div>
            {entry.synonyms && (
              <div style={{ marginTop: 4, fontSize: "0.85em", color: "#888" }}>
                <strong>Synonyme:</strong> {entry.synonyms.join(", ")}
              </div>
            )}
            {entry.tags && (
              <div style={{ marginTop: 4, fontSize: "0.85em", color: "#888" }}>
                <strong>Tags:</strong> {entry.tags.join(", ")}
              </div>
            )}
          </span>
        ))}
    </span>
  );
}

function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function highlightGlossaryTerms(text: string | undefined | null, glossary?: { [key: string]: string }): React.ReactNode {
  if (!text) return null;
  if (!glossary) return text;

  const terms = Object.keys(glossary).sort((a, b) => b.length - a.length);
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  const matches: Array<{ start: number; end: number; term: string }> = [];

  terms.forEach(term => {
    const regex = new RegExp(`\\b${escapeRegex(term)}\\b`, "gi");
    let match;
    while ((match = regex.exec(text)) !== null) {
      matches.push({ start: match.index, end: match.index + match[0].length, term: match[0] });
    }
  });

  matches.sort((a, b) => a.start - b.start);
  const seenInFilter = new Set<string>();
  const filtered = matches.filter((match, i) => {
    if (i > 0) {
      const prev = matches[i - 1];
      if (match.start < prev.end) return false;
    }
    const key = slugify(match.term);
    if (seenInFilter.has(key)) return false;
    seenInFilter.add(key);
    return true;
  });

  filtered.forEach((match, i) => {
    if (match.start > lastIndex) {
      parts.push(text.substring(lastIndex, match.start));
    }
    parts.push(
      <GlossaryTerm key={i} term={match.term} customGlossary={glossary}>
        {match.term}
      </GlossaryTerm>
    );
    lastIndex = match.end;
  });

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

export function renderWithGlossary(text: string, customGlossary?: { [key: string]: string }, seenTerms?: Set<string>): React.ReactNode[] {
  if (!text) return [];

  const terms: string[] = [];
  Object.entries(GLOSSARY).forEach(([key, entry]) => {
    terms.push(slugify(entry.label));
    terms.push(slugify(key));
    if (entry.synonyms) entry.synonyms.forEach(s => terms.push(slugify(s)));
    terms.push(slugify(entry.label + "s"));
    terms.push(slugify(key + "s"));
  });

  if (customGlossary) {
    Object.keys(customGlossary).forEach(k => terms.push(slugify(k)));
  }

  const uniqueTerms = Array.from(new Set(terms)).sort((a, b) => b.length - a.length);
  const tokenRegex = /([\wäöüÄÖÜß]+)/gi;
  const seen = seenTerms ?? new Set<string>();
  let lastIdx = 0;
  const parts: React.ReactNode[] = [];
  let match;

  while ((match = tokenRegex.exec(text)) !== null) {
    const token = match[0];
    const slug = slugify(token);
    if (match.index > lastIdx) {
      parts.push(text.slice(lastIdx, match.index));
    }
    if (uniqueTerms.includes(slug) && !seen.has(slug)) {
      seen.add(slug);
      parts.push(
        <GlossaryTerm key={match.index} term={slug} customGlossary={customGlossary}>
          {token}
        </GlossaryTerm>
      );
    } else {
      parts.push(token);
    }
    lastIdx = match.index + token.length;
  }

  if (lastIdx < text.length) {
    parts.push(text.slice(lastIdx));
  }
  return parts;
}

export function makeGlossaryRenderer(customGlossary?: { [key: string]: string }) {
  const seen = new Set<string>();
  return (text: string) => renderWithGlossary(text, customGlossary, seen);
}
