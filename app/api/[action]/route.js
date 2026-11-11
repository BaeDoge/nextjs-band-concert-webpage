import {NextResponse} from "next/server";
import {createClient} from "@supabase/supabase-js";

export const runtime="nodejs";
export const dynamic="force-dynamic";

const db=()=>{
 const key=process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY;
 return process.env.SUPABASE_URL&&key
  ?createClient(process.env.SUPABASE_URL,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}})
  :null;
};
const missing=()=>NextResponse.json({error:"서버 저장소가 아직 연결되지 않았어요."},{status:503});
const admin=req=>{
 const supplied=req.headers.get("x-admin-key")||"";
 const expected=process.env.ADMIN_ACCESS_KEY||"";
 return !!expected&&supplied.length===expected.length&&supplied===expected;
};
const uuidPattern=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const allowedEmojis=new Set(["🔥","👏","💛","🎸","🐈","✨"]);

function cleanNickname(value){
 return String(value||"관객").replace(/[<>\u0000-\u001f]/g,"").trim().slice(0,14)||"관객";
}
async function findVisitor(client,visitorId){
 if(!uuidPattern.test(String(visitorId||"")))return {error:NextResponse.json({error:"방문자 정보가 올바르지 않아요. 페이지를 새로고침해 주세요."},{status:400})};
 const{data,error}=await client.from("visitors")
  .select("visitor_id,nickname,blocked,block_reason,last_cheer_at,last_message_at")
  .eq("visitor_id",visitorId).maybeSingle();
 if(error)return {error:NextResponse.json({error:"방문자 정보를 확인하지 못했어요."},{status:500})};
 if(!data)return {error:NextResponse.json({error:"방문자 등록이 필요해요. 페이지를 새로고침해 주세요."},{status:403})};
 if(data.blocked)return {error:NextResponse.json({error:"이 기기에서는 응원과 메시지를 보낼 수 없어요. 운영자에게 문의해 주세요."},{status:403})};
 return {visitor:data};
}
async function touchVisitor(client,visitorId){
 const{error}=await client.from("visitors").update({last_seen:new Date().toISOString()}).eq("visitor_id",visitorId).eq("blocked",false);
 if(error)throw error;
}
async function summary(client){
 const{data,error}=await client.from("rsvps").select("attendance,headcount");
 if(error)throw error;
 return(data||[]).reduce((s,r)=>{
  s[r.attendance]=(s[r.attendance]||0)+(r.attendance==="yes"?Number(r.headcount||0):1);
  return s;
 },{yes:0,maybe:0,no:0});
}
function jsonError(message,status=500){return NextResponse.json({error:message},{status});}

