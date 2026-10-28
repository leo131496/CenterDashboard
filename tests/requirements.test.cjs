const test=require('node:test'),assert=require('node:assert/strict');
const D=require('../data.js'),P=require('../dimensions.js'),C=require('../chart-data.js'),R=require('../requirements.js');
const f={start:'2026-10-01',end:'2026-10-23',organization:'all',identity:'all',salesRegion:'all',userId:'all'};
test('metric dictionary covers every numeric summary and audience aggregate, including distinct time meanings',()=>{
 const model=D.analyze(f),aggregate=P.build(model).all;
 for(const [key,value]of Object.entries({...model.summary,...aggregate}))if(typeof value==='number')assert(R.findMetric(key),'Missing metric '+key);
 assert.notEqual(R.findMetric('growth').basis,R.findMetric('growthBalance').basis);
 assert.notEqual(R.findMetric('completed').basis,R.findMetric('dailyCompleted').basis);
 assert.notEqual(R.findMetric('waiting').basis,R.findMetric('reviewPending').basis);
 assert.equal(new Set(R.metrics.map(m=>m.id)).size,R.metrics.length);
 for(const m of R.metrics){for(const field of ['name','unit','basis','source','formula','rule'])assert(m[field]?.length>0,`${m.id}.${field}`);const c=R.comparison(m);assert(c.mom&&c.yoy);}
});
test('all actual charts and nine routes have requirements and resolvable metric references',()=>{
 assert.deepEqual(R.chartRules.map(c=>c.id).sort(),Object.keys(C.catalog).sort());
 for(const chart of R.chartRules){assert.equal(chart.name,C.catalog[chart.id].title);assert(R.pages.some(([id])=>id===chart.page));for(const id of chart.metrics)assert(R.findMetric(id));}
 for(const [page]of R.pages)assert(R.features.some(f=>f.page===page));
 assert(R.features.some(f=>f.page==='common'));for(const feature of R.features)assert(feature.rule&&feature.acceptance);
});
test('comparison periods use inclusive equal days for MoM and calendar-year alignment for YoY',()=>{
 assert.deepEqual(R.periods(f),{current:{start:'2026-10-01',end:'2026-10-23'},mom:{start:'2026-09-08',end:'2026-09-30'},yoy:{start:'2025-10-01',end:'2025-10-23'}});
 const leap=R.periods({...f,start:'2024-02-29',end:'2024-03-01'});assert.deepEqual(leap.yoy,{start:'2023-02-28',end:'2023-03-01'});assert.deepEqual(leap.mom,{start:'2024-02-27',end:'2024-02-28'});
 assert.equal(R.previousYearDate('2025-03-31'),'2024-03-31');
});
test('incomplete periods and zero rate denominators cannot create comparison percentages',()=>{
 assert(R.available(R.periods(f).current));assert(!R.available(R.periods(f).yoy));assert(!R.available({start:'2026-03-31',end:'2026-04-23'}));
 assert(R.comparable(f,'members',{members:1},{members:0}));
 assert(!R.comparable(f,'passRate',{attempted:1},{attempted:0}));assert(!R.comparable(f,'completion',{enrollments:0},{enrollments:1}));
 assert(R.comparable(f,'completion',{assigned:5},{assigned:1}));
 assert(!R.comparable({...f,start:'2026-04-10',end:'2026-04-23'},'members',{members:1},{members:1}));
 assert(!R.comparable({...f,start:'2026-01-01'},'members',{members:1},{members:1}));
});
test('comparison formatting distinguishes relative growth, percentage points, zero and negative baseline',()=>{
 assert.equal(R.change(120,100),'↑ 20%');assert.equal(R.change(0,100),'↓ 100%');assert.equal(R.change(60,50,'rate'),'↑ 10个百分点');
 assert.equal(R.change(60,0,'rate'),'↑ 60个百分点');assert.equal(R.change(10,0),'新增（基期为0）');assert.equal(R.change(0,0),'持平');assert.equal(R.change(-10,0),'减少（基期为0）');
 assert.match(R.change(10,-20),/净变化 \+30.*基期为负/);assert.equal(R.change(10,5,'number',false),'暂无可比数据');
 assert.match(R.comparison(R.findMetric('examConfig')).yoy,/不计算同比/);assert.match(R.comparison(R.findMetric('homepagePlanned')).mom,/未接入/);
});
