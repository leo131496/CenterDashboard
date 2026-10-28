const {test}=require('node:test');
const assert=require('node:assert/strict');
const D=require('../data.js'),A=require('../chart-data.js');
const global={start:'2026-10-01',end:D.TODAY,organization:'all',identity:'all',salesRegion:'all'};
const sumRows=c=>D.sum(c.rows,'value');
test('单图日期、公司和身份筛选不修改全局条件或相邻图的数据',()=>{
 const original={...global},neighbor=A.build('exam-status',global),own=A.build('exam-scores',global,{start:'2026-10-08',end:'2026-10-20',organization:'ORG1',identity:'经销商'});
 assert.deepEqual(global,original);assert.deepEqual(A.build('exam-status',global).rows,neighbor.rows);
 assert(own.model.memberRows.every(u=>u.orgId==='ORG1'&&u.identity==='经销商'));
 assert(own.model.cohort.every(e=>e.assigned>='2026-10-08'&&e.assigned<='2026-10-20'));
 assert.equal(sumRows(own),new Set(own.model.cohortAttempts.map(a=>a.userId+'|'+a.examId)).size);
});
test('课程分类与具体课程筛选同时约束学习任务和试卷，分布分区守恒',()=>{
 const own=A.build('exam-status',global,{courseCategory:'产品系列',courseId:'C1'}),m=own.model;
 assert(m.cohort.length>0);assert(m.cohort.every(e=>e.courseId==='C1'));
 assert(m.cohortAttempts.every(a=>a.examId==='E1'));
 assert.equal(sumRows(own),m.cohort.length);assert.equal(own.rows.find(r=>r.name==='已通过').value,m.summary.passed);
 const scores=A.build('exam-scores',global,{courseId:'C1'});assert.equal(sumRows(scores),D.unique(scores.model.cohortAttempts.map(a=>a.userId+'|'+a.examId)).length);
 const types=A.build('course-types',global,{courseCategory:'产品系列'});assert.equal(sumRows(types),types.model.cohort.length);
});
test('单图条件只缩小全局范围，校验拒绝越界日期、身份及企业组合',()=>{
 const fixed={...global,identity:'经销商',organization:'ORG1'};
 assert(A.validate(global,{start:'2026-09-01'}));assert(A.validate(global,{start:'2026-10-20',end:'2026-10-10'}));
 assert(A.validate(fixed,{identity:'员工'}));assert(A.validate(fixed,{organization:'ORG2'}));
 assert(A.validate(global,{organization:'MLK',identity:'经销商'}));
 assert(A.validate({...global,identity:'员工',salesRegion:'华南'},{salesRegion:'西南'}));
 assert(A.validate(global,{identity:'经销商',salesRegion:'华南'}));
 assert(A.validate(global,{identity:'员工',salesRegion:'华东'}));
 assert.equal(A.validate(global,{identity:'员工',salesRegion:'华南'}),'');
 assert(A.validate(global,{courseCategory:'安装培训',courseId:'C1'},A.catalog['exam-scores']));
 const effective=A.effective(fixed,{identity:'员工',organization:'MLK',start:'2026-09-01',end:'2026-11-01'});
 assert.equal(effective.organization,'ORG1');assert.equal(effective.identity,'经销商');assert.equal(effective.start,global.start);assert.equal(effective.end,global.end);
});
test('附件类型、检索词属于各图独立的业务条件',()=>{
 const chart=A.build('governance-review',global,{format:'PDF'});
 const expected=D.submissions.filter(s=>!s.draft&&s.format==='PDF'&&s.submitted>=global.start&&s.submitted<=global.end);
 assert.equal(sumRows(chart),expected.length);
 const parse=A.build('governance-parse',global,{format:'PDF'});assert.equal(sumRows(parse),expected.length);
 const attachments=A.build('knowledge-formats',global,{format:'PDF'});assert.deepEqual(attachments.rows.map(r=>r.name),['PDF']);assert.equal(sumRows(attachments),expected.length);
 const words=A.build('knowledge-keywords',global,{keyword:'安装'});assert(words.rows.length>0);assert(words.rows.every(r=>r.name.includes('安装')));
});
test('单图趋势按日期和人员事实重算，课程筛选不会包含其他课程时长',()=>{
 const chart=A.build('course-trend',global,{courseId:'C1',organization:'ORG1'}),ids=new Set(chart.model.memberRows.map(u=>u.id));
 for(const day of chart.rows){const raw=D.events.filter(e=>ids.has(e.userId)&&e.objectId==='C1'&&e.type==='learn'&&e.date===day.date);assert.equal(day.learners,new Set(raw.map(e=>e.userId)).size);}
 assert(chart.model.events.filter(e=>e.type==='learn').every(e=>e.objectId==='C1'));
});
test('公司和销售区域图的任务与人员下钻继承单图范围，不引入经销商岗位',()=>{
 const chart=A.build('company-ranking',global,{organization:'ORG1',courseCategory:'安装培训'});
 assert.equal(chart.rows.length,1);assert(chart.rows[0].people.every(u=>u.orgId==='ORG1'&&!('jobRole' in u)));
 assert(chart.rows[0].tasks.every(e=>D.courses.find(c=>c.id===e.courseId).category==='安装培训'));
 const region=A.build('employee-required',global,{salesRegion:'华南'});assert.equal(region.rows.length,1);assert(region.rows[0].people.every(u=>u.identity==='员工'&&u.salesRegion==='华南'));
});
test('单图导出保留图内分类、数值和矩阵分子分母，无记录时分布总量为0',()=>{
 const c=A.build('exam-scores',global,{courseId:'C1'}),exported=A.exportData(c);assert.equal(exported.rows.length,4);assert.equal(D.sum(exported.rows,'value'),sumRows(c));
 const heat=A.build('company-themes',global,{organization:'ORG1',courseCategory:'安装培训'}),rows=A.exportData(heat).rows;
 assert(rows.length>0);assert(rows.every(r=>r.category==='安装培训'));assert.equal(D.sum(rows,'assigned'),heat.rows[0].assigned);
 const empty=A.build('exam-scores',{...global,start:'2026-01-01',end:'2026-01-02'});assert.equal(sumRows(empty),0);
});

test('顶部人员条件传递至单图课程与考试分析和导出，清除单图条件也不扩大人员范围',()=>{
 const selected=D.users.find(u=>u.orgId==='ORG1'&&u.identity==='经销商'),scope={...global,identity:'经销商',organization:'ORG1',userId:selected.id};
 for(const local of [{},{courseCategory:'产品系列'},{start:'2026-10-10'}]){
  const chart=A.build('exam-status',scope,local);assert.equal(chart.filters.userId,selected.id);assert.equal(chart.model.summary.members,1);assert(chart.model.cohort.every(e=>e.userId===selected.id));assert.equal(D.sum(A.exportData(chart).rows,'value'),chart.model.summary.enrollments);
 }
 const baseline=A.build('dealer-themes',scope);assert.equal(baseline.model.summary.members,1);assert(baseline.perspectives.people.every(u=>u.id===selected.id));
});