export async function GET(req,ctx){
 const{action}=await ctx.params;
 const client=db();
 if(action==="status"){
  const missingEnv=[];
  if(!process.env.SUPABASE_URL)missingEnv.push("SUPABASE_URL");
  if(!(process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY))missingEnv.push("SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY)");
  const adminConfigured=!!process.env.ADMIN_ACCESS_KEY;
  if(missingEnv.length)return NextResponse.json({configured:false,adminConfigured,missingEnv,message:"Production 환경변수 누락: "+missingEnv.join(", ")});
  if(!client)return NextResponse.json({configured:false,adminConfigured,message:"Supabase 서버 키를 읽을 수 없습니다."});
  const tables=[["cheers","id"],["questions","id"],["rsvps","visitor_id"],["visitors","visitor_id"]];
  const checks=await Promise.all(tables.map(async([table,column])=>{
   const{error}=await client.from(table).select(column,{head:true,count:"exact"}).limit(0);
   return {table,error:error?error.code||"UNKNOWN":null};
  }));
  const errors=checks.filter(v=>v.error);
  if(errors.length)return NextResponse.json({configured:false,adminConfigured,dbReady:false,tableErrors:errors,message:"Supabase 마이그레이션이 필요합니다: "+errors.map(v=>v.table+" ("+v.error+")").join(", ")});
  return NextResponse.json({configured:true,adminConfigured,dbReady:true});
 }
 if(!client)return missing();

 if(action==="gallery"){
  const{data,error}=await client.from("site_settings").select("gallery_enabled").eq("id",1).maybeSingle();
  if(error)return jsonError("활동사진 설정을 불러오지 못했어요.");
  return NextResponse.json({enabled:data?.gallery_enabled??true});
 }

 if(action==="live"){
  const[{data,error},{count,countError}]=await Promise.all([
   client.from("cheers").select("id,nickname,emoji,created_at").order("created_at",{ascending:false}).limit(30),
   client.from("cheers").select("id",{count:"exact",head:true})
  ]);
  if(error||countError)return jsonError("응원 정보를 불러오지 못했어요.");
  return NextResponse.json({items:data||[],total:count||0});
 }

 if(action==="cheers"){
  const[{data,error},{count,countError}]=await Promise.all([
   client.from("cheers").select("id,nickname,emoji,created_at").order("created_at",{ascending:false}).limit(30),
   client.from("cheers").select("id",{count:"exact",head:true})
  ]);
  if(error||countError)return jsonError("응원 정보를 불러오지 못했어요.");
  return NextResponse.json({items:data||[],total:count||0});
 }

 if(action==="rsvp"){
  try{return NextResponse.json({summary:await summary(client)});}
  catch{return jsonError("응답 현황 조회 실패");}
 }

 if(action==="questions"){
  if(!admin(req))return jsonError("운영자 인증이 필요해요.",401);
  const{data,error}=await client.from("questions")
   .select("id,nickname,visitor_id,body,answer,status,created_at,answered_at")
   .order("created_at",{ascending:false}).limit(500);
  if(error)return jsonError("메시지 목록 조회 실패");
  return NextResponse.json({items:data||[]});
 }

 if(action==="admin"){
  if(!admin(req))return jsonError("운영자 인증이 필요해요.",401);
  const[statsResult,visitorsResult,questionsResult,rsvpsResult,settingsResult]=await Promise.all([
   client.rpc("daeil_admin_stats"),
   client.from("visitors").select("visitor_id,nickname,blocked,block_reason,created_at,last_seen").order("last_seen",{ascending:false}).limit(500),
   client.from("questions").select("id,nickname,visitor_id,body,answer,status,created_at,answered_at").order("created_at",{ascending:false}).limit(500),
   client.from("rsvps").select("visitor_id,nickname,attendance,headcount,message,updated_at").order("updated_at",{ascending:false}).limit(500),
   client.from("site_settings").select("gallery_enabled").eq("id",1).maybeSingle()
  ]);
  if(statsResult.error||visitorsResult.error||questionsResult.error||rsvpsResult.error||settingsResult.error){
   return NextResponse.json({error:"관리자 정보를 불러오지 못했어요. supabase/migrations/20261112_admin_moderation.sql과 20261112_gallery_settings.sql을 실행했는지 확인해 주세요."},{status:500});
  }
  const byVisitor=statsResult.data?.cheers_by_visitor||{};
  const visitors=(visitorsResult.data||[]).map(v=>({...v,cheer_count:Number(byVisitor[v.visitor_id]||0)}));
  return NextResponse.json({
   stats:statsResult.data||{},
   visitors,
   messages:questionsResult.data||[],
   rsvps:rsvpsResult.data||[],
   settings:{gallery_enabled:settingsResult.data?.gallery_enabled??true}
  });
 }
 return jsonError("Not found",404);
}

export async function POST(req,ctx){
 const{action}=await ctx.params;
 const client=db();if(!client)return missing();
 try{
  const body=await req.json();

  if(action==="visitors"){
   const visitorId=String(body.visitorId||"");
   if(!uuidPattern.test(visitorId))return jsonError("방문자 정보가 올바르지 않아요.",400);
   const nickname=cleanNickname(body.nickname);
   const now=new Date().toISOString();
   const{error}=await client.from("visitors").upsert({visitor_id:visitorId,nickname,last_seen:now},{onConflict:"visitor_id"});
   if(error)return jsonError("방문자 정보를 저장하지 못했어요.");
   const found=await findVisitor(client,visitorId);
   if(found.error)return found.error;
   return NextResponse.json({ok:true,visitor:{visitorId,nickname:found.visitor.nickname}});
  }

  if(action==="cheers"){
   const visitorId=String(body.visitorId||"");
   const found=await findVisitor(client,visitorId);
   if(found.error)return found.error;
   const emoji=String(body.emoji||"");
   if(!allowedEmojis.has(emoji))return jsonError("지원하지 않는 응원이에요.",400);
   const now=Date.now();
   const last=found.visitor.last_cheer_at?new Date(found.visitor.last_cheer_at).getTime():0;
   if(last&&now-last<500)return jsonError("잠깐만 기다렸다가 다시 응원해 주세요.",429);
   await client.from("visitors").update({last_cheer_at:new Date(now).toISOString(),last_seen:new Date(now).toISOString()}).eq("visitor_id",visitorId).eq("blocked",false);
   const nickname=found.visitor.nickname||cleanNickname(body.nickname);
   const{data,error}=await client.from("cheers").insert({visitor_id:visitorId,nickname,emoji}).select("id,nickname,emoji,created_at").single();
   if(error)return jsonError("응원을 저장하지 못했어요.");
   return NextResponse.json({ok:true,item:data},{status:201});
  }

  if(action==="questions"){
   const visitorId=String(body.visitorId||"");
   const found=await findVisitor(client,visitorId);
   if(found.error)return found.error;
   const message=String(body.body||"").trim();
   if(!message||message.length>500)return jsonError("메시지는 1~500자로 입력해 주세요.",400);
   const now=Date.now();
   const last=found.visitor.last_message_at?new Date(found.visitor.last_message_at).getTime():0;
   if(last&&now-last<5000)return jsonError("메시지는 5초에 한 번씩 보낼 수 있어요.",429);
   await client.from("visitors").update({last_message_at:new Date(now).toISOString(),last_seen:new Date(now).toISOString()}).eq("visitor_id",visitorId).eq("blocked",false);
   const{error}=await client.from("questions").insert({visitor_id:visitorId,nickname:found.visitor.nickname,body:message,status:"pending"});
   if(error)return jsonError("메시지를 저장하지 못했어요.");
   return NextResponse.json({ok:true},{status:201});
  }

  if(action==="rsvp"){
   const visitorId=String(body.visitorId||"");
   const found=await findVisitor(client,visitorId);
   if(found.error)return found.error;
   const attendance=String(body.attendance||"");
   const headcount=Math.min(6,Math.max(0,Number(body.headcount||0)));
   if(!["yes","maybe","no"].includes(attendance))return jsonError("응답 정보를 다시 확인해 주세요.",400);
   const{error}=await client.from("rsvps").upsert({
    visitor_id:visitorId,nickname:found.visitor.nickname,attendance,
    headcount:attendance==="yes"?Math.max(1,headcount):0,
    message:String(body.message||"").trim().slice(0,100),
    updated_at:new Date().toISOString()
   },{onConflict:"visitor_id"});
   if(error)return jsonError("응답을 저장하지 못했어요.");
   return NextResponse.json({ok:true,summary:await summary(client)});
  }
  return jsonError("Not found",404);
 }catch{
  return jsonError("요청을 처리하지 못했어요.",400);
 }
}

