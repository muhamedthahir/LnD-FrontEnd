import test from 'node:test';
import assert from 'node:assert/strict';
import {uploadSpreadsheet} from '../src/utils/spreadsheetImport.js';
const file={name:'questions.xlsx',size:12000};
const options={file,purpose:'programming',endpoint:'/api/questions/bulk-upload/programming',apiBaseUrl:'https://api.example.invalid',accessToken:'synthetic-token'};
test('large workbooks go directly to storage while API requests stay small',async()=>{
 const requests=[];
 const fetchImpl=async(url,init)=>{requests.push({url,init});return requests.length===1?new Response(JSON.stringify({presignedUrl:'https://storage.example.invalid/upload',contentType:'application/xlsx',importTicket:'signed-ticket'})):requests.length===2?new Response('',{status:200}):new Response(JSON.stringify({created:3,errors:[]}));};
 const {data}=await uploadSpreadsheet({...options,fetchImpl});
 assert.equal(data.created,3);assert.equal(requests.length,3);
 assert.equal(requests[1].init.body,file);assert.equal(requests[1].init.headers.Authorization,undefined);assert.equal(requests[1].init.credentials,'omit');
 for(const r of [requests[0],requests[2]])assert.ok(Buffer.byteLength(r.init.body)<7000);
 assert.deepEqual(JSON.parse(requests[2].init.body),{importTicket:'signed-ticket'});
});
test('invalid workbooks are rejected before any request',async()=>{
 await assert.rejects(uploadSpreadsheet({...options,file:{name:'bad.txt',size:1},fetchImpl:()=>assert.fail('unexpected request')}),/Excel workbook/);
 await assert.rejects(uploadSpreadsheet({...options,file:{name:'large.xlsx',size:11*1024*1024},fetchImpl:()=>assert.fail('unexpected request')}),/10 MB/);
});
test('storage rejection stops the import and retains actionable errors',async()=>{
 let count=0;const fetchImpl=async()=>++count===1?new Response(JSON.stringify({presignedUrl:'https://storage.example.invalid/upload',contentType:'application/xlsx',importTicket:'ticket'})):new Response('',{status:403});
 await assert.rejects(uploadSpreadsheet({...options,fetchImpl}),/storage rejected.*403/);assert.equal(count,2);
});
