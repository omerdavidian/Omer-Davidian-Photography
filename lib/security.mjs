import {createHmac} from 'node:crypto';
export class HttpError extends Error{constructor(status,message){super(message);this.status=status;}}
export function ready(env=process.env){return ['RESEND_API_KEY','EMAIL_FROM','TURNSTILE_SITE_KEY','TURNSTILE_SECRET_KEY','TURNSTILE_HOSTNAMES','RATE_LIMIT_SECRET'].every(k=>!!env[k])&&!!(env.UPSTASH_REDIS_REST_URL||env.KV_REST_API_URL)&&!!(env.UPSTASH_REDIS_REST_TOKEN||env.KV_REST_API_TOKEN);}
export function validate(body){
  if(!body||typeof body!=='object'||Array.isArray(body))throw new HttpError(400,'Invalid request.');
  if(body.website)throw new HttpError(400,'Unable to accept this submission.');
  const field=(key,min,max)=>{const v=body[key]??'';if(typeof v!=='string'||v.trim().length<min||v.length>max||/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(v))throw new HttpError(400,`Please check ${key}.`);return v.trim();};
  const firstName=field('firstName',1,80),lastName=field('lastName',0,80),email=field('email',3,254),phone=field('phone',0,40),message=field('message',10,5000),service=field('service',1,40);
  if(!/^[^\s@<>\r\n]+@[^\s@<>\r\n]+\.[^\s@<>\r\n]+$/.test(email))throw new HttpError(400,'Please enter a valid email address.');
  if([firstName,lastName,phone,service].some(v=>/[\r\n]/.test(v)))throw new HttpError(400,'Invalid field value.');
  if(!['General inquiry','Real Estate','Weddings','Events','Portraits','Prints'].includes(service))throw new HttpError(400,'Please select a photography service.');
  return {firstName,lastName,email,phone,message,service};
}
export function checkOrigin(req,env=process.env){const origin=req.headers.origin;const allowed=[env.SITE_URL,env.VERCEL_URL&&`https://${env.VERCEL_URL}`,env.VERCEL_PROJECT_PRODUCTION_URL&&`https://${env.VERCEL_PROJECT_PRODUCTION_URL}`].filter(Boolean);if(!origin||!allowed.includes(origin))throw new HttpError(403,'Please submit the form from this website.');}
export async function rateLimit(req,env=process.env,fetcher=fetch){
  const ip=req.headers['x-vercel-forwarded-for']||req.headers['x-forwarded-for']||req.socket?.remoteAddress||'unknown';
  const digest=createHmac('sha256',env.RATE_LIMIT_SECRET).update(String(ip).split(',')[0].trim()).digest('hex');
  const key=`odp:contact:${digest}:${Math.floor(Date.now()/600000)}`;
  const response=await fetcher(env.UPSTASH_REDIS_REST_URL||env.KV_REST_API_URL,{method:'POST',headers:{Authorization:`Bearer ${env.UPSTASH_REDIS_REST_TOKEN||env.KV_REST_API_TOKEN}`,'Content-Type':'application/json'},body:JSON.stringify(['EVAL',"local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('EXPIRE',KEYS[1],660) end; return n",'1',key]),signal:AbortSignal.timeout(5000)});
  if(!response.ok)throw new HttpError(503,'Please try again later or email omerdavidian@gmail.com.');
  const result=await response.json();if(result.error||!Number.isInteger(result.result))throw new HttpError(503,'Please try again later.');if(result.result>5)throw new HttpError(429,'Too many inquiries. Please wait ten minutes or email directly.');
}
export async function verifyCaptcha(token,env=process.env,fetcher=fetch){
  if(typeof token!=='string'||!token||token.length>2048)throw new HttpError(400,'Please complete the spam protection check.');
  const response=await fetcher('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({secret:env.TURNSTILE_SECRET_KEY,response:token}),signal:AbortSignal.timeout(10000)});
  if(!response.ok)throw new HttpError(503,'Spam protection is temporarily unavailable. Please retry.');
  const result=await response.json();if(!result.success||result.action!=='contact'||!env.TURNSTILE_HOSTNAMES.split(',').map(v=>v.trim()).includes(result.hostname))throw new HttpError(400,'Spam protection expired. Please retry.');
}
