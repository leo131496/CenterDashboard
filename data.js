/* All records in this file are deterministic fictional demo data. No live tenant data. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.DemoData=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const TODAY='2026-10-23', DAY=86400000;
  const date=n=>new Date(n).toISOString().slice(0,10);
  const addDays=(d,n)=>date(Date.parse(d+'T00:00:00Z')+n*DAY);
  const daysBetween=(a,b)=>Math.round((Date.parse(b+'T00:00:00Z')-Date.parse(a+'T00:00:00Z'))/DAY);
  const pct=(a,b)=>b?Math.round(a/b*1000)/10:0;
  const sum=(xs,key)=>xs.reduce((n,x)=>n+(typeof key==='function'?key(x):Number(x[key])||0),0);
  const unique=xs=>[...new Set(xs)];
  function random(seed=131496){let s=seed;return()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};}
  const rand=random(),int=(a,b)=>Math.floor(rand()*(b-a+1))+a,pick=a=>a[int(0,a.length-1)];
  const regions=['华东','华南','华北','华中','西南','西北'];
  const departments=['销售与渠道部','产品与技术部','市场与品牌部','客户服务部','培训与发展部'];
  const dealerRoles=['企业负责人','销售顾问','设计顾问','安装工程师'];
  const employeeRoles=['区域经理','产品专员','市场专员','客户顾问','培训讲师'];
  const companyNames=['上海启程地材','杭州致远空间','广州和盛地材','深圳博雅空间','北京弘远地材','天津嘉禾空间','武汉新境地材','长沙尚品空间','成都汇美地材','重庆悦境空间','西安华辰地材','兰州和创空间'];
  const organizations=regions.flatMap((region,i)=>[0,1].map(j=>({id:'ORG'+(i*2+j+1),name:companyNames[i*2+j]+'（示例）',region,kind:'dealer',partnerType:j?'区域合作伙伴':'核心合作伙伴',owner:['陈经理','林经理','周经理','李经理','王经理','徐经理'][i]}))).concat([{id:'MLK',name:'美利肯中国（示例）',region:'全国',kind:'internal'}]);
  const courses=[
    ['Terra 泰拉产品培训','产品系列','录播','必修',45],['Gentle Touch 触感产品培训','产品系列','录播','必修',40],['2026 安装标准与施工规范','安装培训','录播','必修',60],['Screenplay 艺境屏风','产品系列','录播','选修',36],['On the Tracks 轨迹','产品系列','录播','选修',42],['美利肯品牌与可持续发展','品牌知识','图文','必修',20],['Air Born 气流产品培训','产品系列','录播','选修',35],['设计师沟通与方案演示','销售技能','直播','选修',55],['Warp & Weft 缇薇雅集','产品系列','录播','选修',38],['产品应用与日常维护','安装培训','图文','必修',25],['Symmetry 衡系列新品分享','产品系列','直播','选修',50],['经销商服务与客户体验','销售技能','图文','直接分配',30]
  ].map((a,i)=>({id:'C'+(i+1),name:a[0],category:a[1],type:a[2],required:a[3],minutes:a[4],enabled:i!==11,created:addDays('2026-06-01',i*9),examId:'E'+(i+1)}));
  const exams=courses.map((c,i)=>({id:c.examId,name:c.name+'认证考试',courseId:c.id,category:c.category,questionCount:20,passScore:60,enabled:c.enabled,source:['手动添加','题库添加','模板导入'][i%3]}));
  const users=Array.from({length:360},(_,i)=>{const org=organizations[i%12],employee=Math.floor(i/12)%6===0,department=employee?departments[(Math.floor(i/72)+i)%5]:null,jobRole=employee?employeeRoles[(Math.floor(i/72)+i)%5]:dealerRoles[(Math.floor(i/12)+i)%4];return{id:'U'+String(i+1).padStart(4,'0'),name:pick(['林','陈','张','王','刘','李','赵','周','徐','吴'])+pick(['晓','明','子','雨','思','一','嘉','晨'])+pick(['宁','远','辰','怡','宇','安','颖','然']),orgId:employee?'MLK':org.id,region:org.region,identity:employee?'员工':'经销商',department,jobRole,employeeNumber:employee?'M'+String(i+1).padStart(5,'0'):null,province:['上海','广东','北京','湖北','四川','陕西'][Math.floor(i%12/2)],manager:employee?'部门负责人（示例）':org.owner,registered:i<230?addDays('2026-04-01',int(0,90)):addDays('2026-07-01',int(0,114)),openingCredits:int(0,24)*10,openingGrowth:int(0,80)*10};});
  const enrollments=[],attempts=[],events=[],ledger=[],knowledge=[],submissions=[],changes=[],agreements=[];
  let eventId=0;
  const event=(uid,type,d,objectId,minutes=0,extra={})=>{if(objectId?.startsWith('K')&&d<addDays('2026-06-01',(Number(objectId.slice(1))-1)*5))return;events.push({id:'EV'+(++eventId),userId:uid,type,date:d,objectId,minutes,...extra});};
  users.forEach((u,ui)=>{
    for(let ci=0;ci<courses.length;ci++){
      if(rand()>.53)continue;
      const c=courses[ci],assigned=addDays(u.registered>c.created?u.registered:c.created,int(0,65));
      if(assigned>TODAY)continue;
      const started=rand()>.16?addDays(assigned,int(0,12)):null;
      const finish=started&&rand()>.24?addDays(started,int(1,18)):null;
      const completed=finish&&finish<=TODAY?finish:null;
      const progress=completed?100:started&&started<=TODAY?int(10,88):0;
      const en={id:'EN'+enrollments.length,userId:u.id,courseId:c.id,assigned,due:addDays(assigned,30),started:started&&started<=TODAY?started:null,completed,progress};
      enrollments.push(en);
      if(en.started){event(u.id,'learn',en.started,c.id,Math.round(c.minutes*.3));const last=completed||addDays(en.started,3);if(last<=TODAY)event(u.id,'learn',last,c.id,Math.round(c.minutes*(completed?.7:.25)));}
      if(completed){ledger.push({id:'L'+ledger.length,userId:u.id,date:completed,type:'课程完成',creditDelta:10,growthDelta:20,objectId:c.id});if(rand()>.14){let first=addDays(completed,int(0,5));if(first<=TODAY){const score=int(ci===2?35:47,100);attempts.push({id:'A'+attempts.length,userId:u.id,examId:c.examId,date:first,score,attempt:1,wrong:Math.round((100-score)/5)});if(score<60&&rand()>.3){const second=addDays(first,int(1,7));if(second<=TODAY)attempts.push({id:'A'+attempts.length,userId:u.id,examId:c.examId,date:second,score:int(62,100),attempt:2,wrong:int(0,5)});}}}}
    }
    // Engagement events, independent of course assignment cohorts.
    for(let n=0;n<24;n++){
      const d=addDays(u.registered>'2026-07-01'?u.registered:'2026-07-01',int(0,114));if(d>TODAY)continue;
      event(u.id,'login',d,null);
      if(rand()>.2)event(u.id,'read',d,'K'+int(1,18));
      if(rand()>.46)event(u.id,'search',d,null,0,{keyword:pick(['安装规范','环保认证','泰拉','地毯维护','产品参数','声学表现','色彩搭配','胶黏剂','碳中和','阻燃性能']),results:rand()>.12?int(1,15):0});
      if(rand()>.75)event(u.id,'comment',d,'K'+int(1,18));
      if(rand()>.8)event(u.id,'favorite',d,'K'+int(1,18));
    }
  });
  const knowledgeNames=['方块地毯施工前的地面处理','Terra 系列产品参数指南','LEED 认证与环保材料选型','地毯清洁与日常维护手册','声学空间的产品应用建议','办公空间色彩搭配案例','胶黏剂使用与施工注意事项','碳中和产品常见问题','酒店空间的产品选择','产品防火性能知识','Gentle Touch 应用案例','旧地毯回收与循环利用','拼接方向与安装效果','大面积铺装验收标准','新品样册与规格速查','客户异议与产品解答','经销商服务经验分享','可持续设计项目实践'];
  knowledgeNames.forEach((name,i)=>knowledge.push({id:'K'+(i+1),name,category:['安装培训','产品系列','品牌知识','销售技能'][i%4],format:['PDF','视频','Word','图片','PPT','音频'][i%6],enabled:i!==16,created:addDays('2026-06-01',i*5)}));
  for(let i=0;i<146;i++){
    const u=pick(users),submitted=addDays(u.registered>'2026-07-01'?u.registered:'2026-07-01',int(0,114));if(submitted>TODAY)continue;
    const s={id:'S'+(i+1),userId:u.id,name:knowledgeNames[i%18]+' · 投稿'+String(i+1).padStart(3,'0'),submitted,reviewed:rand()>.14?addDays(submitted,int(1,5)):null,result:rand()>.16?'通过':'驳回',format:['音频','图片','PDF','Word','PPT','视频'][i%6],parseResult:i%13===0?'失败':'成功',parsed:addDays(submitted,i%7===0?2:0),draft:i%11===0,agreementId:i<80?'AG1':'AG2'};
    submissions.push(s);
    if(!s.draft&&s.reviewed&&s.reviewed<=TODAY&&s.result==='通过')ledger.push({id:'L'+ledger.length,userId:u.id,date:s.reviewed,type:'知识贡献',creditDelta:5,growthDelta:10,objectId:s.id});
    if(i%4===0)changes.push({id:'LOG'+i,userId:u.id,date:addDays(submitted,1),name:s.name,field:i%8===0?'知识正文':'知识标题',before:'修改前的示例内容',after:'完善后的示例内容',operator:'内容运营员（示例）'});
  }
  // First passing attempt awards credits once per user/exam; retakes never duplicate the award.
  const awarded=new Set();attempts.sort((a,b)=>a.date.localeCompare(b.date)).forEach(a=>{if(a.score>=60&&!awarded.has(a.userId+'|'+a.examId)){awarded.add(a.userId+'|'+a.examId);ledger.push({id:'L'+ledger.length,userId:a.userId,date:a.date,type:'考试通过',creditDelta:20,growthDelta:30,objectId:a.examId});}});
  users.forEach((u,i)=>{const demoteDate=addDays('2026-09-15',i%38);const lastLearn=events.filter(e=>e.userId===u.id&&e.type==='learn'&&e.date<=demoteDate).map(e=>e.date).sort().at(-1)||u.registered;if(i%8===0&&u.registered<=demoteDate&&daysBetween(lastLearn,demoteDate)>=14)ledger.push({id:'L'+ledger.length,userId:u.id,date:demoteDate,type:'等级降级',creditDelta:0,growthDelta:-50,objectId:null});});
  agreements.push({id:'AG1',name:'知识内容上传协议 V1.0',created:'2026-06-01',end:'2026-09-15'},{id:'AG2',name:'知识内容上传协议 V1.1',created:'2026-09-15',end:null});
  const questionBank=Array.from({length:96},(_,i)=>({id:'Q'+(i+1),name:['安装前基层含水率应满足什么要求？','如何选择适合的产品铺装方向？','美利肯产品环保认证的适用范围？','地毯日常维护应避免哪种方式？','该系列产品的标准规格是什么？','客户应用场景应如何匹配产品？'][i%6],courseId:courses[i%12].id,type:['单选','多选','判断'][i%3],source:['手动添加','题库添加','模板导入'][i%3]}));
  function scopedUsers(f){return users.filter(u=>u.registered<=f.end&&(f.region==='all'||u.region===f.region)&&(f.organization==='all'||u.orgId===f.organization)&&(f.identity==='all'||u.identity===f.identity)&&(!f.department||f.department==='all'||u.department===f.department)&&(!f.jobRole||f.jobRole==='all'||u.jobRole===f.jobRole));}
  function analyze(f){
    const members=scopedUsers(f),ids=new Set(members.map(u=>u.id)),inRange=d=>d>=f.start&&d<=f.end,byScope=x=>ids.has(x.userId),ev=events.filter(x=>byScope(x)&&inRange(x.date));
    const cohort=enrollments.filter(x=>byScope(x)&&inRange(x.assigned));
    const history=enrollments.filter(x=>byScope(x)&&x.assigned<=f.end);
    const att=attempts.filter(x=>byScope(x)&&inRange(x.date));
    const allAtt=attempts.filter(x=>byScope(x)&&x.date<=f.end);
    const led=ledger.filter(x=>byScope(x)&&inRange(x.date));
    const active=unique(ev.map(x=>x.userId).concat(att.map(x=>x.userId),led.map(x=>x.userId)));
    const started=cohort.filter(e=>e.started&&e.started<=f.end),finished=cohort.filter(e=>e.completed&&e.completed<=f.end);
    const pairKey=a=>a.userId+'|'+a.examId;
    const cohortAttempt=allAtt.filter(a=>cohort.some(e=>e.userId===a.userId&&courses.find(c=>c.id===e.courseId).examId===a.examId));
    const attemptedPairs=unique(cohortAttempt.map(pairKey)),passedPairs=unique(cohortAttempt.filter(a=>a.score>=60).map(pairKey));
    const firstAttempts=attemptedPairs.map(k=>cohortAttempt.filter(a=>pairKey(a)===k).sort((a,b)=>a.date.localeCompare(b.date))[0]);
    const lastAttempts=attemptedPairs.map(k=>cohortAttempt.filter(a=>pairKey(a)===k).sort((a,b)=>b.date.localeCompare(a.date))[0]);
    const scopedSubs=submissions.filter(x=>byScope(x)&&x.submitted<=f.end),periodSubs=scopedSubs.filter(s=>inRange(s.submitted));
    const submissionStatus=s=>s.draft?'草稿':s.reviewed&&s.reviewed<=f.end?s.result:'待审核';
    const parseStatus=s=>s.parsed>f.end?'识别中':s.parseResult;
    const audits=scopedSubs.filter(s=>!s.draft&&submissionStatus(s)==='待审核');
    const courseRows=courses.filter(c=>c.created<=f.end).map(c=>{const rows=cohort.filter(e=>e.courseId===c.id),done=rows.filter(e=>e.completed&&e.completed<=f.end),stu=rows.filter(e=>e.started&&e.started<=f.end),ca=cohortAttempt.filter(a=>a.examId===c.examId),pairs=unique(ca.map(pairKey)),pass=unique(ca.filter(a=>a.score>=60).map(pairKey));return{...c,assigned:rows.length,started:stu.length,completed:done.length,completion:pct(done.length,rows.length),participants:unique(ev.filter(e=>e.type==='learn'&&e.objectId===c.id).map(e=>e.userId)).length,minutes:sum(ev.filter(e=>e.type==='learn'&&e.objectId===c.id),'minutes'),pass:pct(pass.length,pairs.length),attempted:pairs.length,overdue:rows.filter(e=>e.due<f.end&&(!e.completed||e.completed>f.end)).length,rows};}).sort((a,b)=>b.assigned-a.assigned);
    const knowledgeRows=knowledge.filter(k=>k.created<=f.end).map(k=>{const rows=ev.filter(e=>e.objectId===k.id);return{...k,reads:rows.filter(e=>e.type==='read').length,readers:unique(rows.filter(e=>e.type==='read').map(e=>e.userId)).length,favorites:unique(rows.filter(e=>e.type==='favorite').map(e=>e.userId)).length,comments:rows.filter(e=>e.type==='comment').length,rows};}).sort((a,b)=>b.reads-a.reads);
    const examRows=exams.map(e=>{const course=courseRows.find(c=>c.id===e.courseId),aa=cohortAttempt.filter(a=>a.examId===e.id),pairs=unique(aa.map(pairKey)),latest=pairs.map(k=>aa.filter(a=>pairKey(a)===k).sort((a,b)=>b.date.localeCompare(a.date))[0]),first=pairs.map(k=>aa.filter(a=>pairKey(a)===k).sort((a,b)=>a.date.localeCompare(b.date))[0]);return{...e,assigned:course?.assigned||0,attempted:pairs.length,passed:latest.filter(a=>a.score>=60).length,pass:pct(latest.filter(a=>a.score>=60).length,pairs.length),firstPass:pct(first.filter(a=>a.score>=60).length,pairs.length),retakes:aa.filter(a=>a.attempt>1).length,average:latest.length?Math.round(sum(latest,'score')/latest.length*10)/10:0,pending:(course?.assigned||0)-pairs.length,rows:aa};}).sort((a,b)=>b.attempted-a.attempted);
    const memberRows=members.map(u=>{const historyLed=ledger.filter(l=>l.userId===u.id&&l.date<=f.end),periodLed=led.filter(l=>l.userId===u.id),grow=Math.max(0,u.openingGrowth+sum(historyLed,'growthDelta')),cre=Math.max(0,u.openingCredits+sum(historyLed,'creditDelta')),uh=history.filter(e=>e.userId===u.id),completed=uh.filter(e=>e.completed&&e.completed<=f.end).length,ua=allAtt.filter(a=>a.userId===u.id),passCount=unique(ua.filter(a=>a.score>=60).map(a=>a.examId)).length,contributions=scopedSubs.filter(s=>s.userId===u.id&&!s.draft&&submissionStatus(s)==='通过').length,badges=[completed>=1?'学习启航':null,completed>=3?'学习达人':null,passCount>=3?'认证先锋':null,contributions>=1?'知识分享者':null].filter(Boolean);const last=events.filter(e=>e.userId===u.id&&e.date<=f.end).map(e=>e.date).concat(ua.map(e=>e.date),historyLed.map(e=>e.date)).sort().at(-1)||u.registered;return{...u,org:organizations.find(o=>o.id===u.orgId).name,growth:grow,credits:cre,periodCredits:sum(periodLed,'creditDelta'),periodGrowth:sum(periodLed,'growthDelta'),level:grow>=800?'L4 登峰者':grow>=500?'L3 领航员':grow>=250?'L2 实干家':'L1 启航者',completed,passCount,badges,lastActive:last,inactive:daysBetween(last,f.end)>=14,noLearningDays:daysBetween(events.filter(e=>e.userId===u.id&&e.type==='learn'&&e.date<=f.end).map(e=>e.date).sort().at(-1)||u.registered,f.end),risk:(()=>{const n=daysBetween(events.filter(e=>e.userId===u.id&&e.type==='learn'&&e.date<=f.end).map(e=>e.date).sort().at(-1)||u.registered,f.end);return n>=7&&n<14;})()};}).sort((a,b)=>b.growth-a.growth);
    const orgRows=organizations.filter(o=>(f.region==='all'||o.region===f.region||o.kind==='internal')&&(f.organization==='all'||o.id===f.organization)).map(o=>{const us=memberRows.filter(u=>u.orgId===o.id),uis=new Set(us.map(u=>u.id)),rows=cohort.filter(e=>uis.has(e.userId)),done=rows.filter(e=>e.completed&&e.completed<=f.end),orgActive=active.filter(id=>uis.has(id));return{...o,members:us.length,active:orgActive.length,activeRate:pct(orgActive.length,us.length),assigned:rows.length,completed:done.length,completion:pct(done.length,rows.length),credits:sum(us,'credits'),growth:sum(us,'growth'),periodCredits:sum(us,'periodCredits')};}).sort((a,b)=>b.completion-a.completion);
    const daily=[];for(let d=f.start;d<=f.end;d=addDays(d,1)){const des=ev.filter(e=>e.date===d);daily.push({date:d,active:unique(des.map(e=>e.userId).concat(att.filter(a=>a.date===d).map(a=>a.userId),led.filter(l=>l.date===d).map(l=>l.userId))).length,learners:unique(des.filter(e=>e.type==='learn').map(e=>e.userId)).length,completed:history.filter(e=>e.completed===d).length,reads:des.filter(e=>e.type==='read').length,searches:des.filter(e=>e.type==='search').length,exams:att.filter(a=>a.date===d).length,credits:sum(led.filter(l=>l.date===d),'creditDelta')});}
    const summary={members:members.length,newMembers:members.filter(u=>inRange(u.registered)).length,active:active.length,activeRate:pct(active.length,members.length),enrollments:cohort.length,started:started.length,completed:finished.length,completion:pct(finished.length,cohort.length),minutes:sum(ev.filter(e=>e.type==='learn'),'minutes'),hours:Math.round(sum(ev.filter(e=>e.type==='learn'),'minutes')/60*10)/10,learners:unique(ev.filter(e=>e.type==='learn').map(e=>e.userId)).length,overdue:cohort.filter(e=>e.due<f.end&&(!e.completed||e.completed>f.end)).length,attempted:attemptedPairs.length,passed:passedPairs.length,passRate:pct(passedPairs.length,attemptedPairs.length),firstPass:pct(firstAttempts.filter(a=>a.score>=60).length,firstAttempts.length),average:lastAttempts.length?Math.round(sum(lastAttempts,'score')/lastAttempts.length*10)/10:0,retakes:cohortAttempt.filter(a=>a.attempt>1).length,pendingExam:cohort.length-attemptedPairs.length,reads:ev.filter(e=>e.type==='read').length,readers:unique(ev.filter(e=>e.type==='read').map(e=>e.userId)).length,searches:ev.filter(e=>e.type==='search').length,noResult:ev.filter(e=>e.type==='search'&&e.results===0).length,comments:ev.filter(e=>e.type==='comment').length,favorites:unique(ev.filter(e=>e.type==='favorite').map(e=>e.userId+'|'+e.objectId)).length,submissions:periodSubs.filter(s=>!s.draft).length,drafts:scopedSubs.filter(s=>s.draft).length,waiting:audits.length,lateReviews:audits.filter(s=>daysBetween(s.submitted,f.end)>2).length,approved:periodSubs.filter(s=>!s.draft&&submissionStatus(s)==='通过').length,rejected:periodSubs.filter(s=>!s.draft&&submissionStatus(s)==='驳回').length,parseFailed:periodSubs.filter(s=>!s.draft&&parseStatus(s)==='失败').length,parsePending:periodSubs.filter(s=>!s.draft&&parseStatus(s)==='识别中').length,parseSuccess:periodSubs.filter(s=>!s.draft&&parseStatus(s)==='成功').length,credits:sum(led,'creditDelta'),growth:sum(led,'growthDelta'),downgrades:led.filter(l=>l.type==='等级降级').length,badgeHolders:memberRows.filter(u=>u.badges.length).length,badges:sum(memberRows,u=>u.badges.length),inactive:memberRows.filter(u=>u.inactive).length,risk:memberRows.filter(u=>u.risk).length};
    const keywords=unique(ev.filter(e=>e.type==='search').map(e=>e.keyword)).map(keyword=>({keyword,count:ev.filter(e=>e.type==='search'&&e.keyword===keyword).length,empty:ev.filter(e=>e.type==='search'&&e.keyword===keyword&&e.results===0).length})).sort((a,b)=>b.count-a.count);
    return{filters:{...f},summary,courseRows,knowledgeRows,examRows,memberRows,orgRows,daily,events:ev,cohort,history,attempts:att,cohortAttempts:cohortAttempt,ledger:led,submissions:periodSubs,allSubmissions:scopedSubs,audits,keywords,submissionStatus,parseStatus,changes:changes.filter(l=>byScope(l)&&inRange(l.date)),agreements:agreements.filter(a=>a.created<=f.end)};
  }
  function previousFilters(f){const n=daysBetween(f.start,f.end)+1;return{...f,start:addDays(f.start,-n),end:addDays(f.start,-1)};}
  return{TODAY,regions,departments,dealerRoles,employeeRoles,organizations,courses,exams,users,enrollments,attempts,events,ledger,knowledge,submissions,changes,agreements,questionBank,analyze,previousFilters,addDays,daysBetween,pct,sum,unique};
});
