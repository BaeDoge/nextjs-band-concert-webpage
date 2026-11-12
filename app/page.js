"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useScroll, useSpring } from "framer-motion";
import { ArrowDown, ArrowUpRight, CalendarDays, Check, MapPin, MessageCircle, Music2, Send, X, QrCode, Share2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

const songs = [
  ["좋다","데이브레이크"],["This Love","Maroon 5"],["Pretender","Official髭男dism"],
  ["No Pain","실리카겔"],["서울의 달","김건모"],["Can't Take My Eyes Off You","Frankie Valli"],
  ["Dive","Olivia Dean"],["She","잔나비"],["Yours","데이먼스 이어"],["있잖아","아이유"],["비밀번호 486","윤하"]
];
const groups = [
  ["기타","기타","🎸",["승호","혜린","시진"]],
  ["드럼","드럼","🥁",["혜유","동욱","도헌"]],
  ["키보드","키보드","🎹",["지민","지호","유진","다니엘"]],
  ["베이스","베이스","🎸",["준수(임)","준수(신)","혜선"]],
  ["보컬","보컬","🎤",["규홍","우성","상후","민상","성준","혜인","수연"]],
  ["해외 영업","해외 영업","✈️",["다은"]]
];
const reactions = [["🔥","불타오르자"],["👏","박수"],["💛","하트"],["🎸","기타"],["🐈","고양이"],["✨","반짝"]];
const activityPhotos = [1,2,3,4,5,6].map(n=>`/images/activity/activity-${String(n).padStart(2,"0")}.webp`);
const randomName = () => ["리듬타는","야광","신나는","새벽","앵콜","기타치는"][Math.floor(Math.random()*6)]+" 관객 "+Math.floor(100+Math.random()*900);

function playCheerSound() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(520, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(880, context.currentTime + 0.11);
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.12, context.currentTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.2);
    oscillator.connect(gain); gain.connect(context.destination);
    oscillator.start(); oscillator.stop(context.currentTime + 0.21);
    oscillator.onended = () => context.close();
  } catch {}
}

function Reveal({children,className="",delay=0}) {
  return <motion.div className={className} initial={{opacity:0,y:32,filter:"blur(7px)"}} whileInView={{opacity:1,y:0,filter:"blur(0px)"}} viewport={{once:true,amount:.15}} transition={{duration:.8,delay,ease:[.22,1,.36,1]}}>{children}</motion.div>;
}
function Countdown() {
  const [time,setTime]=useState(null);
  useEffect(()=>{
    const target=new Date("2026-11-21T18:00:00+09:00").getTime();
    const tick=()=>{const d=Math.max(0,target-Date.now());setTime([Math.floor(d/86400000),Math.floor(d%86400000/3600000),Math.floor(d%3600000/60000),Math.floor(d%60000/1000)]);};
    tick();const id=setInterval(tick,1000);return()=>clearInterval(id);
  },[]);
  return <div className="countdown">{(time||[0,0,0,0]).map((v,i)=><div key={i}><b>{String(v).padStart(2,"0")}</b><small>{["일","시간","분","초"][i]}</small></div>)}</div>;
}
function Cat({className=""}) {
  return <div className={"cat-wrap "+className}><img src="/images/guitar-cat.webp" alt="헤드폰을 쓰고 기타를 연주하는 오렌지색 고양이" onError={e=>{e.currentTarget.style.display="none";if(e.currentTarget.nextElementSibling)e.currentTarget.nextElementSibling.style.display="block";}}/><span className="cat-fallback">🐈🎸</span><i>✳</i><b>✦</b></div>;
}

