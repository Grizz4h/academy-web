import React from 'react';
import { renderWithGlossary } from './GlossaryTerm';

export type DrillGuide = {
  what_to_watch?: string[];
  how_to_decide?: string[];
  ignore?: string[];
  how_to?: string[];
};

type Props = { guide: DrillGuide };

export function DrillGuideCard({ guide }: Props) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <h3 className="text-lg font-semibold mb-3">👀 Beobachtungsanleitung</h3>
      <Section title="Worauf achten?" items={guide.what_to_watch} />
      <Section title="Wie entscheiden?" items={guide.how_to_decide || guide.how_to} />
      <Section title="Was ignorieren?" items={guide.ignore} />
    </div>
  );
}

function Section({ title, items }: { title: string; items?: string[] }) {
  if (!items?.length) return null;
  return (
    <div className="mb-3">
      <div className="text-sm font-semibold text-white/80 mb-1">{title}</div>
      <ul className="list-disc pl-5 text-white/70 space-y-1">
        {items.map((t, i) => (
          <li key={`${title}-${i}`}>{renderWithGlossary(t)}</li>
        ))}
      </ul>
    </div>
  );
}
