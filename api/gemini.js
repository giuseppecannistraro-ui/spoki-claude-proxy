const ALLOWED = new Set(["gemini-2.5-flash","gemini-2.5-flash-lite","gemini-2.5-pro","gemini-2.0-flash","gemini-2.0-flash-lite","gemini-1.5-flash","gemini-1.5-flash-8b","gemini-1.5-pro"]);
function cors(res){res.setHeader("Access-Control-Allow-Origin","*");res.setHeader("Access-Control-Allow-Methods","POST, OPTIONS");res.setHeader("Access-Control-Allow-Headers","Content-Type");res.setHeader("Access-Control-Max-Age","86400");}
export default async function handler(req,res){
  cors(res);
  if(req.method==="OPTIONS")return res.status(204).end();
  if(req.method!=="POST")return res.status(405).json({error:"Use POST"});
  const key=process.env.GOOGLE_API_KEY;
  if(!key)return res.status(500).json({error:"GOOGLE_API_KEY not configured on the Vercel project"});
  let body=req.body;
  if(typeof body==="string"){try{body=JSON.parse(body);}catch{body={};}}
  body=body||{};
  const{model,system,messages,max_tokens,temperature}=body;
  if(!model||!ALLOWED.has(model))return res.status(400).json({error:"Missing or invalid 'model'. Allowed: "+[...ALLOWED].join(", ")});
  if(!Array.isArray(messages)||messages.length===0)return res.status(400).json({error:"Missing 'messages' array"});
  const contents=messages.map(m=>({role:m.role==="assistant"?"model":"user",parts:[{text:typeof m.content==="string"?m.content:JSON.stringify(m.content)}]}));
  const gb={contents,generationConfig:{temperature:temperature??0.5,maxOutputTokens:max_tokens??2000}};
  if(system)gb.systemInstruction={parts:[{text:system}]};
  let up;
  try{
    up=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(gb)});
  }catch(e){return res.status(502).json({error:"Upstream fetch failed: "+e.message});}
  const text=await up.text();
  let data=null;try{data=JSON.parse(text);}catch{}
  if(!up.ok){const msg=(data&&(data.error?.message||JSON.stringify(data.error)))||text.slice(0,300);return res.status(up.status).json({error:"Gemini "+up.status+": "+msg});}
  const reply=(data?.candidates?.[0]?.content?.parts||[]).map(p=>p.text||"").join("");
  res.status(200).setHeader("Content-Type","application/json");
  res.send(JSON.stringify({model,content:[{type:"text",text:reply}]}));
}
