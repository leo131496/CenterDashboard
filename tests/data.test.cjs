const {test}=require('node:test');
const assert=require('node:assert/strict');
const D=require('../data.js');
const filters={start:'2026-10-01',end:D.TODAY,region:'all',organization:'all',identity:'all'};
const a=D.analyze(filters);

test('课程及考试漏斗使用同一任务批次，分子逐层递减',()=>{
  const s=a.summary;
  assert(s.enrollments>=s.started&&s.started>=s.completed&&s.completed>=s.attempted&&s.attempted>=s.passed);
  assert.equal(s.completed,D.sum(a.courseRows,'completed'));
  assert.equal(s.enrollments,D.sum(a.courseRows,'assigned'));
  assert.equal(s.attempted,D.sum(a.examRows,'attempted'));
  assert.equal(s.passed,D.sum(a.examRows,'passed'));
  assert.equal(s.completion,D.pct(s.completed,s.enrollments));
  assert.equal(s.passRate,D.pct(s.passed,s.attempted));
});
test('考试重考不重复奖励，不扩大参考人数分母',()=>{
  const awards=D.ledger.filter(l=>l.type==='考试通过');
  assert.equal(awards.length,new Set(awards.map(l=>l.userId+'|'+l.objectId)).size);
  const pairs=new Set(a.cohortAttempts.map(e=>e.userId+'|'+e.examId));
  assert.equal(a.summary.attempted,pairs.size);
  assert(a.cohortAttempts.length>=pairs.size);
  assert(a.summary.firstPass<=a.summary.passRate);
});
test('日期筛选不泄露未来成绩、等级或审核结果',()=>{
  const f={...filters,start:'2026-07-01',end:'2026-07-15'};
  const b=D.analyze(f);
  assert(b.events.every(e=>e.date>=f.start&&e.date<=f.end));
  assert(b.memberRows.every(u=>u.registered<=f.end&&u.lastActive<=f.end));
  assert(b.cohortAttempts.every(e=>e.date<=f.end));
  b.allSubmissions.filter(s=>s.reviewed>f.end&&!s.draft).forEach(s=>assert.equal(b.submissionStatus(s),'待审核'));
  b.memberRows.forEach(u=>assert.equal(u.credits,u.openingCredits+D.sum(D.ledger.filter(l=>l.userId===u.id&&l.date<=f.end),'creditDelta')));
});
test('企业、区域、身份同时筛选，所有事实记录属于筛选人群',()=>{
  const b=D.analyze({...filters,region:'华东',organization:'ORG1',identity:'经销商'});
  assert(b.memberRows.length>0);
  assert(b.memberRows.every(u=>u.region==='华东'&&u.orgId==='ORG1'&&u.identity==='经销商'));
  const ids=new Set(b.memberRows.map(u=>u.id));
  for(const list of [b.events,b.cohort,b.ledger,b.attempts,b.allSubmissions])assert(list.every(x=>ids.has(x.userId)));
  assert.equal(b.orgRows.length,1);
});
test('无匹配人群与零分母返回有效零值',()=>{
  const b=D.analyze({...filters,region:'华东',organization:'ORG12'});
  assert.equal(b.summary.members,0);
  for(const value of Object.values(b.summary))assert(Number.isFinite(value));
  assert.equal(b.summary.completion,0);assert.equal(b.summary.passRate,0);assert.equal(b.summary.active,0);
});
test('知识与学习每日趋势和汇总可核对',()=>{
  assert.equal(a.summary.reads,D.sum(a.daily,'reads'));
  assert.equal(a.summary.reads,D.sum(a.knowledgeRows,'reads'));
  assert.equal(a.summary.searches,D.sum(a.daily,'searches'));
  assert.equal(a.summary.credits,D.sum(a.daily,'credits'));
  assert.equal(a.summary.minutes,D.sum(a.courseRows,'minutes'));
});
test('模拟行为不得发生在学员注册或知识创建之前',()=>{
  const byId=new Map(D.users.map(u=>[u.id,u]));
  const knowledgeById=new Map(D.knowledge.map(k=>[k.id,k]));
  D.events.forEach(e=>{
    assert(e.date>=byId.get(e.userId).registered);
    assert(e.date<=D.TODAY);
    if(e.objectId?.startsWith('K'))assert(e.date>=knowledgeById.get(e.objectId).created);
  });
});
test('投稿、审核、解析的批次分区不重复不遗漏',()=>{
  const s=a.summary;
  const cohort=a.submissions.filter(s=>!s.draft);
  assert.equal(s.submissions,cohort.length);
  assert.equal(s.submissions,s.approved+s.rejected+cohort.filter(s=>a.submissionStatus(s)==='待审核').length);
  assert.equal(s.submissions,s.parseSuccess+s.parseFailed+s.parsePending);
  assert(s.lateReviews<=s.waiting);
});
test('环比为相邻等长区间且不重叠',()=>{
  const f=D.previousFilters(filters);
  assert.equal(D.daysBetween(f.start,f.end),D.daysBetween(filters.start,filters.end));
  assert.equal(f.end,D.addDays(filters.start,-1));
});
test('等级、勋章与企业汇总对应当前人群快照',()=>{
  assert.equal(a.summary.members,D.sum(a.orgRows,'members'));
  assert.equal(a.summary.badgeHolders,a.memberRows.filter(u=>u.badges.length).length);
  assert.equal(a.summary.inactive,a.memberRows.filter(u=>u.inactive).length);
  assert.equal(a.summary.risk,a.memberRows.filter(u=>u.noLearningDays>=7&&u.noLearningDays<14).length);
  assert(a.memberRows.every(u=>/L[1-4]/.test(u.level)));
});
