import React from 'react';
import { makeGlossaryRenderer } from './GlossaryTerm';
import { RinQIcon } from './icons';

export type DrillGuide = {
  what_to_watch?: string[];
  how_to_decide?: string[];
  ignore?: string[];
  how_to?: string[];
};

type Props = { guide: DrillGuide };

export function DrillGuideCard({ guide }: Props) {
  const rwg = makeGlossaryRenderer();
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
        <RinQIcon name="observe" size="md" badge inline />
        Beobachtungsanleitung
      </h3>
      <Section title="Worauf achten?" items={guide.what_to_watch} rwg={rwg} />
      <Section title="Wie entscheiden?" items={guide.how_to_decide || guide.how_to} rwg={rwg} />
      <Section title="Was ignorieren?" items={guide.ignore} rwg={rwg} />
    </div>
  );
}

function Section({ title, items, rwg }: { title: string; items?: string[]; rwg: (text: string) => React.ReactNode[] }) {
  if (!items?.length) return null;
  return (
    <div className="mb-3">
      <div className="text-sm font-semibold text-white/80 mb-1">{title}</div>
      <ul className="list-disc pl-5 text-white/70 space-y-1">
        {items.map((t, i) => (
          <li key={`${title}-${i}`}>{rwg(t)}</li>
        ))}
      </ul>
    </div>
  );
}
