import {NextResponse} from "next/server";
import {createClient} from "@supabase/supabase-js";
export const runtime="nodejs";
const db=()=>{const key=process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY;return process.env.SUPABASE_URL&&key?createClient(process.env.SUPABASE_URL,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}}):null;};
const missing=()=>NextResponse.json({error:"서버 저장소가 아직 연결되지 않았어요."},{status:503});
const admin=req=>{const a=req.headers.get("x-admin-key")||"",b=process.env.ADMIN_ACCESS_KEY||"";return !!b&&a.length===b.length&&a===b;};
async function summary(client){const{data,error}=await client.from("rsvps").select("attendance,headcount");if(error)throw error;return(data||[]).reduce((s,r)=>{s[r.attendance]=(s[r.attendance]||0)+(r.attendance==="yes"?Number(r.headcount||0):1);return s;},{yes:0,maybe:0,no:0});}
export async function GET(req,ctx){
 const{action}=await ctx.params;
 if(action==="status")return NextResponse.json({configured:!!(process.env.SUPABASE_URL&&(process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY)&&process.env.ADMIN_ACCESS_KEY)});
 const client=db();if(!client)return missing();
 if(action==="cheers"){const{data,error}=await client.from("cheers").select("id,nickname,emoji,created_at").order("created_at",{ascending:false}).limit(12);if(error)return NextResponse.json({error:"응원 목록을 불러오지 못했어요."},{status:500});const{count}=await client.from("cheers").select("id",{count:"exact",head:true});return NextResponse.json({items:data||[],total:count||0});}
 if(action==="rsvp"){try{return NextResponse.json({summary:await summary(client)});}catch{return NextResponse.json({error:"응답 현황 조회 실패"},{status:500});}}
 if(action==="questions"){if(!admin(req))return NextResponse.json({error:"운영자 인증이 필요해요."},{status:401});const{data,error}=await client.from("questions").select("id,nickname,body,answer,status,created_at,answered_at").order("created_at",{ascending:false}).limit(200);if(error)return NextResponse.json({error:"질문 목록 조회 실패"},{status:500});return NextResponse.json({items:data||[]});}
 return NextResponse.json({error:"Not found"},{status:404});
}
export async function POST(req,ctx){
 const{action}=await ctx.params;const client=db();if(!client)return missing();
 try{
  const body=await req.json();
  if(action==="cheers"){const allowed=["🔥","👏","💛","🎸","🐈","✨"];const emoji=String(body.emoji||"");const nickname=String(body.nickname||"익명의 관객").trim().slice(0,14)||"익명의 관객";if(!allowed.includes(emoji))return NextResponse.json({error:"지원하지 않는 응원이에요."},{status:400});const{error}=await client.from("cheers").insert({nickname,emoji});if(error)throw error;return NextResponse.json({ok:true},{status:201});}
  if(action==="questions"){const message=String(body.body||"").trim();if(!message||message.length>500)return NextResponse.json({error:"메시지는 1~500자로 입력해 주세요."},{status:400});const{error}=await client.from("questions").insert({body:message,status:"pending"});if(error)throw error;return NextResponse.json({ok:true},{status:201});}
  if(action==="rsvp"){const visitorId=String(body.visitorId||"");const attendance=String(body.attendance||"");const nickname=String(body.nickname||"익명의 관객").trim().slice(0,14)||"익명의 관객";const headcount=Math.min(6,Math.max(0,Number(body.headcount||0)));if(!/^[0-9a-f-]{20,50}$/i.test(visitorId)||!["yes","maybe","no"].includes(attendance))return NextResponse.json({error:"응답 정보를 다시 확인해 주세요."},{status:400});const{error}=await client.from("rsvps").upsert({visitor_id:visitorId,nickname,attendance,headcount:attendance==="yes"?Math.max(1,headcount):0,message:String(body.message||"").trim().slice(0,100),updated_at:new Date().toISOString()},{onConflict:"visitor_id"});if(error)throw error;return NextResponse.json({ok:true,summary:await summary(client)});}
  return NextResponse.json({error:"Not found"},{status:404});
 }catch{return NextResponse.json({error:"요청을 처리하지 못했어요."},{status:500});}
}
export async function PATCH(req,ctx){
 const{action}=await ctx.params;if(action!=="questions")return NextResponse.json({error:"Not found"},{status:404});if(!admin(req))return NextResponse.json({error:"운영자 인증이 필요해요."},{status:401});const client=db();if(!client)return missing();
 try{const body=await req.json();const id=String(body.id||"");const answer=String(body.answer||"").trim().slice(0,1000);if(!id||!answer)return NextResponse.json({error:"답변 내용을 확인해 주세요."},{status:400});const{error}=await client.from("questions").update({answer,status:"answered",answered_at:new Date().toISOString()}).eq("id",id);if(error)throw error;return NextResponse.json({ok:true});}catch{return NextResponse.json({error:"답변 저장에 실패했어요."},{status:500});}
}
