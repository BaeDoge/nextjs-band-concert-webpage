"use client";
import {useMemo,useState} from "react";
import Link from "next/link";
import {ArrowLeft,LockKeyhole,Send,CheckCircle2,RefreshCw,Trash2,Heart,Users,MessageSquare,ShieldBan,ShieldCheck,Search} from "lucide-react";

const emojiLabels={"🔥":"불꽃","👏":"박수","💛":"하트","🎸":"기타","🐈":"고양이","✨":"반짝"};

export default function HostPage(){
 const[key,setKey]=useState("");
 const[ok,setOk]=useState(false);
 const[stats,setStats]=useState({});
 const[rsvps,setRsvps]=useState([]);
 const[galleryEnabled,setGalleryEnabled]=useState(true);
 const[visitors,setVisitors]=useState([]);
 const[inactiveVisitorCount,setInactiveVisitorCount]=useState(0);
 const[messages,setMessages]=useState([]);
 const[answers,setAnswers]=useState({});
 const[search,setSearch]=useState("");
 const[reason,setReason]=useState("운영자에 의해 차단됨");
 const[error,setError]=useState("");
 const[notice,setNotice]=useState("");
 const[busy,setBusy]=useState(false);

 async function load(){
  setBusy(true);setError("");setNotice("");
  try{
   const response=await fetch("/api/admin",{headers:{"x-admin-key":key},cache:"no-store"});
   const data=await response.json();
   if(!response.ok)throw Error(data.error||"관리자 정보를 불러오지 못했어요.");
   setStats(data.stats||{});setVisitors(data.visitors||[]);setInactiveVisitorCount(Number(data.inactiveVisitorCount||0));setMessages(data.messages||[]);setRsvps(data.rsvps||[]);setGalleryEnabled(data.settings?.gallery_enabled??true);setOk(true);
  }catch(e){setOk(false);setError(e.message||"관리자 인증에 실패했어요.");}
  finally{setBusy(false);}
 }

 async function toggleGallery(){
  const next=!galleryEnabled;setBusy(true);setError("");setNotice("");
  try{
   const response=await fetch("/api/settings",{method:"PATCH",headers:{"Content-Type":"application/json","x-admin-key":key},body:JSON.stringify({galleryEnabled:next})});
   const data=await response.json();if(!response.ok)throw Error(data.error||"갤러리 설정을 저장하지 못했어요.");
   setGalleryEnabled(Boolean(data.settings.gallery_enabled));setNotice(next?"활동사진 캐로셀이 공개 페이지에 표시됩니다.":"활동사진 캐로셀이 공개 페이지에서 숨겨졌습니다.");
  }catch(e){setError(e.message||"설정을 저장하지 못했어요.");}
  finally{setBusy(false);}
 }

 async function answer(id){
  const answerText=(answers[id]||"").trim();if(!answerText)return;
  setBusy(true);setError("");setNotice("");
  try{
   const response=await fetch("/api/questions",{method:"PATCH",headers:{"Content-Type":"application/json","x-admin-key":key},body:JSON.stringify({id,answer:answerText})});
   const data=await response.json();if(!response.ok)throw Error(data.error||"답변 저장에 실패했어요.");
   setAnswers(current=>({...current,[id]:""}));setNotice("답변을 저장했어요.");await load();
  }catch(e){setError(e.message);}
  finally{setBusy(false);}
 }

 async function toggleBlock(visitor){
  const next=!visitor.blocked;
  const promptReason=next?(window.prompt("차단 사유를 입력하세요. (선택)",reason)||"운영자에 의해 차단됨"):"";
  if(next&&!window.confirm(visitor.nickname+" 님의 이 브라우저 ID를 차단할까요?"))return;
  if(!next&&!window.confirm(visitor.nickname+" 님의 차단을 해제할까요?"))return;
  setBusy(true);setError("");setNotice("");
  try{
   const response=await fetch("/api/visitors",{method:"PATCH",headers:{"Content-Type":"application/json","x-admin-key":key},body:JSON.stringify({visitorId:visitor.visitor_id,blocked:next,reason:promptReason})});
   const data=await response.json();if(!response.ok)throw Error(data.error||"차단 상태를 변경하지 못했어요.");
   setNotice(next?"해당 브라우저 ID를 차단했어요.":"차단을 해제했어요.");await load();
  }catch(e){setError(e.message);}
  finally{setBusy(false);}
 }

 async function deleteInactiveVisitors(){
  const count=inactiveVisitorCount;
  if(!count)return;
  const confirmation="활동 이력이 없는 사용자 "+count+"명을 일괄 삭제할까요?\\n\\n응원, 메시지, 뒤풀이 응답이 모두 없는 사용자만 삭제합니다. 차단된 사용자는 보존됩니다.\\n\\n삭제 후 복구할 수 없습니다.";
  if(!window.confirm(confirmation))return;
  setBusy(true);setError("");setNotice("");
  try{
   const response=await fetch("/api/inactive-visitors",{method:"DELETE",headers:{"x-admin-key":key}});
   const data=await response.json();
   if(!response.ok)throw Error(data.error||"미활동 사용자를 삭제하지 못했어요.");
   setNotice("활동 이력이 없는 사용자 "+Number(data.deletedCount||0)+"명을 삭제했어요.");
   await load();
  }catch(e){setError(e.message||"일괄 삭제에 실패했어요.");}
  finally{setBusy(false);}
 }

 async function deleteVisitor(visitor){
  const nickname=visitor.nickname||"관객";
  const messageCount=messages.filter(item=>item.visitor_id===visitor.visitor_id).length;
  const rsvpCount=rsvps.filter(item=>item.visitor_id===visitor.visitor_id).length;
  const cheerCount=Number(visitor.cheer_count||0);
  const summary=nickname+" 사용자를 삭제하면 연결된 기록도 함께 삭제됩니다.\\n\\n응원 "+cheerCount+"건\\n메시지 "+messageCount+"건\\n뒤풀이 응답 "+rsvpCount+"건\\n\\n이 작업은 복구할 수 없습니다. 계속할까요?";
  if(!window.confirm(summary))return;
  setBusy(true);setError("");setNotice("");
  try{
   const response=await fetch("/api/visitors",{method:"DELETE",headers:{"Content-Type":"application/json","x-admin-key":key},body:JSON.stringify({visitorId:visitor.visitor_id})});
   const data=await response.json();
   if(!response.ok)throw Error(data.error||"사용자를 삭제하지 못했어요.");
   setNotice(nickname+" 및 연결된 기록을 삭제했어요.");await load();
  }catch(e){setError(e.message||"사용자 삭제에 실패했어요.");}
  finally{setBusy(false);}
 }

 async function resetCheers(){
  if(!window.confirm("누적 응원 기록 "+Number(stats.total_cheers||0)+"건을 모두 삭제할까요? 이 작업은 되돌릴 수 없습니다."))return;
  setBusy(true);setError("");setNotice("");
  try{
   const response=await fetch("/api/cheers",{method:"DELETE",headers:{"x-admin-key":key}});
   const data=await response.json();if(!response.ok)throw Error(data.error||"응원 초기화에 실패했어요.");
   setNotice("응원 기록을 초기화했어요.");await load();
  }catch(e){setError(e.message);}
  finally{setBusy(false);}
 }

 const filteredVisitors=useMemo(()=>{
  const q=search.trim().toLowerCase();
  if(!q)return visitors;
  return visitors.filter(v=>String(v.nickname||"").toLowerCase().includes(q)||v.visitor_id.toLowerCase().includes(q));
 },[visitors,search]);

 const rsvp=stats.rsvp||{};
 const cheerRows=Object.entries(stats.cheers_by_emoji||{}).sort((a,b)=>b[1]-a[1]);
 const maxCheer=Math.max(1,...cheerRows.map(([,count])=>Number(count)));

 return <main className="host host-dashboard">
  <Link href="/" className="host-back"><ArrowLeft size={16}/> 공연 페이지로</Link>
  <header><small>DAEIL BAND · PRIVATE ADMIN</small><h1>운영자 <em>대시보드</em></h1><p>참여자, 응원, 메시지 및 사용자 관리를 확인합니다.</p></header>
  {!ok?
   <form className="host-login" onSubmit={event=>{event.preventDefault();load();}}>
    <LockKeyhole size={28}/><label htmlFor="secret">관리자 접근 키</label>
    <input id="secret" type="password" value={key} onChange={event=>setKey(event.target.value)} placeholder="ADMIN_ACCESS_KEY" required autoComplete="current-password"/>
    <button disabled={busy}>{busy?"확인 중...":"관리자 페이지 열기"}</button>
   </form>
   :
   <>
    <div className="host-toolbar"><span>마지막 조회: {new Date().toLocaleTimeString("ko-KR")}</span><button onClick={load} disabled={busy}><RefreshCw size={14}/> 새로고침</button></div>
    <section className="host-stat-grid">
     <article><Users/><small>등록 방문자</small><strong>{Number(stats.total_visitors||0).toLocaleString("ko-KR")}</strong><span>고유 닉네임 {Number(stats.unique_nicknames||0).toLocaleString("ko-KR")}개</span></article>
     <article><Heart/><small>누적 응원</small><strong>{Number(stats.total_cheers||0).toLocaleString("ko-KR")}</strong><span>이모티콘 응원 전체</span></article>
     <article><MessageSquare/><small>메시지</small><strong>{Number(stats.total_messages||0).toLocaleString("ko-KR")}</strong><span>미답변 {Number(stats.pending_messages||0)}건</span></article>
     <article><ShieldBan/><small>차단 방문자</small><strong>{Number(stats.blocked_visitors||0).toLocaleString("ko-KR")}</strong><span>브라우저 ID 기준</span></article>
    </section>

    <section className="host-panel">
     <div className="host-panel-head"><div><small>REACTION ANALYTICS</small><h2>감정 표현 통계</h2></div><button className="host-reset" onClick={resetCheers} disabled={busy||!Number(stats.total_cheers)}><Trash2 size={14}/> 응원 기록 초기화</button></div>
     {cheerRows.length===0?<p className="host-empty">아직 응원 기록이 없습니다.</p>:<div className="host-reaction-grid">{cheerRows.map(([emoji,count])=><div className="host-reaction" key={emoji}><div><strong>{emoji}</strong><b>{Number(count).toLocaleString("ko-KR")}</b></div><span>{emojiLabels[emoji]||"응원"}</span><div className="host-bar"><i style={{width:(Number(count)/maxCheer*100)+"%"}}/></div></div>)}</div>}
    </section>

    <section className="host-panel">
     <div className="host-panel-head"><div><small>GUEST MANAGEMENT</small><h2>참여자 목록</h2><p>등록된 브라우저별 닉네임과 응원 활동입니다.</p></div><span className="host-count">{visitors.length}명 표시</span></div>
     <div className="host-bulk-cleanup">
      <div><strong>활동 이력 없는 사용자</strong><small>응원·메시지·뒤풀이 응답이 모두 없는 사용자 · 차단된 사용자는 제외</small></div>
      <div className="host-bulk-cleanup-action"><b>{inactiveVisitorCount.toLocaleString("ko-KR")}명</b><button className="host-delete" onClick={deleteInactiveVisitors} disabled={busy||inactiveVisitorCount===0}><Trash2 size={14}/> 일괄 삭제</button></div>
     </div>
     <div className="host-search"><Search size={16}/><input value={search} onChange={event=>setSearch(event.target.value)} placeholder="닉네임 또는 사용자 ID 검색"/></div>
     <div className="host-users">
      {filteredVisitors.length===0?<p className="host-empty">검색 결과가 없습니다.</p>:filteredVisitors.map(visitor=>
       <article className={visitor.blocked?"host-user is-blocked":"host-user"} key={visitor.visitor_id}>
        <div className="host-user-main"><strong>{visitor.nickname||"관객"}</strong><small>응원 {Number(visitor.cheer_count||0)}회 · 최근 접속 {visitor.last_seen?new Date(visitor.last_seen).toLocaleString("ko-KR"):"-"}</small>{visitor.blocked&&<em>차단됨 · {visitor.block_reason||"사유 미입력"}</em>}</div>
        <div className="host-user-actions">
         <button className={visitor.blocked?"host-unblock":"host-block"} disabled={busy} onClick={()=>toggleBlock(visitor)}>{visitor.blocked?<><ShieldCheck size={14}/> 차단 해제</>:<><ShieldBan size={14}/> 차단</>}</button>
         <button className="host-delete" disabled={busy} onClick={()=>deleteVisitor(visitor)}><Trash2 size={14}/> 삭제</button>
        </div>
       </article>
      )}
     </div>
     <p className="host-footnote">차단은 방문자 ID(현재 브라우저)에 적용됩니다. 시크릿 모드나 다른 기기에서 새 ID를 만들면 우회할 수 있습니다.</p>
    </section>

    <section className="host-panel">
     <div className="host-panel-head"><div><small>GUEST MESSAGES</small><h2>보내온 메시지</h2><p>메시지 내용과 작성 닉네임을 확인하고 답변할 수 있습니다.</p></div><span className="host-count">{messages.length}건</span></div>
     {messages.length===0?<p className="host-empty">아직 도착한 메시지가 없어요.</p>:<div className="host-messages">{messages.map(item=>
      <article key={item.id}>
       <div className="host-message-meta"><strong>{item.nickname||"관객"}</strong><time>{new Date(item.created_at).toLocaleString("ko-KR")}</time><b>{item.answer?"답변 완료":"미답변"}</b></div>
       <p>{item.body}</p>
       {item.answer?<aside><CheckCircle2 size={15}/>{item.answer}</aside>:<div className="host-answer-form"><input value={answers[item.id]||""} onChange={event=>setAnswers(current=>({...current,[item.id]:event.target.value}))} placeholder="답변 입력"/><button disabled={busy||!(answers[item.id]||"").trim()} onClick={()=>answer(item.id)}><Send size={14}/> 답변</button></div>}
       {item.visitor_id?<div className="host-message-actions"><small>ID {item.visitor_id.slice(0,8)}…</small><button onClick={()=>toggleBlock(visitors.find(v=>v.visitor_id===item.visitor_id)||{visitor_id:item.visitor_id,nickname:item.nickname,blocked:false})} disabled={busy}><ShieldBan size={13}/> 작성자 차단</button></div>:<small className="host-footnote">기존 기록: 방문자 ID가 저장되기 전의 메시지라 사용자 차단과 연결할 수 없습니다.</small>}
      </article>
     )}</div>}
    </section>
    <section className="host-panel host-gallery-toggle">
     <div className="host-panel-head"><div><small>ACTIVITY PHOTO CAROUSEL</small><h2>활동사진 캐로셀</h2><p>공개 공연 페이지 하단에 활동사진을 표시할지 설정합니다.</p></div>
      <button className={galleryEnabled?"host-unblock":"host-block"} onClick={toggleGallery} disabled={busy}>{galleryEnabled?"ON · 표시 중":"OFF · 숨김"}</button>
     </div>
     <p className="host-footnote">설정은 Supabase에 저장되며 모든 관객에게 동일하게 적용됩니다.</p>
    </section>

    <section className="host-panel host-rsvp-summary">
     <div className="host-panel-head"><div><small>AFTER PARTY RSVP</small><h2>뒤풀이 응답</h2></div></div>
     <div><span>참석 {Number(rsvp.yes||0)}명</span><span>미정 {Number(rsvp.maybe||0)}명</span><span>불참 {Number(rsvp.no||0)}명</span></div>
    </section>
    <section className="host-panel host-rsvp-list">
     <div className="host-panel-head"><div><small>GUEST RSVP DETAIL</small><h2>뒤풀이 응답자</h2><p>닉네임별 참석 여부와 신청 인원을 확인합니다.</p></div><span className="host-count">{rsvps.length}건</span></div>
     {rsvps.length===0?<p className="host-empty">아직 등록된 뒤풀이 응답이 없습니다.</p>:<div className="host-rsvp-rows">{rsvps.map(item=>
      <article key={item.visitor_id}>
       <div><strong>{item.nickname||"관객"}</strong><span className={"host-rsvp-status "+item.attendance}>{item.attendance==="yes"?"참석":item.attendance==="maybe"?"미정":"불참"}</span></div>
       <b>{item.attendance==="yes"?(Number(item.headcount||1)+"명 참석"):(item.attendance==="maybe"?"참석 미정":"불참")}</b>
       {item.message&&<p>{item.message}</p>}
       <time>{item.updated_at?new Date(item.updated_at).toLocaleString("ko-KR"):"-"}</time>
      </article>
     )}</div>}
    </section>
   </>
  }
  {error&&<p className="host-error" role="alert">{error}</p>}
  {notice&&<p className="host-notice" role="status">{notice}</p>}
  <p className="host-note">관리자 접근 키는 브라우저에 저장하지 않으며 서버에서만 확인합니다.</p>
 </main>;
}
