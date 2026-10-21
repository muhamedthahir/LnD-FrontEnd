export function executionSucceeded(result) {
  const run = result?.run;
  const compile = result?.compile;
  return Boolean(run && (run.code == null || run.code === 0) && !run.signal && !run.stderr && !compile?.stderr && (compile?.code == null || compile.code === 0));
}
