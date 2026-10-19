import {createServer} from 'node:http';
import {makeHandler} from './handler.mjs';
const handler=makeHandler(process.env);
const port=Number(process.env.PORT||3000);
createServer(async (req,res)=>{
 const chunks=[];let total=0;
 try{
  for await(const chunk of req){total+=chunk.length;if(total>1500000){res.writeHead(413);res.end();return;}chunks.push(chunk);}
  const headers={};for(const [k,v] of Object.entries(req.headers))headers[k]=Array.isArray(v)?v.join(','):v||'';
  const url='http://local'+(req.url||'/');
  const request=new Request(url,{method:req.method,headers,...(req.method==='GET'||req.method==='HEAD'?{}:{body:Buffer.concat(chunks)})});
  const output=await handler(request);
  res.writeHead(output.status,Object.fromEntries(output.headers));
  res.end(Buffer.from(await output.arrayBuffer()));
 }catch(e){res.writeHead(500,{'Content-Type':'application/json'});res.end('{"error":"Internal error"}');}
}).listen(port,'0.0.0.0',()=>console.log('Linh AI gateway ready'));
