import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const css=fs.readFileSync('src/design/tokens/colors.css','utf8');
const luminance=hex=>{const v=hex.replace('#','').match(/../g).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return .2126*v[0]+.7152*v[1]+.0722*v[2];};
const ratio=(a,b)=>{const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
const composite=(foreground,background)=>{const rgb=foreground.match(/[\d.]+/g).map(Number),base=background.slice(1).match(/../g).map(v=>parseInt(v,16));return '#'+base.map((v,i)=>Math.round(rgb[i]*rgb[3]+v*(1-rgb[3])).toString(16).padStart(2,'0')).join('');};
for(const theme of ['light','dark'])test(`${theme}: readable semantic foregrounds on cards, inputs and tinted status surfaces`,()=>{
 const block=css.match(new RegExp('\\[data-theme="'+theme+'"\\]\\s*\\{([\\s\\S]*?)\\}'))[1];const token=name=>block.match(new RegExp('--'+name+':\\s*([^;]+)'))[1].trim();
 for(const role of ['text-primary','text-secondary','text-tertiary','text-muted','success','warning','error'])for(const surface of ['bg-card','bg-input'])assert.ok(ratio(token(role),token(surface))>=4.5,`${role}/${surface}`);
 for(const role of ['success','warning','error'])assert.ok(ratio(token(role),composite(token(role+'-glow'),token('bg-card')))>=4.5,`${role} tint`);
 assert.ok(ratio(token('text-on-accent'),token('accent-primary'))>=4.5,'primary action');
 assert.ok(ratio(token('border-control'),token('bg-input'))>=3,'control boundary');
});
