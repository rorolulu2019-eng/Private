import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { paymentFor, euro } from '@/lib/loan';
export const runtime='nodejs';
const limits={amount:[1000,250000],term:[12,120]};
export async function POST(request:Request){
 try{
  const body=await request.json();
  const required=['firstName','lastName','email','postcode','city','purpose'];
  if(required.some(k=>typeof body[k]!=='string'||!body[k].trim())||!/^\S+@\S+\.\S+$/.test(body.email)||body.firstName.length>80||body.lastName.length>80||body.email.length>254||!Number.isFinite(body.amount)||!Number.isInteger(body.term)||body.amount<limits.amount[0]||body.amount>limits.amount[1]||body.term<limits.term[0]||body.term>limits.term[1])return NextResponse.json({error:'Bitte prüfen Sie Ihre Angaben.'},{status:400});
  const application={first_name:body.firstName.trim(),last_name:body.lastName.trim(),email:body.email.trim().toLowerCase(),phone:typeof body.phone==='string'?body.phone.slice(0,40):null,postcode:String(body.postcode).slice(0,12),city:String(body.city).slice(0,100),amount:body.amount,term:body.term,purpose:String(body.purpose).slice(0,80),monthly_payment:paymentFor(body.amount,body.term),created_at:new Date().toISOString()};
  if(process.env.SUPABASE_URL&&process.env.SUPABASE_SERVICE_ROLE_KEY){const db=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);const {error}=await db.from('applications').insert(application);if(error)throw new Error('database');}
  else console.info('Application received (storage not configured)',{email:application.email,amount:application.amount});
  if(process.env.RESEND_API_KEY&&process.env.EMAIL_FROM){const resend=new Resend(process.env.RESEND_API_KEY);await resend.emails.send({from:process.env.EMAIL_FROM,to:application.email,subject:'Ihre Finanzierungsanfrage ist eingegangen',html:`<div style="font-family:Arial,sans-serif;color:#17211d;max-width:600px;margin:auto"><h1>Vielen Dank, ${escapeHtml(application.first_name)}.</h1><p>Ihre unverbindliche Finanzierungsanfrage ist bei uns eingegangen. Dies ist noch keine Kreditzusage.</p><table><tr><td>Betrag</td><td>${euro(application.amount)}</td></tr><tr><td>Laufzeit</td><td>${application.term} Monate</td></tr><tr><td>Unverbindliche Beispielrate</td><td>${euro(application.monthly_payment)} / Monat</td></tr></table><p>Wir melden uns persönlich bei Ihnen, um Ihre Möglichkeiten zu besprechen. Bitte senden Sie sensible Unterlagen nicht als Antwort auf diese E-Mail.</p><p>Freundliche Grüße<br>Ihr FinanzPartner-Team</p><hr><small>Diese Nachricht bestätigt ausschließlich den Eingang Ihrer Anfrage und ist kein Kreditangebot.</small></div>`});}
  return NextResponse.json({ok:true},{status:201});
 }catch(error){console.error('Application submission failed',error);return NextResponse.json({error:'Die Anfrage konnte nicht verarbeitet werden.'},{status:500});}
}
function escapeHtml(s:string){return s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));}
