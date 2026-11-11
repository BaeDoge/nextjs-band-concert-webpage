import {NextResponse} from "next/server";
import {createClient} from "@supabase/supabase-js";
export const runtime="nodejs";
const db=()=>{const key=process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY;return process.env.SUPABASE_URL&&key?createClient(process.env.SUPABASE_URL,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}}):null;};
const missing=()=>NextResponse.json({error:"서버 저장소가 아직 연결되지 않았어요."},{status:503});
const admin=req=>{const a=req.headers.get("x-admin-key")||"",b=process.env.ADMIN_ACCESS_KEY||"";return !!b&&a.length===b.length&&a===b;};
async function summary(client){const{data,error}=await client.from("rsvps").select("attendance,headcount");if(error)throw error;return(data||[]).reduce((s,r)=>{s[r.attendance]=(s[r.attendance]||0)+(r.attendance==="yes"?Number(r.headcount||0):1);return s;},{yes:0,maybe:0,no:0});}
export async function GET(req,ctx){
 const{action}=await ctx.params;
 if(action==="status"){
  const missingEnv=[];
  if(!process.env.SUPABASE_URL)missingEnv.push("SUPABASE_URL");
  if(!(process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY))missingEnv.push("SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY)");
  const adminConfigured=!!process.env.ADMIN_ACCESS_KEY;
  if(missingEnv.length)return NextResponse.json({configured:false,adminConfigured,missingEnv,message:"Production 환경변수 누락: "+missingEnv.join(", ")+". Vercel Project Settings → Environment Variables에서 추가한 뒤 새 배포를 해주세요."});
  const client=db();
  if(!client)return NextResponse.json({configured:false,adminConfigured,message:"Supabase 서버 키를 읽을 수 없습니다. 환경변수 이름과 배포 환경을 확인해 주세요."});
  const tables=[["cheers","id"],["questions","id"],["rsvps","visitor_id"]];
  const checks=await Promise.all(tables.map(async([table,column])=>{
   const{error}=await client.from(table).select(column,{head:true,count:"exact"}).limit(0);
   return {table,error:error?{code:error.code||"UNKNOWN",message:error.message||""}:null};
  }));
  const errors=checks.filter(v=>v.error);
  if(errors.length)return NextResponse.json({configured:false,adminConfigured,dbReady:false,tableErrors:errors.map(item=>({table:item.table,code:item.error.code})),message:"Supabase 테이블 조회 실패: "+errors.map(item=>item.table+" ("+item.error.code+")").join(", ")+". SQL Editor에서 supabase/schema.sql 실행 여부와 해당 프로젝트의 Secret Key인지 확인해 주세요."});
  return NextResponse.json({configured:true,adminConfigured,dbReady:true});
 }
 const client=db();if(!client)return missing();
 if(action==="cheers"){
  const{data,error}=await client.from("cheers").select("id,nickname,emoji,created_at").order("created_at",{ascending:false}).limit(30);
  if(error)return NextResponse.json({error:"응원 목록을 불러오지 못했어요.",code:error.code||"DB_ERROR"},{status:500});
  const{count,error:countError}=await client.from("cheers").select("id",{count:"exact",head:true});
  if(countError)return NextResponse.json({error:"응원 누적 수를 불러오지 못했어요.",code:countError.code||"DB_ERROR"},{status:500});
  return NextResponse.json({items:data||[],total:count||0});
 }
 if(action==="rsvp"){try{return NextResponse.json({summary:await summary(client)});}catch{return NextResponse.json({error:"응답 현황 조회 실패"},{status:500});}}
 if(action==="questions"){if(!admin(req))return NextResponse.json({error:"운영자 인증이 필요해요."},{status:401});const{data,error}=await client.from("questions").select("id,nickname,body,answer,status,created_at,answered_at").order("created_at",{ascending:false}).limit(200);if(error)return NextResponse.json({error:"질문 목록 조회 실패"},{status:500});return NextResponse.json({items:data||[]});}
 return NextResponse.json({error:"Not found"},{status:404});
}
export async function POST(req,ctx){
 const{action}=await ctx.params;const client=db();if(!client)return missing();
 try{
  const body=await req.json();
  if(action==="cheers"){const allowed=["🔥","👏","💛","🎸","🐈","✨"];const emoji=String(body.emoji||"");const nickname=String(body.nickname||"익명의 관객").trim().slice(0,14)||"익명의 관객";if(!allowed.includes(emoji))return NextResponse.json({error:"지원하지 않는 응원이에요."},{status:400});const{data,error}=await client.from("cheers").insert({nickname,emoji}).select("id,nickname,emoji,created_at").single();if(error)throw error;return NextResponse.json({ok:true,item:data},{status:201});}
  if(action==="questions"){const message=String(body.body||"").trim();if(!message||message.length>500)return NextResponse.json({error:"메시지는 1~500자로 입력해 주세요."},{status:400});const{error}=await client.from("questions").insert({body:message,status:"pending"});if(error)throw error;return NextResponse.json({ok:true},{status:201});}
  if(action==="rsvp"){const visitorId=String(body.visitorId||"");const attendance=String(body.attendance||"");const nickname=String(body.nickname||"익명의 관객").trim().slice(0,14)||"익명의 관객";const headcount=Math.min(6,Math.max(0,Number(body.headcount||0)));if(!/^[0-9a-f-]{20,50}$/i.test(visitorId)||!["yes","maybe","no"].includes(attendance))return NextResponse.json({error:"응답 정보를 다시 확인해 주세요."},{status:400});const{error}=await client.from("rsvps").upsert({visitor_id:visitorId,nickname,attendance,headcount:attendance==="yes"?Math.max(1,headcount):0,message:String(body.message||"").trim().slice(0,100),updated_at:new Date().toISOString()},{onConflict:"visitor_id"});if(error)throw error;return NextResponse.json({ok:true,summary:await summary(client)});}
  return NextResponse.json({error:"Not found"},{status:404});
 }catch{return NextResponse.json({error:"요청을 처리하지 못했어요."},{status:500});}
}
export async function PATCH(req,ctx){
 const{action}=await ctx.params;if(action!=="questions")return NextResponse.json({error:"Not found"},{status:404});if(!admin(req))return NextResponse.json({error:"운영자 인증이 필요해요."},{status:401});const client=db();if(!client)return missing();
 try{const body=await req.json();const id=String(body.id||"");const answer=String(body.answer||"").trim().slice(0,1000);if(!id||!answer)return NextResponse.json({error:"답변 내용을 확인해 주세요."},{status:400});const{error}=await client.from("questions").update({answer,status:"answered",answered_at:new Date().toISOString()}).eq("id",id);if(error)throw error;return NextResponse.json({ok:true});}catch{return NextResponse.json({error:"답변 저장에 실패했어요."},{status:500});}
}

export async function DELETE(req,ctx){
 const{action}=await ctx.params;
 if(action!=="cheers")return NextResponse.json({error:"Not found"},{status:404});
 if(!admin(req))return NextResponse.json({error:"운영자 인증이 필요해요."},{status:401});
 const client=db();if(!client)return missing();
 const{error}=await client.from("cheers").delete().gte("created_at","1970-01-01T00:00:00.000Z");
 if(error)return NextResponse.json({error:"응원 기록 초기화에 실패했어요."},{status:500});
 return NextResponse.json({ok:true,total:0});
}
