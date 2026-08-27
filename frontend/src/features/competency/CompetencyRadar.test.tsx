import { renderToStaticMarkup } from 'react-dom/server'
import CompetencyRadar from './CompetencyRadar'
import { COMPETENCY_AXES } from './types'

const html = renderToStaticMarkup(
  <CompetencyRadar values={COMPETENCY_AXES.map((axis, index) => ({ competencyId: axis.id, score: 50 + index }))} />,
)

const renderedAxes = (html.match(/data-competency-axis=/g) || []).length
if (renderedAxes !== 8) throw new Error(`expected 8 radar axes, got ${renderedAxes}`)
if (!html.includes('Mock data') || !html.includes('noch nicht aus deinen Leistungen berechnet')) {
  throw new Error('radar preview must be clearly marked as mock data')
}
