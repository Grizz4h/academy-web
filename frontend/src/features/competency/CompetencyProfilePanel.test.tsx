/**
 * Competency profile panel view tests.
 * Run: npx --yes vite-node src/features/competency/CompetencyProfilePanel.test.tsx
 */
import { renderToStaticMarkup } from 'react-dom/server'
import { CompetencyProfileView } from './CompetencyProfilePanel'
import {
  buildFullyUnratedCompetencies,
  buildProfile,
  buildRatedCompetencies,
} from './testFixtures'

function assert(cond: boolean, label: string) {
  if (!cond) throw new Error(label)
}

const unratedProfile = buildProfile(buildFullyUnratedCompetencies())
const staleProfile = buildProfile(buildRatedCompetencies(), { stale: true })
const freshProfile = buildProfile(buildRatedCompetencies(), { stale: false })

const unratedHtml = renderToStaticMarkup(<CompetencyProfileView profile={unratedProfile} />)
assert(
  unratedHtml.includes('Noch liegen nicht genug Beobachtungen'),
  'panel renders unrated radar empty state',
)
assert(!unratedHtml.includes('Profil aktualisieren'), 'fresh profile has no recompute button')

const staleHtml = renderToStaticMarkup(
  <CompetencyProfileView profile={staleProfile} onRecompute={() => undefined} />,
)
assert(
  staleHtml.includes('Dein Kompetenzprofil muss neu berechnet werden'),
  'stale banner copy visible',
)
assert(staleHtml.includes('Profil aktualisieren'), 'stale profile shows recompute button')

const freshHtml = renderToStaticMarkup(<CompetencyProfileView profile={freshProfile} />)
assert(!freshHtml.includes('Profil aktualisieren'), 'non-stale profile hides recompute button')

const errorHtml = renderToStaticMarkup(
  <CompetencyProfileView profile={staleProfile} recomputeError onRecompute={() => undefined} />,
)
assert(
  errorHtml.includes('Aktualisierung fehlgeschlagen'),
  'recompute error message visible',
)

console.log('CompetencyProfilePanel.test.tsx OK')
