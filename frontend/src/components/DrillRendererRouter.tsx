import DrillRendererV1 from '../renderers/v1/DrillRenderer';
import DrillRendererV2 from '../renderers/v2/DrillRenderer';
import DrillRendererV3 from '../renderers/v3/DrillRenderer';
import DrillRendererV4 from '../renderers/v4/DrillRenderer';
import { pickRendererVersion } from './drillRendererRouting';

interface DrillRendererRouterProps {
  drill: any;
  answers?: any;
  setAnswers?: (next: any) => void;
  initialAnswers?: any;
  onChangeAnswers?: (answers: any) => void;
  session?: any;
  phase?: string;
}

/**
 * Track letters no longer select the renderer.
 * New mechanics extend V2; V3 remains only as unused legacy fallback.
 */
export function DrillRendererRouter(props: DrillRendererRouterProps) {
  const moduleId = props?.session?.module_id;
  const renderer = pickRendererVersion(moduleId, props?.drill);

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
  return <DrillRendererV2 drill={props.drill} answers={props.answers} setAnswers={props.setAnswers} session={props.session} phase={props.phase} />;
}
