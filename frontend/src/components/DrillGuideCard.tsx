import React from 'react';
import { makeGlossaryRenderer } from './GlossaryTerm';
import { RinQIcon } from './icons';

export type DrillGuideScanHelp = {
  title?: string;
  steps?: string[];
  motto?: string;
};

export type DrillGuide = {
  what_to_watch?: string[];
  how_to_decide?: string[];
  ignore?: string[];
  how_to?: string[];
  /** Optional entry scan — visual how-to before the category questions. */
  scan_help?: DrillGuideScanHelp;
};

type Props = { guide: DrillGuide };

export function DrillGuideCard({ guide }: Props) {
  const rwg = makeGlossaryRenderer();
  const scan = guide.scan_help;
  const scanSteps = Array.isArray(scan?.steps) ? scan.steps.filter(Boolean) : [];
  const showScan = Boolean(scan && (scan.title || scanSteps.length || scan.motto));

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
        <RinQIcon name="observe" size="md" badge inline />
        Beobachtungsanleitung
      </h3>
      {showScan && (
        <div
          className="mb-4 rounded-lg border border-[#5191a2]/50 bg-[rgba(81,145,162,0.14)] p-3"
          data-testid="drill-scan-help"
        >
          <div className="text-sm font-semibold text-[#9ec9d4] mb-2">
            {scan?.title || 'So findest du den Einstieg'}
          </div>
          {scanSteps.length > 0 && (
            <ol className="list-decimal pl-5 text-white/85 space-y-1.5 text-[0.95rem] leading-snug">
              {scanSteps.map((step, i) => (
                <li key={`scan-${i}`}>{rwg(step)}</li>
              ))}
            </ol>
          )}
          {scan?.motto && (
            <p className="mt-3 mb-0 text-sm text-white/90 italic border-t border-white/10 pt-2">
              {rwg(scan.motto)}
            </p>
          )}
        </div>
      )}
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
