"use client";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useScroll, useSpring } from "framer-motion";
import { ArrowDown, ArrowUpRight, CalendarDays, Check, Clock3, Guitar, MapPin, MessageCircle, Music2, Send, Sparkles, Users, X, PartyPopper, QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

const songs = [
  ["좋다","데이브레이크"],["This Love","Maroon 5"],["Pretender","Official髭男dism"],
  ["No Pain","실리카겔"],["서울의 달","김건모"],["Can't Take My Eyes Off You","Frankie Valli"],
  ["Dive","Olivia Dean"],["She","잔나비"],["Yours","데이먼스 이어"],["있잖아","아이유"],["비밀번호 486","윤하"]
];
const groups = [
  ["GUITAR","기타","🎸",["승호","혜린","시진"]],
  ["DRUMS","드럼","🥁",["혜유","동욱","도헌"]],
  ["KEYBOARD","키보드","🎹",["지민","지호","유진","다니엘"]],
  ["BASS","베이스","🎸",["준수(임)","준수(신)","혜선"]],
  ["VOCAL","보컬","🎤",["규홍","우성","상후","민상","성준","혜인","수연"]]
];
const reactions = [["🔥","불타오르자"],["👏","박수"],["💛","하트"],["🎸","기타"],["🐈","고양이"],["✨","반짝"]];
const randomName = () => ["리듬타는","야광","신나는","새벽","앵콜","기타치는"][Math.floor(Math.random()*6)]+" 관객 "+Math.floor(100+Math.random()*900);

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
  return <div className="countdown">{(time||[0,0,0,0]).map((v,i)=><div key={i}><b>{String(v).padStart(2,"0")}</b><small>{["DAYS","HOURS","MINS","SECS"][i]}</small></div>)}</div>;
}
function Cat({className=""}) {
  return <div className={"cat-wrap "+className}><img src="/images/guitar-cat.webp" alt="헤드폰을 쓰고 기타를 연주하는 오렌지색 고양이" onError={e=>{e.currentTarget.style.display="none";if(e.currentTarget.nextElementSibling)e.currentTarget.nextElementSibling.style.display="block";}}/><span className="cat-fallback">🐈🎸</span><i>✳</i><b>✦</b></div>;
}

