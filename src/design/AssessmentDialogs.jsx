import {useEffect,useRef,useState} from 'react';
import {Dialog} from './Dialog';
import {ActionButton} from './Primitives';
function Summary({total,answered,time}) {
  const entries=[['Total questions',total],['Answered',answered],['Unanswered',total-answered],...(time?[['Time remaining',time]]:[])];
  return <dl className="cz-attempt-summary">{entries.map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>;
}
export default function AssessmentDialogs({views={},total=0,answered=0,time,segmentName='',allowSegmentSwitch=true,switchCount=0,switchLimit=-1,limitExceeded=false,countdown=5,busy=false,onEnterFullscreen,onStayFullscreen,onExitFullscreen,onCloseSubmit,onSubmit,onCloseSegmentSubmit,onSubmitSegment,onNextSegment,onContinueWindow,onContinueAfterSwitch}) {
  const pending=useRef(false);const [working,setWorking]=useState(false);const [failure,setFailure]=useState('');
  const mode=Object.keys(views).filter(key=>views[key]).join('|');
  useEffect(()=>{setFailure('');},[mode]);
  const locked=busy||working;
  const run=fn=>async()=>{if(pending.current||busy)return;pending.current=true;setWorking(true);setFailure('');try{await fn?.();}catch(error){setFailure(error.message||'Unable to continue. Please try again.');}finally{pending.current=false;setWorking(false);}};
  const action=(text,fn,variant='primary')=><ActionButton variant={variant} disabled={locked} onClick={run(fn)}>{text}</ActionButton>;
  const error=failure&&<p className="cz-dialog-error" role="alert">{failure}</p>;
  return <>
    <Dialog open={!!views.fullscreenRequired} title="Fullscreen required" alert dismissible={false} busy={locked} footer={action('Go to Fullscreen',onEnterFullscreen)}><p>This assessment must be taken in fullscreen mode. Your answers are locked until you return to fullscreen.</p>{error}</Dialog>
    <Dialog open={!!views.fullscreenExit} title="Exit fullscreen?" alert dismissible={false} busy={locked} footer={<>{action('Stay in Fullscreen',onStayFullscreen)}{action('Exit Fullscreen',onExitFullscreen,'secondary')}</>}><p>Exiting fullscreen will be logged and may affect your assessment. You can stay in fullscreen to continue.</p>{error}</Dialog>
    <Dialog open={!!views.submit} title="Submit assessment?" onClose={onCloseSubmit} busy={locked} footer={<>{action('Continue Assessment',onCloseSubmit,'secondary')}{action(locked?'Submitting…':'Confirm Submit',onSubmit)}</>}><Summary total={total} answered={answered} time={time}/>{total>answered&&<p>You have {total-answered} unanswered question(s). Review your answers before submitting.</p>}{error}</Dialog>
    <Dialog open={!!views.segmentSubmit} title="Submit segment?" onClose={onCloseSegmentSubmit} busy={locked} footer={<>{action('Continue Segment',onCloseSegmentSubmit,'secondary')}{action('Submit Segment',onSubmitSegment)}</>}><Summary total={total} answered={answered}/>{total>answered&&<p>You have {total-answered} unanswered question(s) in this segment.</p>}{!allowSegmentSwitch&&<p>You will not be able to return to “{segmentName}” after submitting.</p>}{error}</Dialog>
    <Dialog open={!!views.segmentEnd} title="Segment complete" dismissible={false} busy={locked} footer={action('Continue to Next Segment',onNextSegment)}><p>You have completed “{segmentName}”. Ready to move to the next segment?</p>{!allowSegmentSwitch&&<p>You will not be able to return to this segment.</p>}{error}</Dialog>
    <Dialog open={!!views.closeWarning} title="Complete your assessment first" alert dismissible={false} busy={locked} footer={action('Continue Assessment',onContinueWindow)}><p>You cannot close or minimize this window while the proctored assessment is in progress. Complete and submit the assessment to close this window.</p>{error}</Dialog>
    <Dialog open={!!views.tabSwitch} title={limitExceeded?'Tab switch limit exceeded':'Tab switch detected'} alert dismissible={false} busy={locked} footer={!limitExceeded&&action('Continue Assessment',onContinueAfterSwitch)}>{limitExceeded?<><p>Your assessment will be automatically submitted because the allowed tab switch limit was exceeded.</p><div className="cz-assessment-countdown" role="status" aria-live="polite"><strong>{countdown}</strong><span>Submitting in {countdown} second{countdown!==1?'s':''}</span></div><p>Please wait while we submit your assessment.</p></>:<><p>You switched away from the assessment window. This action has been recorded.</p><dl className="cz-attempt-summary"><div><dt>Tab switches</dt><dd>{switchCount}</dd></div><div><dt>Allowed limit</dt><dd>{switchLimit<0?'Unlimited':switchLimit}</dd></div></dl>{switchLimit>=0&&<p>{Math.max(0,switchLimit-switchCount)} more switch{switchLimit-switchCount!==1?'es':''} allowed before auto-submission.</p>}</>}{error}</Dialog>
  </>;
}