export default function Home() {
  const [nickname,setNickname]=useState("");
  const [visitorId,setVisitorId]=useState("");
  const [draft,setDraft]=useState("");
  const [welcome,setWelcome]=useState(false);
  const [ready,setReady]=useState(false);
  const [checked,setChecked]=useState(false);
  const [setupMessage,setSetupMessage]=useState("");
  const [cheerMessage,setCheerMessage]=useState("");
  const [shareMessage,setShareMessage]=useState("");
  const seenCheerIds=useRef(new Set());
  const [cheers,setCheers]=useState([]);
  const [cheerCount,setCheerCount]=useState(0);
  const [floating,setFloating]=useState([]);
  const [question,setQuestion]=useState("");
  const [questionInfo,setQuestionInfo]=useState("");
  const [attendance,setAttendance]=useState("yes");
  const [people,setPeople]=useState("1");
  const [afterMessage,setAfterMessage]=useState("");
  const [rsvpInfo,setRsvpInfo]=useState("");
  const [summary,setSummary]=useState({yes:0,maybe:0,no:0});
  const [videoError,setVideoError]=useState(false);
  const [overlayMounted,setOverlayMounted]=useState(false);
  const [galleryEnabled,setGalleryEnabled]=useState(true);
  const siteUrl="https://daeil-band.vercel.app";
  const {scrollYProgress}=useScroll();
  const progress=useSpring(scrollYProgress,{stiffness:100,damping:30,restDelta:.001});

  const registerVisitor=async(id,name)=>{
    try{
      const response=await fetch("/api/visitors",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({visitorId:id,nickname:name})});
      const data=await response.json();
      if(!response.ok){setSetupMessage(data.error||"방문자 등록에 실패했어요.");return false;}
      return true;
    }catch{
      setSetupMessage("방문자 등록 서버에 연결할 수 없어요.");
      return false;
    }
  };

  useEffect(()=>{
    setOverlayMounted(true);
    let active=true;
    const saved=localStorage.getItem("band-night-name");
    const initialName=saved||randomName();
    if(saved)setNickname(saved);
    else{setNickname(initialName);setDraft(initialName);setWelcome(true);}
    let id=localStorage.getItem("band-night-visitor");
    if(!id){id=crypto.randomUUID();localStorage.setItem("band-night-visitor",id);}
    setVisitorId(id);
    registerVisitor(id,initialName);

    let initialSnapshotLoaded=false;
    const loadStatus=async()=>{
      try{
        const response=await fetch("/api/status",{cache:"no-store"});
        const data=await response.json();
        if(!active)return;
        setReady(Boolean(data.configured));
        if(data.message)setSetupMessage(data.message);
        setChecked(true);
      }catch{
        if(active){setReady(false);setSetupMessage("서버 상태를 확인하지 못했어요.");setChecked(true);}
      }
    };
    const refreshLive=async()=>{
      if(document.visibilityState!=="visible")return;
      try{
        const response=await fetch("/api/live",{cache:"no-store"});
        if(!response.ok)throw new Error("응원 기록을 불러오지 못했어요.");
        const data=await response.json();
        if(!active)return;
        const items=data.items||[];
        const fresh=initialSnapshotLoaded?items.filter(item=>item.id&&!seenCheerIds.current.has(item.id)):[];
        items.forEach(item=>{if(item.id)seenCheerIds.current.add(item.id);});
        setCheers(items);
        setCheerCount(Number(data.total||0));
        if(fresh.length){
          const effects=fresh.map((item,index)=>({id:item.id,emoji:item.emoji,nickname:item.nickname||"관객",x:8+((index*17+Math.random()*20)%84)}));
          setFloating(current=>[...effects,...current].slice(0,30));
          effects.forEach(item=>window.setTimeout(()=>setFloating(current=>current.filter(value=>value.id!==item.id)),4400));
        }
      }catch{
        if(active&&initialSnapshotLoaded)setCheerMessage("응원 기록을 서버에서 불러오지 못했어요.");
      }
    };
    const loadRsvp=async()=>{
      try{
        const response=await fetch("/api/rsvp",{cache:"no-store"});
        if(!response.ok)return;
        const data=await response.json();
        if(active&&data.summary)setSummary(data.summary);
      }catch{}
    };
    const loadGallerySetting=async()=>{
      try{
        const response=await fetch("/api/gallery",{cache:"no-store"});
        if(!response.ok)return;
        const data=await response.json();
        if(active)setGalleryEnabled(Boolean(data.enabled));
      }catch{}
    };
    loadStatus();
    refreshLive().then(()=>{initialSnapshotLoaded=true;});
    loadRsvp();
    loadGallerySetting();
    const poll=window.setInterval(refreshLive,10000);
    const galleryPoll=window.setInterval(loadGallerySetting,30000);
    return()=>{active=false;window.clearInterval(poll);window.clearInterval(galleryPoll);};
  },[]);

  const saveName=async e=>{
    e.preventDefault();
    const name=draft.trim().slice(0,14)||randomName();
    localStorage.setItem("band-night-name",name);
    setNickname(name);
    setWelcome(false);
    if(visitorId)await registerVisitor(visitorId,name);
  };

  const cheer=async emoji=>{
    playCheerSound();
    if(!ready){setCheerMessage(setupMessage||"응원 저장 서버가 연결되지 않았어요.");return;}
    if(!visitorId){setCheerMessage("방문자 정보를 준비하고 있어요. 잠시 후 다시 눌러 주세요.");return;}
    setCheerMessage("");
    try{
      const response=await fetch("/api/cheers",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({visitorId,emoji})});
      const data=await response.json();
      if(!response.ok)throw new Error(data.error||"응원을 저장하지 못했어요.");
      const item=data.item;
      if(item?.id){
        seenCheerIds.current.add(item.id);
        setCheers(current=>[item,...current.filter(value=>value.id!==item.id)].slice(0,30));
        setFloating(current=>[{id:item.id,emoji:item.emoji,nickname:item.nickname||nickname,x:22+Math.random()*56},...current].slice(0,24));
        window.setTimeout(()=>setFloating(current=>current.filter(value=>value.id!==item.id)),4400);
      }
      setCheerCount(count=>count+1);
    }catch(error){setCheerMessage(error.message||"응원을 저장하지 못했어요.");}
  };

  const sharePage=async()=>{
    const shareData={title:"대일밴드 공연 안내",text:"2026년 11월 21일, 대일밴드 공연에서 만나요!",url:siteUrl};
    try{
      if(navigator.share){await navigator.share(shareData);setShareMessage("공유 메뉴를 열었어요.");}
      else if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(siteUrl);setShareMessage("공연 페이지 주소를 복사했어요.");}
      else setShareMessage(siteUrl);
    }catch(error){if(error.name!=="AbortError")setShareMessage("공유에 실패했어요. QR 코드를 이용해 주세요.");}
  };

  const ask=async e=>{
    e.preventDefault();
    if(!question.trim())return;
    if(!ready){setQuestionInfo(setupMessage||"메시지 전송 서버에 연결할 수 없어요.");return;}
    if(!visitorId){setQuestionInfo("방문자 정보를 준비하고 있어요. 잠시 후 다시 시도해 주세요.");return;}
    setQuestionInfo("전송 중...");
    try{
      const response=await fetch("/api/questions",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({body:question.trim(),visitorId})});
      const data=await response.json();
      if(!response.ok)throw Error(data.error);
      setQuestion("");setQuestionInfo("메시지를 전달했어요. 고마워요!");
    }catch(error){setQuestionInfo(error.message||"전송에 실패했어요.");}
  };

  const rsvp=async e=>{
    e.preventDefault();
    if(!ready){setRsvpInfo(setupMessage||"응답 서버에 연결할 수 없어요.");return;}
    if(!visitorId){setRsvpInfo("방문자 정보를 준비하고 있어요. 잠시 후 다시 시도해 주세요.");return;}
    setRsvpInfo("저장 중...");
    try{
      const response=await fetch("/api/rsvp",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({visitorId,nickname,attendance,headcount:attendance==="yes"?Number(people):0,message:afterMessage.trim()})});
      const data=await response.json();
      if(!response.ok)throw Error(data.error);
      setRsvpInfo("참석 응답을 저장했어요. 고마워요!");
      if(data.summary)setSummary(data.summary);
    }catch(error){setRsvpInfo(error.message||"저장에 실패했어요.");}
  };

  return <><main className="shell">
    <motion.div className="progress" style={{scaleX:progress}}/>
    <nav className="nav"><a className="logo cat-logo" href="#top" aria-label="대일밴드 처음으로"><img src="/images/cat-headphones.svg" alt="대일밴드 고양이 로고"/></a><div><a href="#about">소개</a><a href="#setlist">셋리스트</a><a href="#members">멤버</a><a href="#cheer">응원</a></div><a className="nav-cta" href="#questions">메시지 보내기 ↗</a></nav>

    <section className="hero" id="top">
      <div className="hero-grain"/>
      <div className="hero-title">
        <p className="eyebrow"><i/> DAEIL BAND LIVE</p>
        <motion.h1 initial={{opacity:0,y:35}} animate={{opacity:1,y:0}} transition={{duration:1,ease:[.22,1,.36,1]}}>DAEIL<br/><em>BAND</em></motion.h1>
        <motion.p className="hero-brand-sub" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:.32,duration:.65}}>대일밴드 <span>|</span> Big one Band</motion.p>
      </div>
      <motion.div className="stage" initial={{opacity:0,scale:.92,y:20}} animate={{opacity:1,scale:1,y:0}} transition={{delay:.2,duration:.9}}>
        <div className="stage-halo"/>
        <div className="video-window">{!videoError?<video src="/media/concert-cat.mp4" autoPlay muted loop playsInline preload="metadata" onError={()=>setVideoError(true)} aria-label="기타를 연주하는 고양이 영상"/>:<Cat/>}</div>
      </motion.div>
      <div className="hero-countdown">
        <span>COUNTDOWN TO SHOWTIME</span>
        <Countdown/>
        <small>2026. 11. 21 · SAT · 18:00</small>
      </div>
      <div className="hero-bottom hero-bottom-simple"><a href="#about">SCROLL TO EXPLORE <ArrowDown size={15}/></a></div>
    </section>

    <section className="section intro" id="about">
      <div className="kicker"><span>01 / ABOUT</span><span>OUR STORY</span></div>
      <div className="intro-grid">
        <Reveal><p className="eyebrow orange">대일밴드</p><h2>안녕하세요<br/><em>대일밴드입니다.</em></h2><p className="body-copy">2024년 5명으로 시작해 현재 31명이 함께 활동하고 있는 초보 밴드입니다.<br/>저희가 준비한 노래를 재미있게 즐겨 주셨으면 좋겠습니다.<br/>아낌없는 박수와 호응 부탁드립니다!</p><p className="signature">대일밴드 승호 드림</p></Reveal>
        <Reveal className="cat-stage" delay={.12}><div className="orbit one"/><div className="orbit two"/><Cat className="intro-cat"/><span className="cat-label">대일밴드<br/>마스코트</span></Reveal>
      </div>
      
    </section>

    <section className="section setlist" id="setlist">
      <div className="kicker inverse"><span>02 / SETLIST</span><span>11 SONGS</span></div>
      <div className="set-head"><Reveal><p className="eyebrow">THE PLAYLIST</p><h2>SET<br/><em>LIST.</em></h2></Reveal><Reveal className="set-aside" delay={.1}><b>01 — 11</b><p>대일밴드가 준비한<br/>열한 곡을 들려드립니다.</p><div className="eq"><i/><i/><i/><i/><i/><i/><i/></div></Reveal></div>
      <div className="songs">{songs.map(([song,artist],i)=><motion.div className="song" key={song} initial={{opacity:0,x:-20}} whileInView={{opacity:1,x:0}} viewport={{once:true,amount:.4}} transition={{delay:Math.min(i*.035,.28),duration:.5}}><span>{String(i+1).padStart(2,"0")}</span><b>{song}</b><small>{artist}</small><i>↗</i></motion.div>)}</div>
      <p className="song-note">* 공연 순서는 현장 상황에 따라 조금 달라질 수 있어요.</p>
    </section>

    <section className="section schedule">
      <div className="kicker"><span>03 / SCHEDULE</span><span>SHOW TIMELINE</span></div>
      <div className="schedule-head"><h2>SHOW<br/><em>SCHEDULE.</em></h2><div className="calendar"><CalendarDays/><b>21</b><span>NOV / SAT</span><small>2026</small></div></div>
      <div className="timeline">
        <p className="schedule-seating-note">관객 수에 따라 스탠딩 또는 좌석 운영으로 변경될 수 있습니다.</p>
        <div className="time-row active"><b>18:00</b><i/><div><small>1부</small><h3>대일밴드 공연 시작</h3><p>대일밴드의 첫 번째 무대입니다.</p></div><span>90분</span></div>
        <div className="time-row"><b>19:30</b><i/><div><small>2부</small><h3>2부 공연 시작</h3><p>이어지는 무대도 함께 즐겨주세요.</p></div><span>90분</span></div>
        <div className="time-row"><b>21:00</b><i/><div><small>전체 행사</small><h3>전체 행사 마무리</h3><p>아쉬움은 뒤풀이에서 이어가요.</p></div><span>종료</span></div>
      </div>
      <div className="venue"><div><MapPin/></div><section><small>VENUE</small><b>목동 제이에스아트홀</b><p>서울 양천구 등촌로 36 지하 1층 (목동)</p><div className="venue-links"><a href="https://map.naver.com/p/search/목동%20제이에스아트홀" target="_blank" rel="noreferrer">NAVER MAP ↗</a><a href="https://map.kakao.com/?q=서울%20양천구%20등촌로%2036" target="_blank" rel="noreferrer">KAKAO MAP ↗</a></div></section></div>
      <div className="venue-map-card"><div className="venue-map-heading"><b>FIND US</b><span>목동 제이에스아트홀</span></div><div className="venue-map-frame"><iframe title="목동 제이에스아트홀 위치 지도" src="https://maps.google.com/maps?q=%EC%84%9C%EC%9A%B8%20%EC%96%91%EC%B2%9C%EA%B5%AC%20%EB%93%B1%EC%B4%8C%EB%A1%9C%2036&t=&z=16&ie=UTF8&iwloc=&output=embed" loading="lazy" referrerPolicy="no-referrer-when-downgrade"/></div><div className="venue-map-footer"><span>🚇 목동역 5호선</span><b>도보 약 10분 · 약 0.8km</b></div></div>
    </section>

    <section className="section members" id="members">
      <div className="kicker"><span>04 / MEMBERS</span><span>MEET THE BAND</span></div>
      <div className="members-head"><h2>MEET THE<br/><em>BAND.</em></h2><p>31명의 대일밴드 중<br/>이번 무대를 함께 만드는 멤버들입니다.</p></div>
      <div className="member-grid">{groups.map(([role,label,emoji,names],i)=><Reveal className={"member-card member-"+i} key={role} delay={i*.06}><strong>{emoji}</strong><h3>{label}</h3><div>{names.map(n=><span key={n}>{n}</span>)}</div>{role==="해외 영업"&&<p className="member-note">미국 출장으로 못 오게 되었지만 마음만은 함께!</p>}<i/></Reveal>)}</div>
    </section>

    <section className="section cheers" id="cheer">
      <div className="kicker inverse"><span>05 / CHEER</span><span>SEND SOME LOVE</span></div>
      <div className="cheer-grid"><Reveal><p className="eyebrow">대일밴드에게 보내는 응원</p><h2>응원으로<br/><em>함께해요.</em></h2><p className="body-copy">응원 버튼을 누르면 다른 관객에게도<br/>닉네임과 함께 응원 애니메이션이 보여요.</p></Reveal>
      <Reveal className="cheer-box" delay={.12}><div className="cheer-count"><b>{cheerCount.toLocaleString("ko-KR")}</b><small>누적 응원</small></div><div className="reaction-grid">{reactions.map(([emoji,label])=><button type="button" aria-label={label} key={emoji} onClick={()=>cheer(emoji)}><b>{emoji}</b></button>)}</div><p className="cheer-message" role="status">{cheerMessage}</p><div className="cheer-wall"><div><span>최근 도착한 응원</span><b><i/> 실시간</b></div><section>{cheers.slice(0,10).map((item,i)=><span key={item.id||i}>{item.emoji} <small>{item.nickname||"익명의 관객"}</small></span>)}{!cheers.length&&<small>첫 응원을 남겨주세요.</small>}</section></div></Reveal></div>
    </section>

    <section className="section questions" id="questions">
      <div className="kicker"><span>06 / QUESTIONS</span><span>ASK US ANYTHING</span></div>
      <div className="question-grid"><div><p className="eyebrow orange">QUESTIONS & REQUESTS</p><h2>아무거나<br/><em>물어보세요.</em></h2><p className="body-copy">궁금한 점이나 듣고 싶은 이야기를 편하게 남겨주세요.<br/>공연 중간중간 확인하고 답변할게요.</p></div>
      <Reveal className="question-card" delay={.1}><div className="form-top"><span>MESSAGE BOARD</span><span>DAEIL BAND</span></div><form onSubmit={ask}><textarea id="question" value={question} onChange={e=>setQuestion(e.target.value)} maxLength={500} placeholder="드럼 솔로 보여주세요!" required/><div className="form-actions"><small>{question.length} / 500</small><button disabled={!question.trim()}> <Send size={14}/> 메시지 보내기</button></div></form>{questionInfo&&<p className="feedback">{questionInfo}</p>}</Reveal></div>
    </section>

    <section className="section after" id="rsvp">
      
      <div className="after-grid"><div><p className="eyebrow">AFTER PARTY</p><h2>공연이 끝나면<br/><em>뒤풀이에서.</em></h2><p className="body-copy">무대가 끝나도 우리의 밤은 끝나지 않아요.<br/>뒤풀이에 함께할 수 있는지 알려주세요!</p><div className="stats"><div><b>{summary.yes}</b><small>참석</small></div><div><b>{summary.maybe}</b><small>미정</small></div><div><b>{summary.no}</b><small>불참</small></div></div></div>
      <Reveal className="rsvp-card" delay={.1}><h3>뒤풀이에 참석하시나요?</h3><div className="choices">{[["yes","🙌","참석할게요"],["maybe","🤔","아직 모르겠어요"],["no","🥲","아쉽지만 불참"]].map(([v,em,t])=><button type="button" key={v} className={attendance===v?"chosen":""} onClick={()=>setAttendance(v)}><span>{em}</span>{t}{attendance===v&&<Check size={15}/>}</button>)}</div>{attendance==="yes"&&<label className="guest-number">참석 인원<select value={people} onChange={e=>setPeople(e.target.value)}>{[1,2,3,4,5,6].map(n=><option key={n}>{n}</option>)}</select></label>}<label className="message-label" htmlFor="after-message">남기고 싶은 말</label><input id="after-message" value={afterMessage} onChange={e=>setAfterMessage(e.target.value)} maxLength={100} placeholder="예: 늦게 합류할게요!"/><button className="send-rsvp" onClick={rsvp}>참석 여부 보내기 <ArrowUpRight size={16}/></button>{rsvpInfo&&<p className="feedback">{rsvpInfo}</p>}</Reveal></div>
    </section>

    <section className="section qr-section"><Reveal className="qr-card"><div><p className="eyebrow orange">공연 페이지 공유</p><h2>대일밴드<br/><em>공연에서 만나요.</em></h2><p className="share-invite-copy">친구에게 페이지를 공유하고<br/>공연 당일 함께해 주세요.</p><button type="button" className="share-button" onClick={sharePage}><Share2 size={16}/> 공유하기</button>{shareMessage&&<p className="share-message" role="status">{shareMessage}</p>}</div><div className="qr-code"><QRCodeSVG value={siteUrl} size={150} bgColor="#f6f0e7" fgColor="#191715" level="H"/><small>QR 코드로 접속</small></div></Reveal><Reveal className="last-cat"><Cat/></Reveal></section>

    {galleryEnabled&&<section className="activity-gallery-section" aria-label="대일밴드 활동 사진 모음">
      <Reveal className="activity-gallery" delay={.08}>
        <div className="activity-gallery-heading"><span>DAEIL BAND ARCHIVE</span><b>함께한 순간들</b></div>
        <div className="activity-marquee" onContextMenu={event=>event.preventDefault()} aria-label="대일밴드 활동 사진">
          <div className="activity-marquee-track">
            {activityPhotos.map((src,index)=><img key={"photo-"+index} src={src} alt={`대일밴드 활동 사진 ${index+1}`} loading="lazy" decoding="async" draggable={false} onDragStart={event=>event.preventDefault()}/>)}
            {activityPhotos.map((src,index)=><img key={"photo-copy-"+index} src={src} alt="" aria-hidden="true" loading="lazy" decoding="async" draggable={false} onDragStart={event=>event.preventDefault()}/>)}
          </div>
        </div>
      </Reveal>
    </section>}

    <footer><div className="footer-top"><a className="logo cat-logo" href="#top"><img src="/images/cat-headphones.svg" alt="대일밴드 고양이 로고"/></a><p>대일밴드와 함께해 주셔서 감사합니다.</p><a href="#top">맨 위로 ↑</a></div><div className="footer-bottom"><span>© 2026 DAEIL BAND <i>·</i> 배승호 Bae Seung Ho</span><span>2026.11.21 · 18:00 — 21:00</span></div></footer>
    <div className="sticky-rsvp"><a href="#rsvp">뒤풀이 참석 여부 보내기 ↗</a></div>

    <AnimatePresence>{welcome&&<motion.div className="welcome-bg" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><motion.div className="welcome" initial={{opacity:0,y:25,scale:.96}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:15}}><button className="close" onClick={()=>setWelcome(false)}><X/></button><div className="welcome-cat">🐈🎸</div><p className="eyebrow orange">DAEIL BAND</p><h2>반가워요!<br/><em>어떻게 불러드릴까요?</em></h2><p>닉네임을 정해 주세요. 비워두면 랜덤 닉네임으로 입장해요.</p><form onSubmit={saveName}><input autoFocus maxLength={14} value={draft} onChange={e=>setDraft(e.target.value)} placeholder="닉네임 (최대 14자)"/><button>입장하기 ↗</button></form><small>닉네임은 이 기기에 저장돼요.</small></motion.div></motion.div>}</AnimatePresence>
    {nickname&&<button className="nickname" onClick={()=>{setDraft(nickname);setWelcome(true);}}>👋 {nickname}</button>}
    {checked&&!ready&&<div className="preview"><i/> 연결 확인 필요 <span>{setupMessage||"Supabase 연결과 테이블 설정을 확인해 주세요."}</span></div>}
  </main>
  {overlayMounted&&createPortal(<div className="global-cheer-overlay" aria-live="polite"><AnimatePresence>{floating.map(f=><motion.div className="float-cheer" key={f.id} style={{left:f.x+"%"}} initial={{opacity:0,y:25,scale:.55}} animate={{opacity:[0,1,1,1,0],y:[30,-180,-420,-650],scale:[.55,1.12,1.06,1],rotate:8}} exit={{opacity:0}} transition={{duration:4.4,ease:"easeOut"}}><b>{f.emoji}</b><small>{f.nickname}</small></motion.div>)}</AnimatePresence></div>,document.body)}
  </>;
}
