import {cp,mkdir,writeFile} from 'node:fs/promises';
await mkdir('dist',{recursive:true});await cp('public','dist',{recursive:true});
// Theme layout uses inline CSS, while scripts remain restricted to local files
// and Cloudflare's Turnstile origin. No WordPress or inline script is shipped.
const csp=`default-src 'self'; script-src 'self' https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' https://challenges.cloudflare.com; frame-src https://kuula.co https://challenges.cloudflare.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests`;
const config={version:2,buildCommand:'npm run build',outputDirectory:'dist',framework:null,headers:[{source:'/(.*)',headers:[{key:'Content-Security-Policy',value:csp},{key:'X-Content-Type-Options',value:'nosniff'},{key:'Referrer-Policy',value:'strict-origin-when-cross-origin'},{key:'Permissions-Policy',value:'camera=(), microphone=(), geolocation=()'},{key:'X-Frame-Options',value:'DENY'},{key:'Strict-Transport-Security',value:'max-age=31536000'}]},{source:'/assets/(.*)',headers:[{key:'Cache-Control',value:'public, max-age=31536000, immutable'}]},{source:'/api/(.*)',headers:[{key:'Cache-Control',value:'no-store'}]}],redirects:[{source:'/home',destination:'/',permanent:true},{source:'/index.php',destination:'/',permanent:true}]};
await writeFile('vercel.json',JSON.stringify(config,null,2)+'\n');
console.log('Static portfolio built; security headers generated.');
