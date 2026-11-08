import {randomUUID} from 'node:crypto';
import {HttpError,ready,validate,checkOrigin,rateLimit,verifyCaptcha} from '../lib/security.mjs';
export function createHandler({env=process.env,fetcher=fetch,limit=rateLimit,verify=verifyCaptcha}={}){return async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  try{
    if(req.method!=='POST'){res.setHeader('Allow','POST');throw new HttpError(405,'Method not allowed.');}
    checkOrigin(req,env);
    if(!String(req.headers['content-type']||'').startsWith('application/json'))throw new HttpError(415,'Please submit the form from this website.');
    if(Number(req.headers['content-length'])>16384||Buffer.byteLength(JSON.stringify(req.body??{}))>16384)throw new HttpError(413,'Message too large.');
    const inquiry=validate(req.body);
    if(!ready(env))throw new HttpError(503,'Online inquiries are being configured. Please email omerdavidian@gmail.com.');
    await limit(req,env,fetcher);await verify(req.body['cf-turnstile-response'],env,fetcher);
    const reference='ODP-'+randomUUID().slice(0,8).toUpperCase();
    const response=await fetcher('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${env.RESEND_API_KEY}`,'Content-Type':'application/json','Idempotency-Key':reference},body:JSON.stringify({from:env.EMAIL_FROM,to:[env.OWNER_EMAIL||'omerdavidian@gmail.com'],reply_to:inquiry.email,subject:`Photography inquiry: ${inquiry.service} (${reference})`,text:`Name: ${inquiry.firstName} ${inquiry.lastName}\nEmail: ${inquiry.email}\nPhone: ${inquiry.phone||'Not provided'}\nService: ${inquiry.service}\nReference: ${reference}\n\n${inquiry.message}`}),signal:AbortSignal.timeout(15000)});
    if(!response.ok)throw new HttpError(503,'Your inquiry could not be sent. Please retry or email omerdavidian@gmail.com.');
    const result=await response.json();if(!result.id)throw new Error('Invalid delivery response');
    return res.status(200).json({message:`Thank you! Your inquiry has been sent. Reference: ${reference}`});
  }catch(error){return res.status(error.status||503).json({message:error.status?error.message:'The form is temporarily unavailable. Please email omerdavidian@gmail.com.'});}
};}
export default createHandler();
