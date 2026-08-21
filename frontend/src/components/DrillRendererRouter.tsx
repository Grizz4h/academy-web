import DrillRendererV2 from '../renderers/v2/DrillRenderer';
import DrillRendererV4 from '../renderers/v4/DrillRenderer';
import { pickRendererVersion } from './drillRendererRouting';

interface DrillRendererRouterProps {
  drill: any;
  answers?: any;
  setAnswers?: (next: any) => void;
  session?: any;
  phase?: string;
}

/**
 * Default: V2 feature modules configured from curriculum JSON.
 * V4 remains only for Meta-Scan.
 */
export function DrillRendererRouter(props: DrillRendererRouterProps) {
  const moduleId = props?.session?.module_id;
  const renderer = pickRendererVersion(moduleId, props?.drill);

  const answers = props.answers || {};
  if (renderer === 'v4') {
    if (!props.setAnswers) {
      return <div>Drill-Renderer nicht bereit (fehlende setAnswers).</div>;
    }
    return <DrillRendererV4 drill={props.drill} answers={answers} setAnswers={props.setAnswers} session={props.session} />;
  }
  if (!props.setAnswers) {
    return <div>Drill-Renderer nicht bereit (fehlende setAnswers).</div>;
  }
  return <DrillRendererV2 drill={props.drill} answers={answers} setAnswers={props.setAnswers} session={props.session} phase={props.phase} />;
}