export async function PATCH(req,ctx){
 const{action}=await ctx.params;
 if(!admin(req))return jsonError("운영자 인증이 필요해요.",401);
 const client=db();if(!client)return missing();
 try{
  const body=await req.json();

  if(action==="questions"){
   const id=String(body.id||"");
   const answer=String(body.answer||"").trim().slice(0,1000);
   if(!id||!answer)return jsonError("답변 내용을 확인해 주세요.",400);
   const{error}=await client.from("questions").update({answer,status:"answered",answered_at:new Date().toISOString()}).eq("id",id);
   if(error)return jsonError("답변 저장에 실패했어요.");
   return NextResponse.json({ok:true});
  }

  if(action==="visitors"){
   const visitorId=String(body.visitorId||"");
   const blocked=Boolean(body.blocked);
   const reason=String(body.reason||"").trim().slice(0,200);
   if(!uuidPattern.test(visitorId))return jsonError("사용자 정보가 올바르지 않아요.",400);
   const{data,error}=await client.from("visitors")
    .update({blocked,block_reason:blocked?(reason||"운영자에 의해 차단됨"):null})
    .eq("visitor_id",visitorId)
    .select("visitor_id,nickname,blocked,block_reason").maybeSingle();
   if(error)return jsonError("차단 상태를 변경하지 못했어요.");
   if(!data)return jsonError("사용자를 찾지 못했어요.",404);
   return NextResponse.json({ok:true,visitor:data});
  }
  if(action==="settings"){
   const galleryEnabled=Boolean(body.galleryEnabled);
   const{data,error}=await client.from("site_settings")
    .upsert({id:1,gallery_enabled:galleryEnabled,updated_at:new Date().toISOString()},{onConflict:"id"})
    .select("id,gallery_enabled,updated_at").single();
   if(error)return jsonError("갤러리 표시 설정을 저장하지 못했어요.");
   return NextResponse.json({ok:true,settings:data});
  }

  return jsonError("Not found",404);
 }catch{return jsonError("요청을 처리하지 못했어요.",400);}
}

export async function DELETE(req,ctx){
 const{action}=await ctx.params;
 if(!admin(req))return jsonError("운영자 인증이 필요해요.",401);
 const client=db();if(!client)return missing();

 if(action==="visitors"){
  let body={};
  try{body=await req.json();}catch{return jsonError("삭제할 사용자 정보가 필요해요.",400);}
  const visitorId=String(body.visitorId||"");
  if(!uuidPattern.test(visitorId))return jsonError("사용자 ID 형식이 올바르지 않아요.",400);
  const{data,error}=await client.rpc("daeil_admin_delete_visitor",{p_visitor_id:visitorId});
  if(error)return jsonError("사용자와 연결된 기록을 삭제하지 못했어요. supabase/migrations/20261112_visitor_delete.sql을 실행했는지 확인해 주세요.");
  return NextResponse.json({ok:true,deleted:data||{}});
 }

 if(action==="cheers"){
  const{error}=await client.from("cheers").delete().gte("created_at","1970-01-01T00:00:00.000Z");
  if(error)return jsonError("응원 기록 초기화에 실패했어요.");
  return NextResponse.json({ok:true,total:0});
 }
 return jsonError("Not found",404);
}