export default function Home() {
  const [nickname,setNickname]=useState("");
  const [draft,setDraft]=useState("");
  const [welcome,setWelcome]=useState(false);
  const [ready,setReady]=useState(false);
  const [checked,setChecked]=useState(false);
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
  const [siteUrl,setSiteUrl]=useState("https://your-project.vercel.app");
  const {scrollYProgress}=useScroll();
  const progress=useSpring(scrollYProgress,{stiffness:100,damping:30,restDelta:.001});

  useEffect(()=>{
    const saved=localStorage.getItem("band-night-name");
    if(saved)setNickname(saved);
    else{const n=randomName();setNickname(n);setDraft(n);setWelcome(true);}
    setSiteUrl(location.origin);
    fetch("/api/status").then(r=>r.json()).then(d=>{setReady(!!d.configured);setChecked(true);}).catch(()=>setChecked(true));
    fetch("/api/cheers").then(r=>r.ok?r.json():null).then(d=>{if(d){setCheers(d.items||[]);setCheerCount(d.total||0);}}).catch(()=>{});
    fetch("/api/rsvp").then(r=>r.ok?r.json():null).then(d=>{if(d?.summary)setSummary(d.summary);}).catch(()=>{});
    const refresh = () => { fetch("/api/cheers").then(r=>r.ok?r.json():null).then(d=>{if(d){setCheers(d.items||[]);setCheerCount(d.total||0);}}).catch(()=>{}); fetch("/api/rsvp").then(r=>r.ok?r.json():null).then(d=>{if(d?.summary)setSummary(d.summary);}).catch(()=>{}); };
    const poll = window.setInterval(refresh, 7000);
    return () => window.clearInterval(poll);
  },[]);

  const saveName=e=>{e.preventDefault();const n=draft.trim().slice(0,14)||randomName();localStorage.setItem("band-night-name",n);setNickname(n);setWelcome(false);};
  const cheer=async emoji=>{
    const id=Date.now()+"-"+Math.random();
    setFloating(a=>[...a,{id,emoji,x:15+Math.random()*70}]);
    setTimeout(()=>setFloating(a=>a.filter(v=>v.id!==id)),1900);
    setCheerCount(n=>n+1);setCheers(a=>[{id,nickname,emoji},...a].slice(0,8));
    if(ready){try{const r=await fetch("/api/cheers",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({nickname,emoji})});if(!r.ok)throw Error();}catch{setReady(false);}}
  };
  const ask=async e=>{
    e.preventDefault();if(!question.trim())return;
    if(!ready){setQuestionInfo("질문함 서버가 아직 연결되지 않았어요. Supabase 연결 후 전송할 수 있어요.");return;}
    setQuestionInfo("전송 중...");
    try{const r=await fetch("/api/questions",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({body:question.trim()})});const d=await r.json();if(!r.ok)throw Error(d.error);setQuestion("");setQuestionInfo("승호에게 익명으로 전달했어요. 공연 중 확인할게요!");}
    catch(e){setQuestionInfo(e.message||"전송에 실패했어요.");}
  };
  const rsvp=async e=>{
    e.preventDefault();if(!ready){setRsvpInfo("응답 서버가 아직 연결되지 않았어요.");return;}
    const visitorId=localStorage.getItem("band-night-visitor")||crypto.randomUUID();localStorage.setItem("band-night-visitor",visitorId);setRsvpInfo("저장 중...");
    try{const r=await fetch("/api/rsvp",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({visitorId,nickname,attendance,headcount:attendance==="yes"?Number(people):0,message:afterMessage.trim()})});const d=await r.json();if(!r.ok)throw Error(d.error);setRsvpInfo("참석 응답을 저장했어요. 고마워요!");if(d.summary)setSummary(d.summary);}
    catch(e){setRsvpInfo(e.message||"저장에 실패했어요.");}
  };
  const dayLabel=useMemo(()=>"2026. 11. 21 (SAT)",[]);

  return <main className="shell">
    <motion.div className="progress" style={{scaleX:progress}}/>
    <nav className="nav"><a className="logo" href="#top">B<span>/</span>N</a><div><a href="#about">ABOUT</a><a href="#setlist">SETLIST</a><a href="#members">MEMBERS</a><a href="#cheer">CHEER</a></div><a className="nav-cta" href="#rsvp">JOIN US ↗</a></nav>

    <section className="hero" id="top">
      <div className="hero-grain"/>
      <div className="hero-overline"><span>ONE NIGHT, ONE BAND</span><span>LOCATION / TO BE ANNOUNCED</span></div>
      <div className="hero-title">
        <p className="eyebrow"><i/> LIVE PERFORMANCE INVITATION</p>
        <motion.h1 initial={{opacity:0,y:35}} animate={{opacity:1,y:0}} transition={{duration:1,ease:[.22,1,.36,1]}}>BAND<br/><em>NIGHT</em><sup>26</sup></motion.h1>
        <motion.p className="hero-sub" initial={{opacity:0,y:15}} animate={{opacity:1,y:0}} transition={{delay:.35}}>우리들의 무대, 우리의 플레이리스트. <span>{dayLabel}</span></motion.p>
      </div>
      <motion.div className="stage" initial={{opacity:0,scale:.92,y:20}} animate={{opacity:1,scale:1,y:0}} transition={{delay:.2,duration:.9}}>
        <div className="stage-halo"/>
        <div className="video-window">{!videoError?<video src="/media/concert-cat.mp4" autoPlay muted loop playsInline preload="metadata" onError={()=>setVideoError(true)} aria-label="기타를 연주하는 고양이 영상"/>:<Cat/>}<div className="video-copy"><span>THE BAND IS WARMING UP</span><b>♪ PLAY IT LOUD ♪</b></div></div>
        <span className="sticker sticker-a">NO<br/>BAD<br/>VIBES</span><span className="sticker sticker-b">11.21<br/><b>SAT</b></span><small>A LITTLE LOUD, A LOT OF LOVE.</small>
      </motion.div>
      <div className="hero-bottom"><div className="hero-day"><b>21</b><span>NOVEMBER<br/>SATURDAY, 2026</span></div><a href="#about">SCROLL TO EXPLORE <ArrowDown size={15}/></a><div className="hero-hours"><b>18:00 — 21:00</b><span>OUR STAGE 18:00 — 19:30</span></div></div>
    </section>

    <section className="section intro" id="about">
      <div className="kicker"><span>01 / THE INVITATION</span><span>COME AS YOU ARE</span></div>
      <div className="intro-grid">
        <Reveal><p className="eyebrow orange">DEAR MUSIC LOVERS,</p><h2>좋아하는 음악으로<br/><em>한 장면</em>을 만들어요.</h2><p className="body-copy">익숙한 멜로디부터 마음을 흔드는 한 곡까지.<br/>각자의 악기와 목소리로 준비한 90분을 함께 나눠요.<br/>우리가 무대 위에서 신나게 놀 수 있도록<br/>여러분은 가장 큰 목소리로 함께해 주세요.</p><p className="signature">SEE YOU IN THE CROWD <b>✳</b></p></Reveal>
        <Reveal className="cat-stage" delay={.12}><div className="orbit one"/><div className="orbit two"/><Cat className="intro-cat"/><span className="cat-label">OUR LITTLE<br/>ROCK STAR</span></Reveal>
      </div>
      <div className="count-panel"><div><small>COUNTDOWN TO THE FIRST NOTE</small><b>THE MOMENT IS COMING.</b></div><Countdown/></div>
    </section>

    <section className="section setlist" id="setlist">
      <div className="kicker inverse"><span>02 / THE PLAYLIST</span><span>11 TRACKS, 90 MINUTES</span></div>
      <div className="set-head"><Reveal><p className="eyebrow">♫ THE SETLIST</p><h2>PRESS<br/><em>PLAY.</em></h2></Reveal><Reveal className="set-aside" delay={.1}><b>01 — 11</b><p>함께 따라 부를 준비됐나요?<br/>우리의 플레이리스트를 공개합니다.</p><div className="eq"><i/><i/><i/><i/><i/><i/><i/></div></Reveal></div>
      <div className="songs">{songs.map(([song,artist],i)=><motion.div className="song" key={song} initial={{opacity:0,x:-20}} whileInView={{opacity:1,x:0}} viewport={{once:true,amount:.4}} transition={{delay:Math.min(i*.035,.28),duration:.5}}><span>{String(i+1).padStart(2,"0")}</span><b>{song}</b><small>{artist}</small><i>↗</i></motion.div>)}</div>
      <p className="song-note">* 공연 순서는 현장 상황에 따라 조금 달라질 수 있어요.</p>
    </section>

    <section className="section schedule">
      <div className="kicker"><span>03 / THE SCHEDULE</span><span>MARK YOUR CALENDAR</span></div>
      <div className="schedule-head"><h2>THE NIGHT<br/><em>IN A NUTSHELL.</em></h2><div className="calendar"><CalendarDays/><b>21</b><span>NOV / SAT</span><small>2026</small></div></div>
      <div className="timeline">
        <div className="time-row active"><b>18:00</b><i/><div><small>THE MAIN SHOW</small><h3>우리 밴드 공연 시작!</h3><p>오늘의 주인공, 우리들의 90분.</p></div><span>90 MIN</span></div>
        <div className="time-row"><b>19:30</b><i/><div><small>NEXT CHAPTER</small><h3>밴드 공연 종료</h3><p>이후 프로그램은 추후 안내할게요.</p></div><span>—</span></div>
        <div className="time-row"><b>21:00</b><i/><div><small>THAT'S A WRAP</small><h3>전체 행사 마무리</h3><p>아쉬움은 뒤풀이에서 이어가요.</p></div><span>END</span></div>
      </div>
      <div className="venue"><div><MapPin/></div><section><small>VENUE / LOCATION</small><b>목동 제이에스아트홀</b><p>서울 양천구 등촌로 36 지하 1층 (목동)</p><a href="https://map.naver.com/p/search/목동%20제이에스아트홀" target="_blank" rel="noreferrer">네이버 지도에서 위치 확인 ↗</a></section><span>SEE YOU THERE</span></div>
    </section>

    <section className="section members" id="members">
      <div className="kicker"><span>04 / THE PEOPLE</span><span>THE SOUND OF US</span></div>
      <div className="members-head"><h2>MEET THE<br/><em>NOISE MAKERS.</em></h2><p>각자의 자리에서 같은 방향을 바라보는<br/>우리 밴드의 멤버들을 소개합니다.</p></div>
      <div className="member-grid">{groups.map(([role,label,emoji,names],i)=><Reveal className={"member-card member-"+i} key={role} delay={i*.06}><div className="member-top"><span>{role}</span><span>{String(names.length).padStart(2,"0")}</span></div><strong>{emoji}</strong><h3>{label}</h3><div>{names.map(n=><span key={n}>{n}</span>)}</div><i/></Reveal>)}</div>
      <div className="miss"><span>✈️</span><div><small>WE MISS YOU</small><b>다은</b><p>미국 출장으로 함께하지 못해요. 마음만은 무대 앞 1열!</p></div><strong>NEXT<br/>TIME ♡</strong></div>
    </section>

    <section className="section cheers" id="cheer">
      <div className="kicker inverse"><span>05 / SEND SOME LOVE</span><span>MAKE SOME NOISE</span></div>
      <div className="cheer-grid"><Reveal><p className="eyebrow">✦ CROWD PARTICIPATION</p><h2>YOUR ENERGY<br/>IS OUR <em>AMPLIFIER.</em></h2><p className="body-copy">버튼을 누르고 응원을 보내주세요.<br/>여러분의 리액션이 무대를 더 뜨겁게 만들어요!</p></Reveal>
      <Reveal className="cheer-box" delay={.12}><div className="cheer-count"><b>{cheerCount.toLocaleString("ko-KR")}</b><small>CHEERS & COUNTING</small></div><div className="reaction-grid">{reactions.map(([emoji,label])=><button key={emoji} onClick={()=>cheer(emoji)}><b>{emoji}</b><small>{label}</small></button>)}</div><div className="cheer-wall"><div><span>LIVE CHEER WALL</span><b><i/> LIVE</b></div><section>{cheers.slice(0,6).map((c,i)=><span key={c.id||i}>{c.emoji} <small>{c.nickname}</small></span>)}{!cheers.length&&<small>첫 번째 응원을 남겨주세요!</small>}</section></div></Reveal></div>
      <AnimatePresence>{floating.map(f=><motion.span className="float-emoji" key={f.id} style={{left:f.x+"%"}} initial={{opacity:0,y:25,scale:.4}} animate={{opacity:[0,1,1,0],y:-260,scale:[.5,1.4,1],rotate:18}} exit={{opacity:0}} transition={{duration:1.8}}>{f.emoji}</motion.span>)}</AnimatePresence>
    </section>

    <section className="section questions">
      <div className="kicker"><span>06 / ASK THE GUITAR GUY</span><span>ANONYMOUS Q&A</span></div>
      <div className="question-grid"><div><p className="eyebrow orange">◉ SECRET MESSAGE</p><h2>궁금한 건<br/><em>승호에게.</em></h2><p className="body-copy">공연 중간중간 확인할게요.<br/>하고 싶은 말이나 질문을 익명으로 보내주세요.<br/>닉네임은 표시하지 않아도 되고,<br/>질문은 운영자 승호만 확인할 수 있어요.</p><div className="lock-note">🔒 질문은 승호만 확인할 수 있어요.</div></div>
      <Reveal className="question-card" delay={.1}><div className="form-top"><span>MESSAGE TO SEUNGHO</span><span>NO NAME REQUIRED</span></div><div className="anon">☏ <span>ANONYMOUS</span></div><form onSubmit={ask}><label htmlFor="question">보내고 싶은 메시지</label><textarea id="question" value={question} onChange={e=>setQuestion(e.target.value)} maxLength={500} placeholder="예: 다음 곡은 어떤 곡인가요? 기타 솔로 기대할게요!" required/><div className="form-actions"><small>{question.length} / 500</small><button disabled={!question.trim()}> <Send size={14}/> 메시지 보내기</button></div></form>{questionInfo&&<p className="feedback">{questionInfo}</p>}</Reveal></div>
    </section>

    <section className="section after" id="rsvp">
      <div className="kicker inverse"><span>07 / AFTER PARTY</span><span>LET'S KEEP IT GOING</span></div>
      <div className="after-grid"><div><p className="eyebrow">✦ ONE MORE ROUND?</p><h2>AFTER THE<br/>LAST <em>SONG.</em></h2><p className="body-copy">무대가 끝나도 우리의 밤은 끝나지 않아요.<br/>뒤풀이에 함께할 수 있는지 알려주세요!</p><div className="stats"><div><b>{summary.yes}</b><small>COMING</small></div><div><b>{summary.maybe}</b><small>UNSURE</small></div><div><b>{summary.no}</b><small>CAN'T MAKE IT</small></div></div></div>
      <Reveal className="rsvp-card" delay={.1}><div className="form-top"><span>AFTER PARTY RSVP</span><span>01 / 01</span></div><h3>뒤풀이에 참석하시나요?</h3><div className="choices">{[["yes","🙌","참석할게요"],["maybe","🤔","아직 모르겠어요"],["no","🥲","아쉽지만 불참"]].map(([v,em,t])=><button type="button" key={v} className={attendance===v?"chosen":""} onClick={()=>setAttendance(v)}><span>{em}</span>{t}{attendance===v&&<Check size={15}/>}</button>)}</div>{attendance==="yes"&&<label className="guest-number">참석 인원<select value={people} onChange={e=>setPeople(e.target.value)}>{[1,2,3,4,5,6].map(n=><option key={n}>{n}</option>)}</select></label>}<label className="message-label" htmlFor="after-message">남기고 싶은 말 <small>선택</small></label><input id="after-message" value={afterMessage} onChange={e=>setAfterMessage(e.target.value)} maxLength={100} placeholder="예: 늦게 합류할게요!"/><button className="send-rsvp" onClick={rsvp}>참석 여부 보내기 <ArrowUpRight size={16}/></button>{rsvpInfo&&<p className="feedback">{rsvpInfo}</p>}<small className="privacy">응답은 인원 파악을 위해서만 사용해요.</small></Reveal></div>
    </section>

    <section className="section qr-section"><Reveal className="qr-card"><div><p className="eyebrow orange">▦ SAVE & SHARE</p><h2>SEE YOU<br/><em>THERE.</em></h2><p>이 페이지를 친구에게 공유하고<br/>공연 당일 QR로 바로 접속하세요.</p><small>{siteUrl}</small></div><div className="qr-code"><QRCodeSVG value={siteUrl} size={150} bgColor="#f6f0e7" fgColor="#191715" level="H"/><small>SCAN TO JOIN THE NIGHT</small></div></Reveal><Reveal className="last-cat"><Cat/><span>DON'T FORGET TO ROCK.</span></Reveal></section>

    <footer><div className="footer-top"><a className="logo" href="#top">B<span>/</span>N</a><p>MADE WITH MUSIC, FRIENDSHIP<br/>AND A LITTLE BIT OF NOISE.</p><a href="#top">BACK TO TOP ↑</a></div><div className="footer-bottom"><span>© 2026 BAND NIGHT</span><span>11.21 SAT / 18:00 — 21:00</span><a href="/host">HOST ACCESS ↗</a></div></footer>
    <div className="sticky-rsvp"><a href="#rsvp">뒤풀이 참석 여부 보내기 ↗</a></div>

    <AnimatePresence>{welcome&&<motion.div className="welcome-bg" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><motion.div className="welcome" initial={{opacity:0,y:25,scale:.96}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:15}}><button className="close" onClick={()=>setWelcome(false)}><X/></button><div className="welcome-cat">🐈🎸</div><p className="eyebrow orange">WELCOME TO BAND NIGHT</p><h2>반가워요!<br/><em>어떻게 불러드릴까요?</em></h2><p>닉네임을 정해 주세요. 비워두면 랜덤 닉네임으로 입장해요.</p><form onSubmit={saveName}><input autoFocus maxLength={14} value={draft} onChange={e=>setDraft(e.target.value)} placeholder="닉네임 (최대 14자)"/><button>입장하기 ↗</button></form><small>닉네임은 이 기기에 저장돼요.</small></motion.div></motion.div>}</AnimatePresence>
    {nickname&&<button className="nickname" onClick={()=>{setDraft(nickname);setWelcome(true);}}>👋 {nickname}</button>}
    {checked&&!ready&&<div className="preview"><i/> PREVIEW MODE <span>공유 기능은 Supabase 연결 후 활성화돼요.</span></div>}
  </main>;
}
