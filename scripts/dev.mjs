import {execFileSync} from 'node:child_process';import {readFileSync,mkdtempSync} from 'node:fs';import {tmpdir} from 'node:os';import worker from '../worker/index.js';import assert from 'node:assert/strict';
const db=mkdtempSync(tmpdir()+'/roles-access-')+'/test.sqlite';const py=`import sqlite3,json,sys
p=json.load(sys.stdin);c=sqlite3.connect(p['db']);c.row_factory=sqlite3.Row;out=[]
for s in p['statements']:
 cur=c.execute(s['sql'],s.get('args',[]));rows=[dict(r) for r in cur.fetchall()] if cur.description else [];out.append({'results':rows,'meta':{'changes':max(0,cur.rowcount)}})
c.commit();print(json.dumps(out))`;
function run(statements){return JSON.parse(execFileSync('python3',['-c',py],{input:JSON.stringify({db,statements}),encoding:'utf8'}))}
for(let f of ['drizzle/0000_state.sql','drizzle/0001_access.sql'])for(let sql of readFileSync(f,'utf8').replaceAll('--> statement-breakpoint','').split(';').filter(s=>s.trim()))run([{sql}]);
const env={OWNER_EMAIL:'admin@example.test',DB:{prepare(sql){return {sql,args:[],bind(...args){this.args=args;return this},async first(){return run([this])[0].results[0]||null},async all(){return run([this])[0]},async run(){return run([this])[0]}}},async batch(s){return run(s)}}};

const {default:http}=await import('node:http');http.createServer(async(req,res)=>{let chunks=[];for await(let c of req)chunks.push(c);let h={...req.headers,'oai-authenticated-user-id':'owner','oai-authenticated-user-email':'admin@example.test'};let r=await worker.fetch(new Request('http://'+req.headers.host+req.url,{method:req.method,headers:h,...(['PUT','POST'].includes(req.method)?{body:Buffer.concat(chunks)}:{})}),env);res.writeHead(r.status,Object.fromEntries(r.headers));res.end(Buffer.from(await r.arrayBuffer()))}).listen(4173,'127.0.0.1');
