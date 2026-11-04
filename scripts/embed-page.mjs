import {readFileSync,writeFileSync} from 'node:fs';
const workerUrl=new URL('../worker/index.js',import.meta.url);
const source=readFileSync(workerUrl,'utf8');
const marker='\nconst seed = ';
const index=source.indexOf(marker);
if(!source.startsWith('const page = ')||index<0)throw new Error('Worker page boundary not found');
const page=readFileSync(new URL('../page.html',import.meta.url),'utf8');
writeFileSync(workerUrl,'const page = '+JSON.stringify(page)+';'+source.slice(index));
