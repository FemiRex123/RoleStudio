import {execFileSync} from 'node:child_process';import {readFileSync,mkdtempSync} from 'node:fs';import {tmpdir} from 'node:os';import worker from '../worker/index.js';import assert from 'node:assert/strict';
const db=mkdtempSync(tmpdir()+'/roles-access-')+'/test.sqlite';const py=`import sqlite3,json,sys
p=json.load(sys.stdin);c=sqlite3.connect(p['db']);c.row_factory=sqlite3.Row;out=[]
for s in p['statements']:
 cur=c.execute(s['sql'],s.get('args',[]));rows=[dict(r) for r in cur.fetchall()] if cur.description else [];out.append({'results':rows,'meta':{'changes':max(0,cur.rowcount)}})
c.commit();print(json.dumps(out))`;
function run(statements){return JSON.parse(execFileSync('python3',['-c',py],{input:JSON.stringify({db,statements}),encoding:'utf8'}))}
for(let f of ['drizzle/0000_state.sql','drizzle/0001_access.sql'])for(let sql of readFileSync(f,'utf8').replaceAll('--> statement-breakpoint','').split(';').filter(s=>s.trim()))run([{sql}]);
const env={OWNER_EMAIL:'admin@example.test',DB:{prepare(sql){return {sql,args:[],bind(...args){this.args=args;return this},async first(){return run([this])[0].results[0]||null},async all(){return run([this])[0]},async run(){return run([this])[0]}}},async batch(s){return run(s)}}};
async function req(who,path='/api/state',method='GET',body){let h={'origin':'https://test.local'};if(who){h['oai-authenticated-user-id']=who;h['oai-authenticated-user-email']=who==='owner'?'admin@example.test':who+'@example.test'}return worker.fetch(new Request('https://test.local'+path,{method,headers:h,...(body?{body:JSON.stringify(body)}:{})}),env)}
assert.equal((await req(null)).status,401);let full=await(await req('owner')).json();assert.equal(full.state.projects.length,1);assert.equal((await(await req('new')).json()).state.projects.length,0);
assert.equal((await req('new','/api/admin')).status,403);
assert.equal((await req('new','/api/state','PUT',full)).status,403);
await req('owner','/api/admin','POST',{action:'grant',userId:'new',projectId:'demo-project',role:'reader'});
let data=await(await req('new')).json();assert.equal(data.state.projects.length,1);data.state.projects[0].name='Changed';assert.equal((await req('new','/api/state','PUT',data)).status,403);
await req('owner','/api/admin','POST',{action:'grant',userId:'new',projectId:'demo-project',role:'editor'});assert.equal((await req('new','/api/state','PUT',data)).status,200);
await req('owner','/api/admin','POST',{action:'delete',userId:'new'});assert.equal((await req('new')).status,403);
await req('owner','/api/admin','POST',{action:'restore',userId:'new'});assert.equal((await(await req('new')).json()).state.projects.length,0);
assert.equal((await req('owner','/api/admin','POST',{action:'delete',userId:'owner'})).status,403);
console.log('PASS: anonymous, pending, reader, editor, admin, revocation, restore, owner protection');
