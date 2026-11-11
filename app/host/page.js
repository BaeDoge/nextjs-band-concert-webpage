"use client";
import {useState} from "react";
import Link from "next/link";
import {ArrowLeft,LockKeyhole,Send,CheckCircle2,RefreshCw,Trash2,Heart} from "lucide-react";

export default function HostPage(){
 const[key,setKey]=useState("");
 const[ok,setOk]=useState(false);
 const[items,setItems]=useState([]);
 const[answers,setAnswers]=useState({});
 const[error,setError]=useState("");
 const[notice,setNotice]=useState("");
 const[busy,setBusy]=useState(false);
 const[cheerTotal,setCheerTotal]=useState(0);

 async function load(){
  setBusy(true);setError("");setNotice("");
  try{
   const[q,c]=await Promise.all([
    fetch("/api/questions",{headers:{"x-admin-key":key},cache:"no-store"}),
    fetch("/api/cheers",{cache:"no-store"})
   ]);
   const qData=await q.json();
   if(!q.ok)throw Error(qData.error||"운영자 인증에 실패했어요.");
   const cData=c.ok?await c.json():{total:0};
   setItems(qData.items||[]);setCheerTotal(Number(cData.total||0));setOk(true);
  }catch(e){setOk(false);setError(e.message||"정보를 불러오지 못했어요.");}
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

 async function resetCheers(){
  if(!window.confirm("누적 응원 기록 "+cheerTotal+"건을 모두 삭제하고 0으로 초기화할까요? 이 작업은 되돌릴 수 없습니다."))return;
  setBusy(true);setError("");setNotice("");
  try{
   const response=await fetch("/api/cheers",{method:"DELETE",headers:{"x-admin-key":key}});
   const data=await response.json();if(!response.ok)throw Error(data.error||"응원 초기화에 실패했어요.");
   setCheerTotal(0);setNotice("응원 기록을 초기화했어요.");
  }catch(e){setError(e.message);}
  finally{setBusy(false);}
 }

 return <main className="host">
  <Link href="/" className="host-back"><ArrowLeft size={16}/> 공연 페이지로</Link>
  <header><small>대일밴드 운영자</small><h1>관리자 <em>페이지</em></h1><p>메시지를 확인하고 관객 응원 기록을 관리합니다.</p></header>
  {!ok?
   <form className="host-login" onSubmit={event=>{event.preventDefault();load();}}>
    <LockKeyhole size={28}/><label htmlFor="secret">관리자 접근 키</label>
    <input id="secret" type="password" value={key} onChange={event=>setKey(event.target.value)} placeholder="ADMIN_ACCESS_KEY" required/>
    <button disabled={busy}>{busy?"확인 중...":"관리자 페이지 열기"}</button>
   </form>
   :
   <>
    <section className="host-cheers">
     <div><Heart size={20}/><span>누적 응원 수</span><strong>{cheerTotal.toLocaleString("ko-KR")}</strong></div>
     <button className="host-reset" onClick={resetCheers} disabled={busy||cheerTotal===0}><Trash2 size={15}/> 응원 횟수 초기화</button>
     <p>초기화하면 관객 화면의 누적 숫자도 0으로 반영됩니다. 이미 화면에 떠 있는 응원 애니메이션은 잠시 후 사라집니다.</p>
    </section>
    <section className="host-list">
     <div className="host-list-head"><b>받은 메시지 ({items.length})</b><button onClick={load} disabled={busy}><RefreshCw size={13}/> 새로고침</button></div>
     {items.length===0?<p className="host-empty">아직 도착한 메시지가 없어요.</p>:items.map(item=>
      <article key={item.id}>
       <div><span>{item.nickname&&item.nickname!=="익명의 관객"?item.nickname:"관객"}</span><time>{new Date(item.created_at).toLocaleString("ko-KR")}</time><b>{item.answer?"답변 완료":"미답변"}</b></div>
       <p>{item.body}</p>
       {item.answer?<aside><CheckCircle2 size={15}/>{item.answer}</aside>:
        <section><input value={answers[item.id]||""} onChange={event=>setAnswers(current=>({...current,[item.id]:event.target.value}))} placeholder="답변 입력"/><button disabled={busy||!(answers[item.id]||"").trim()} onClick={()=>answer(item.id)}><Send size={14}/> 답변</button></section>}
      </article>
     )}
    </section>
   </>
  }
  {error&&<p className="host-error" role="alert">{error}</p>}
  {notice&&<p className="host-notice" role="status">{notice}</p>}
  <p className="host-note">관리자 접근 키는 브라우저에 저장하지 않으며 서버에서만 확인합니다.</p>
 </main>;
}
