import DrillRendererV1 from '../renderers/v1/DrillRenderer';
import DrillRendererV2 from '../renderers/v2/DrillRenderer';
import DrillRendererV3 from '../renderers/v3/DrillRenderer';

interface DrillRendererRouterProps {
  drill: any;
  answers?: any;
  setAnswers?: (next: any) => void;
  initialAnswers?: any;
  onChangeAnswers?: (answers: any) => void;
  session?: any;
}

function pickRenderer(moduleId?: string): 'v1' | 'v2' | 'v3' {
  if (!moduleId) return 'v2';
  if (moduleId.startsWith('E')) return 'v3';
  if (moduleId === 'A1') return 'v1';
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
      // Optionally, you can render null or throw an error if setAnswers is required
      return null;
    }
    return <DrillRendererV3 drill={props.drill} answers={props.answers} setAnswers={props.setAnswers} />;
  }
  if (!props.setAnswers) {
    // Optionally, you can render null or throw an error if setAnswers is required
    return null;
  }
  return <DrillRendererV2 drill={props.drill} answers={props.answers} setAnswers={props.setAnswers} />;
}
