import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

test('clipboard guard ignores pointer/focus gestures, blocks clipboard operations, and cleans up', () => {
  const handlers = new Map();
  let cleanup, warnings = 0;
  const target = name => ({addEventListener(type, fn) { handlers.set(`${name}:${type}`, fn); }, removeEventListener(type, fn) { if (handlers.get(`${name}:${type}`) === fn) handlers.delete(`${name}:${type}`); }});
  const source = fs.readFileSync('src/hooks/useAssessmentClipboardGuard.js', 'utf8').replace(/^import .*\n/gm, '').replace(/export /g, '');
  const context = { window: target('window'), document: target('document'), useEffect(fn) { cleanup = fn(); }, useRef(value) { return {current:value}; }, toast:{warning(){warnings++;}}, Date };
  vm.createContext(context);
  vm.runInContext(source + '\nuseAssessmentClipboardGuard(true)', context);
  for (const name of ['contextmenu','click','dragstart','drop','focus']) assert.equal(handlers.has(`document:${name}`) || handlers.has(`window:${name}`), false, name);
  let prevented = false;
  handlers.get('document:paste')({preventDefault(){prevented=true;},stopPropagation(){}});
  assert.equal(prevented,true);
  assert.equal(warnings,1);
  cleanup();
  assert.equal(handlers.size,0);
});

test('nested dialog locks recover when dialogs close in either order', () => {
  for (const closeBottomFirst of [false,true]) {
    const page = {inert:false,matches(){return false},contains(){return false}};
    const initiallyLocked = {inert:true,matches(){return false},contains(){return false}};
    const first = {inert:false,matches(){return false},contains(root){return root === this}};
    const second = {inert:false,matches(){return false},contains(root){return root === this}};
    const context = {document:{body:{children:[page,initiallyLocked,first,second]}}};
    vm.createContext(context);
    const source=fs.readFileSync('src/design/Dialog.jsx','utf8');
    const start=source.indexOf('const layers = []');
    const end=source.indexOf('const focusables');
    vm.runInContext(source.slice(start,end) + '\nglobalThis.state={layers,activeRoots,syncDialogInert}',context);
    const {layers,activeRoots,syncDialogInert}=context.state;
    layers.push('first'); activeRoots.set('first',first); syncDialogInert();
    assert.equal(page.inert,true); assert.equal(first.inert,false);
    layers.push('second'); activeRoots.set('second',second); syncDialogInert();
    assert.equal(first.inert,true); assert.equal(second.inert,false);
    const removed=closeBottomFirst?'first':'second';
    layers.splice(layers.indexOf(removed),1); activeRoots.delete(removed); syncDialogInert();
    assert.equal((closeBottomFirst?second:first).inert,false);
    layers.length=0;activeRoots.clear();syncDialogInert();
    assert.equal(page.inert,false);assert.equal(initiallyLocked.inert,true);
  }
});

test('proctoring starts after entry, ignores native blur, and counts a tab departure once', () => {
  const source=fs.readFileSync('src/features/user/Assessments/AssessmentTake/AssessmentTake.jsx','utf8');
  const start=source.indexOf('  useEffect(() => {\n    if (!testEntered || !isConfigFlagEnabled(assessmentData?.proctoring?.proctoring_enabled');
  const end=source.indexOf('\n  useEffect(',start+10);
  for (const entered of [false,true]) {
    const handlers=new Map();let count=0,logs=0,countdowns=0;
    const context={testEntered:entered,assessmentData:{proctoring:{proctoring_enabled:true,max_tab_switch_allowed:1}},isConfigFlagEnabled:value=>value,document:{hidden:false,addEventListener(type,fn){handlers.set(type,fn)},removeEventListener(type){handlers.delete(type)}},exitingRef:{current:false},switchCountRef:{current:0},countdownTimerRef:{current:null},setTabSwitchCount(value){count=value},setIsTabLimitExceeded(){},setShowTabSwitchModal(){},logProctoringEvent(){logs++},startExceededCountdown(){countdowns++},useEffect(fn){fn()}};
    vm.createContext(context);vm.runInContext(source.slice(start,end),context);
    assert.equal(handlers.has('blur'),false);
    if (!entered) {assert.equal(handlers.size,0);continue;}
    handlers.get('visibilitychange')();assert.equal(count,0);
    context.document.hidden=true;handlers.get('visibilitychange')();
    assert.equal(count,1);assert.equal(logs,1);assert.equal(countdowns,0);
    context.document.hidden=false;handlers.get('visibilitychange')();assert.equal(count,1);
    context.document.hidden=true;handlers.get('visibilitychange')();assert.equal(count,2);assert.equal(countdowns,1);
    context.exitingRef.current=true;handlers.get('visibilitychange')();assert.equal(count,2);
  }
});
