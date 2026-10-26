/* Each chart derives its own result from the shared facts and effective scope. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./data.js'),require('./dimensions.js'));else root.ChartAnalytics=factory(root.DemoData,root.Perspectives);})(typeof globalThis!=='undefined'?globalThis:this,function(D,P){
 'use strict';
 const categories=D.unique(D.courses.map(c=>c.category));
 const colors=['#d97751','#2e8076','#809aa5','#b4a083','#83916b','#a8b8cd'];
 const catalog={
  'overview-activity':{title:'学习参与趋势',kind:'trend',subtitle:'每日活跃人数与课程学习人数 · 同一学员每天去重'},
  'overview-companies':{title:'渠道公司 · 学习表现',kind:'ranking',subtitle:'按本期任务完成率排序，展示前6家公司',identity:'经销商',course:true,drill:'company'},
  'overview-departments':{title:'内部人才 · 部门表现',kind:'ranking',subtitle:'按本期必修任务达成率排序',identity:'员工',course:true,drill:'department'},
  'dealer-themes':{title:'学习主题完成情况',kind:'ranking',subtitle:'按课程分类查看经销商学员的任务完成进度',identity:'经销商',course:true},
  'company-themes':{title:'公司 × 学习主题',kind:'matrix',subtitle:'按任务完成率排序前6家公司，显示完成 / 分配任务数',identity:'经销商',course:true},
  'company-ranking':{title:'渠道公司完成率排行',kind:'ranking',subtitle:'按任务完成率排序，点击公司查看团队',identity:'经销商',course:true,drill:'company'},
  'employee-themes':{title:'部门 × 学习主题',kind:'matrix',subtitle:'本期任务完成率；部门归属独立于经销商组织',identity:'员工',course:true},
  'employee-required':{title:'部门必修任务达成',kind:'ranking',subtitle:'本期必修完成数 / 分配数，点击查看部门人员',identity:'员工',course:true,drill:'department'},
  'employee-roles':{title:'员工岗位学习覆盖',kind:'ranking',subtitle:'本期有课程学习行为人数 / 员工岗位总人数',identity:'员工',course:true},
  'course-trend':{title:'学习与完成趋势',kind:'trend',subtitle:'学习人数每天去重；完成量包含本期完成的历史任务',course:true},
  'course-types':{title:'修读类型分布',kind:'distribution',subtitle:'本期新分配任务的修读类型构成',course:true},
  'course-popularity':{title:'课程分类热度',kind:'ranking',subtitle:'各分类下课程学习人数之和，跨课程不去重',course:true,count:true},
  'course-todo':{title:'学习待办',kind:'distribution',subtitle:'本期新分配任务，截至期末的学习状态',course:true},
  'knowledge-trend':{title:'知识使用趋势',kind:'trend',subtitle:'阅读与检索按发生次数统计'},
  'knowledge-keywords':{title:'热门检索关键词',kind:'ranking',subtitle:'按搜索次数排序，展示前6项；可筛选关键词',keyword:true,count:true},
  'knowledge-formats':{title:'投稿附件类型',kind:'ranking',subtitle:'本期提交非草稿投稿的主要附件类型',format:true,count:true},
  'exam-scores':{title:'考试成绩分布',kind:'distribution',subtitle:'本期分配任务，每位学员每份试卷取期末最新成绩',course:true},
  'exam-firstpass':{title:'首次通过率关注课程',kind:'ranking',subtitle:'首次通过率较低的课程优先显示；同时展示参考样本量',course:true},
  'exam-status':{title:'考试状态分布',kind:'distribution',subtitle:'本期分配任务对应的学员 × 试卷；已参考按最新成绩划分',course:true},
  'growth-levels':{title:'学员等级分布',kind:'distribution',subtitle:'截至单图期末的等级快照，阈值采用演示规则'},
  'growth-sources':{title:'学分来源构成',kind:'ranking',subtitle:'单图日期内按业务来源汇总学分，成长值单独记账',count:true},
  'growth-badges':{title:'勋章激励覆盖',kind:'ranking',subtitle:'截至单图期末的获章人数；不同勋章之间不去重',count:true},
  'governance-review':{title:'内容审核进度',kind:'distribution',subtitle:'本期提交的非草稿投稿，跟踪截至单图期末的审核结果',format:true},
  'governance-parse':{title:'附件识别情况',kind:'distribution',subtitle:'本期非草稿投稿的主要附件识别结果',format:true}
 };
 function effective(global,local={},definition={}){
  const f={...global};
  f.start=local.start&&local.start>global.start?local.start:global.start;
  f.end=local.end&&local.end<global.end?local.end:global.end;
  for(const key of ['organization','identity','department'])if(local[key]&&local[key]!=='all'&&(!global[key]||global[key]==='all'))f[key]=local[key];
  if(definition.identity&&global.identity==='all')f.identity=definition.identity;
  if(definition.course){f.courseCategory=local.courseCategory||'all';f.courseId=local.courseId||'all';}
  return f;
 }
 function validate(global,local,definition={}){
  if(local.start&&!/^\d{4}-\d{2}-\d{2}$/.test(local.start)||local.end&&!/^\d{4}-\d{2}-\d{2}$/.test(local.end))return '请选择有效的开始和结束日期。';
  const start=local.start||global.start,end=local.end||global.end;
  if(start>end)return '单图开始日期不能晚于结束日期。';
  if(start<global.start||end>global.end)return '单图日期须在顶部全局日期范围内。';
  if(local.identity&&local.identity!=='all'&&global.identity!=='all'&&local.identity!==global.identity)return '单图身份须符合当前全局身份范围。';
  if(definition.identity&&local.identity&&local.identity!=='all'&&local.identity!==definition.identity)return '此图仅统计'+definition.identity+'。';
  if(local.organization&&local.organization!=='all'&&global.organization!=='all'&&local.organization!==global.organization)return '单图企业须符合当前全局企业范围。';
  const orgId=global.organization!=='all'?global.organization:local.organization;
  const org=D.organizations.find(o=>o.id===orgId),identity=global.identity!=='all'?global.identity:definition.identity||local.identity;
  if(org&&identity&&identity!=='all'&&(org.kind==='dealer'?'经销商':'员工')!==identity)return '所选企业与学员身份不匹配，请调整条件。';
  if(definition.course&&local.courseId&&local.courseId!=='all'&&local.courseCategory&&local.courseCategory!=='all'&&D.courses.find(c=>c.id===local.courseId)?.category!==local.courseCategory)return '所选课程与课程分类不匹配。';
  return '';
 }
 function build(key,global,local={}){
  const definition=catalog[key];if(!definition)throw new Error('Unknown chart: '+key);
  const filters=effective(global,local,definition),m=D.analyze(filters),p=P.build(m),s=m.summary;
  const out={key,...definition,filters,model:m,perspectives:p,rows:[],series:[],label:'',suffix:definition.count?'':'%',max:definition.count?0:100};
  const distribution=(rows,label)=>Object.assign(out,{rows,label,suffix:'',max:0});
  const trend=(series)=>Object.assign(out,{rows:m.daily,series,suffix:'',max:0});
  const rank=(rows,metric='completion')=>{out.rows=rows.map(r=>({...r,value:r[metric],sample:metric==='requiredRate'?`${r.requiredDone} / ${r.required} 项必修`:metric==='coverage'?`${r.learners} / ${r.members} 人学习`:`${r.finished} / ${r.assigned} 项任务`}));};
  const submissions=m.submissions.filter(r=>!r.draft&&(!local.format||local.format==='all'||r.format===local.format));
  switch(key){
   case 'overview-activity':trend([{key:'active',name:'活跃学员',color:colors[0]},{key:'learners',name:'课程学习人数',color:colors[1]}]);break;
   case 'overview-companies':case 'company-ranking':rank(p.companies.slice(0,6));break;
   case 'overview-departments':case 'employee-required':rank(p.departments,'requiredRate');break;
   case 'dealer-themes':out.rows=p.dealer.competencies.filter(c=>!local.courseCategory||local.courseCategory==='all'||c.category===local.courseCategory).map(c=>({name:c.category,value:c.rate,sample:`${c.completed} / ${c.assigned} 项任务`,noSample:!c.assigned}));break;
   case 'company-themes':case 'employee-themes':out.rows=(key==='company-themes'?p.companies.slice(0,6):p.departments);out.categories=categories.filter(c=>!local.courseCategory||local.courseCategory==='all'||c===local.courseCategory);break;
   case 'employee-roles':rank(p.roles,'coverage');break;
   case 'course-trend':trend([{key:'learners',name:'学习人数',color:colors[0]},{key:'completed',name:'完成人次',color:colors[1]}]);break;
   case 'course-types':distribution(['必修','选修','直接分配'].map(name=>({name,value:D.sum(m.courseRows.filter(c=>c.required===name),'assigned')})),'分配总人次');break;
   case 'course-popularity':out.rows=categories.filter(c=>!local.courseCategory||local.courseCategory==='all'||c===local.courseCategory).map(name=>({name,value:D.sum(m.courseRows.filter(c=>c.category===name),'participants')}));break;
   case 'course-todo':distribution([{name:'已完成',value:s.completed},{name:'学习中',value:s.started-s.completed},{name:'未开始',value:s.enrollments-s.started}],'课程任务');break;
   case 'knowledge-trend':trend([{key:'reads',name:'知识阅读',color:colors[0]},{key:'searches',name:'知识检索',color:colors[1]}]);break;
   case 'knowledge-keywords':out.rows=m.keywords.filter(r=>!local.keyword||r.keyword.toLowerCase().includes(local.keyword.toLowerCase().trim())).slice(0,6).map(r=>({name:r.keyword,value:r.count,sample:`零结果 ${r.empty} 次`}));break;
   case 'knowledge-formats':out.rows=['音频','图片','PDF','Word','PPT','视频'].filter(f=>!local.format||local.format==='all'||f===local.format).map(format=>({name:format,value:submissions.filter(s=>s.format===format).length}));break;
   case 'exam-scores':{const latest=P.latest(m.cohortAttempts);distribution([{name:'90–100分',value:latest.filter(a=>a.score>=90).length},{name:'80–89分',value:latest.filter(a=>a.score>=80&&a.score<90).length},{name:'60–79分',value:latest.filter(a=>a.score>=60&&a.score<80).length},{name:'60分以下',value:latest.filter(a=>a.score<60).length}],'有效答卷');break;}
   case 'exam-firstpass':out.rows=m.examRows.filter(e=>e.attempted).sort((a,b)=>a.firstPass-b.firstPass).slice(0,5).map(e=>({id:e.id,name:e.name.replace('认证考试',''),value:e.firstPass,sample:`${e.attempted} 人次参考`}));break;
   case 'exam-status':distribution([{name:'已通过',value:s.passed},{name:'未通过',value:s.attempted-s.passed},{name:'待考试',value:s.pendingExam}],'本期分配人次');break;
   case 'growth-levels':distribution(['L1 启航者','L2 实干家','L3 领航员','L4 登峰者'].map(name=>({name,value:m.memberRows.filter(u=>u.level===name).length})),'学员总数');break;
   case 'growth-sources':out.rows=D.unique(m.ledger.map(l=>l.type)).filter(t=>t!=='等级降级').map(name=>({name,value:D.sum(m.ledger.filter(l=>l.type===name),'creditDelta')}));break;
   case 'growth-badges':out.rows=['学习启航','学习达人','认证先锋','知识分享者'].map(name=>({name,value:m.memberRows.filter(u=>u.badges.includes(name)).length}));break;
   case 'governance-review':distribution([{name:'已通过',value:submissions.filter(r=>m.submissionStatus(r)==='通过').length,color:colors[1]},{name:'待审核',value:submissions.filter(r=>m.submissionStatus(r)==='待审核').length,color:colors[0]},{name:'已驳回',value:submissions.filter(r=>m.submissionStatus(r)==='驳回').length,color:'#d79991'}],'本期投稿');break;
   case 'governance-parse':distribution([{name:'解析成功',value:submissions.filter(r=>m.parseStatus(r)==='成功').length,color:colors[1]},{name:'识别中',value:submissions.filter(r=>m.parseStatus(r)==='识别中').length,color:colors[2]},{name:'解析失败',value:submissions.filter(r=>m.parseStatus(r)==='失败').length,color:'#d79991'}],'解析任务');break;
  }
  return out;
 }
 function exportData(chart){
  if(chart.kind==='trend')return{columns:[['日期','date'],...chart.series.map(s=>[s.name,s.key])],rows:chart.rows};
  if(chart.kind==='matrix')return{columns:[['组织','name'],['课程分类','category'],['已完成任务','completed'],['分配任务','assigned'],['完成率%','rate']],rows:chart.rows.flatMap(r=>r.competencies.filter(c=>chart.categories.includes(c.category)).map(c=>({name:r.name,category:c.category,completed:c.completed,assigned:c.assigned,rate:c.rate})))};
  return{columns:[['分类','name'],[chart.suffix?'数值%':'数值','value'],['样本说明','sample']],rows:chart.rows.map(r=>({name:r.name,value:r.value,sample:r.sample||''}))};
 }
 return{catalog,categories,colors,effective,validate,build,exportData};
});
