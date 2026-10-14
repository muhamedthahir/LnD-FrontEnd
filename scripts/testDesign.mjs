import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const parser=require('@babel/parser');
const traverse=require('@babel/traverse').default;
const root=path.resolve('src');
function files(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(dir,e.name)):[path.join(dir,e.name)]);}
test('both themes retain every original palette color',()=>{
 const baseline=JSON.parse(fs.readFileSync('docs/color-palette-baseline.json','utf8'));
 const css=fs.readFileSync('src/design/tokens/colors.css','utf8');
 for(const [theme,tokens] of Object.entries(baseline.themes)){
  const block=css.match(new RegExp('\\[data-theme="'+theme+'"\\]\\s*\\{([\\s\\S]*?)\\}'))?.[1];
  assert.ok(block,theme);
  for(const entry of tokens){const actual=block.match(new RegExp(entry.token+'\\s*:\\s*([^;]+)'))?.[1].trim();assert.equal(actual,entry.value,theme+' '+entry.token);}
 }
});
test('every inventoried page has a replacement and all local JSX imports resolve',()=>{
 const record=JSON.parse(fs.readFileSync('docs/ui-migration-record.json','utf8'));
 assert.equal(record.length,53);
 for(const file of files(root).filter(f=>f.endsWith('.jsx'))){
  const ast=parser.parse(fs.readFileSync(file,'utf8'),{sourceType:'module',plugins:['jsx']});
  traverse(ast,{ImportDeclaration({node}){let source=node.source.value;if(!source.startsWith('.'))return;const target=path.resolve(path.dirname(file),source);assert.ok([target,target+'.jsx',target+'.js',path.join(target,'index.js'),path.join(target,'index.jsx')].some(p=>fs.existsSync(p)),file+' imports '+source);assert.ok(!source.endsWith('.module.css'),file+' imports legacy styles');}});
 }
 assert.equal(files(path.join(root,'features')).filter(f=>f.endsWith('.jsx')).length,53);
 assert.equal(files(path.join(root,'pages')).filter(f=>f.endsWith('.jsx')).length,0);
});
test('route breadcrumbs resolve to actual workspace destinations',async()=>{
 const {getRouteMeta,navigation}=await import('../src/design/routeMeta.js');
 const source=fs.readFileSync('src/App.jsx','utf8');
 for(const item of navigation) assert.ok(source.includes('path="'+item.path+'"'),item.path);
 for(const route of ['/admin/courses/1/topics/1/practice','/admin/assessments/1/configurations/create','/admin/assessments/administrators/1/users','/admin/assessments/results/1']) assert.ok(source.includes('path="'+getRouteMeta(route).path+'"'),route);
});
