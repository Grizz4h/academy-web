import DrillRendererV1 from '../renderers/v1/DrillRenderer';
import DrillRendererV2 from '../renderers/v2/DrillRenderer';
import DrillRendererV3 from '../renderers/v3/DrillRenderer';
import DrillRendererV4 from '../renderers/v4/DrillRenderer';

interface DrillRendererRouterProps {
  drill: any;
  answers?: any;
  setAnswers?: (next: any) => void;
  initialAnswers?: any;
  onChangeAnswers?: (answers: any) => void;
  session?: any;
}

function pickRenderer(moduleId?: string): 'v1' | 'v2' | 'v3' | 'v4' {
  if (!moduleId) return 'v2';
  // V4 for Meta-Scan modules (M* or contains META)
  if (moduleId.startsWith('M') || moduleId.includes('META')) return 'v4';
  // V3 for E-Track modules
  if (moduleId.startsWith('E')) return 'v3';
  // V1 for A1 legacy
  if (moduleId === 'A1') return 'v1';
  // V2 default
  return 'v2';
}

export function DrillRendererRouter(props: DrillRendererRouterProps) {
  const moduleId = props?.session?.module_id;
  const renderer = pickRenderer(moduleId);

  if (renderer === 'v1') {
    return <DrillRendererV1 drill={props.drill} initialAnswers={props.initialAnswers} onChangeAnswers={props.onChangeAnswers} />;
  }
  if (renderer === 'v3') {
    if (!props.setAnswers) {
      return null;
    }
    return <DrillRendererV3 drill={props.drill} answers={props.answers} setAnswers={props.setAnswers} />;
  }
  if (renderer === 'v4') {
    if (!props.setAnswers) {
      return null;
    }
    return <DrillRendererV4 drill={props.drill} answers={props.answers} setAnswers={props.setAnswers} session={props.session} />;
  }
  if (!props.setAnswers) {
    return null;
  }
  return <DrillRendererV2 drill={props.drill} answers={props.answers} setAnswers={props.setAnswers} />;
}
