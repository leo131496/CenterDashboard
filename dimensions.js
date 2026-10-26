/* Audience and organization rollups. Every value derives from the filtered facts. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./data.js'));else root.Perspectives=factory(root.DemoData);})(typeof globalThis!=='undefined'?globalThis:this,function(D){
  'use strict';
  const round=n=>Math.round(n*10)/10;
  function latest(rows){const map=new Map();for(const r of rows){const key=r.userId+'|'+r.examId;if(!map.has(key)||r.date>=map.get(key).date)map.set(key,r);}return [...map.values()];}
  function build(model){
    const active=new Set(model.events.map(e=>e.userId).concat(model.attempts.map(e=>e.userId),model.ledger.map(e=>e.userId)));
    const categories=D.unique(D.courses.map(c=>c.category));
    const people=model.memberRows.map(u=>{
      const tasks=model.cohort.filter(e=>e.userId===u.id),done=tasks.filter(e=>e.completed&&e.completed<=model.filters.end),attempts=latest(model.cohortAttempts.filter(e=>e.userId===u.id)),passed=attempts.filter(e=>e.score>=60),ev=model.events.filter(e=>e.userId===u.id),minutes=D.sum(ev.filter(e=>e.type==='learn'),'minutes'),required=tasks.filter(e=>D.courses.find(c=>c.id===e.courseId).required==='必修'),requiredDone=required.filter(e=>e.completed&&e.completed<=model.filters.end);
      return {...u,active:active.has(u.id),assigned:tasks.length,finished:done.length,completion:D.pct(done.length,tasks.length),attempted:attempts.length,passed:passed.length,passRate:D.pct(passed.length,attempts.length),minutes,hours:round(minutes/60),required:required.length,requiredDone:requiredDone.length,requiredRate:D.pct(requiredDone.length,required.length),reads:ev.filter(e=>e.type==='read').length,comments:ev.filter(e=>e.type==='comment').length,contributions:model.submissions.filter(s=>s.userId===u.id&&!s.draft&&model.submissionStatus(s)==='通过').length,category:u.identity==='员工'?u.salesRegion:u.org,tasks,competencies:categories.map(category=>{const ts=tasks.filter(e=>D.courses.find(c=>c.id===e.courseId).category===category);return{category,assigned:ts.length,completed:ts.filter(e=>e.completed&&e.completed<=model.filters.end).length};})};
    });
    function aggregate(rows){
      const value=key=>D.sum(rows,key),tasks=rows.flatMap(p=>p.tasks),learners=rows.filter(p=>p.minutes>0).length;
      return{members:rows.length,active:rows.filter(p=>p.active).length,activeRate:D.pct(rows.filter(p=>p.active).length,rows.length),learners,coverage:D.pct(learners,rows.length),assigned:value('assigned'),finished:value('finished'),completion:D.pct(value('finished'),value('assigned')),attempted:value('attempted'),passed:value('passed'),passRate:D.pct(value('passed'),value('attempted')),required:value('required'),requiredDone:value('requiredDone'),requiredRate:D.pct(value('requiredDone'),value('required')),minutes:value('minutes'),hours:round(value('minutes')/60),avgHours:rows.length?round(value('minutes')/60/rows.length):0,credits:value('periodCredits'),avgGrowth:rows.length?Math.round(value('growth')/rows.length):0,growth:value('growth'),inactive:rows.filter(p=>p.inactive).length,risk:rows.filter(p=>p.risk).length,contributions:value('contributions'),badgeHolders:rows.filter(p=>p.badges.length).length,companyCount:new Set(rows.filter(p=>p.identity==='经销商').map(p=>p.orgId)).size,people:rows,tasks,competencies:categories.map(category=>{const cs=rows.flatMap(p=>p.competencies).filter(c=>c.category===category);return{category,assigned:D.sum(cs,'assigned'),completed:D.sum(cs,'completed'),rate:D.pct(D.sum(cs,'completed'),D.sum(cs,'assigned'))};})};
    }
    const dealers=people.filter(p=>p.identity==='经销商'),employees=people.filter(p=>p.identity==='员工');
    const group=(values,key,rows)=>values.map(name=>({id:name,name,...aggregate(rows.filter(p=>p[key]===name))})).filter(r=>r.members>0);
    const companies=D.organizations.filter(o=>o.kind==='dealer').map(o=>({...o,...aggregate(dealers.filter(p=>p.orgId===o.id))})).filter(o=>o.members).sort((a,b)=>b.completion-a.completion);
    const salesRegions=group(D.salesRegions,'salesRegion',employees).sort((a,b)=>b.requiredRate-a.requiredRate);
    return{people,dealers,employees,companies,salesRegions,categories,aggregate,all:aggregate(people),dealer:aggregate(dealers),employee:aggregate(employees)};
  }
  return{build,latest};
});
