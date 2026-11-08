import {ready} from '../lib/security.mjs';
export default function handler(req,res){res.setHeader('Cache-Control','no-store');if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).json({message:'Method not allowed.'});}res.status(200).json({ready:ready(),siteKey:process.env.TURNSTILE_SITE_KEY||null});}
