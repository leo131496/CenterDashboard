/* Readable in-app documentation, using the same catalog as the exported Markdown. */
(()=>{
 'use strict';
 const R=window.DashboardRequirements;
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let context={kind:'requirements',key:null,filters:null,page:'overview'};
 const pageName=id=>R.pages.find(p=>p[0]===id)?.[1]||'全局通用';
 const textMatch=(item,query)=>JSON.stringify(item).toLocaleLowerCase().includes(query.trim().toLocaleLowerCase());
 function metricCard(m,open=false){const c=R.comparison(m);return `<details class="spec-entry metric-entry" data-metric-id="${esc(m.id)}" ${open?'open':''}><summary><span><b>${esc(m.name)}</b><small>${esc(R.groups[m.group])} · ${esc(m.basis)} · ${esc(m.unit)}</small></span><span class="spec-expand">展开</span></summary><div class="spec-entry-body"><dl><dt>数据来源</dt><dd>${esc(m.source)}</dd><dt>取值公式</dt><dd class="spec-formula">${esc(m.formula)}</dd><dt>去重与边界</dt><dd>${esc(m.rule)}</dd><dt>环比规则</dt><dd>${esc(c.mom)}</dd><dt>同比规则</dt><dd>${esc(c.yoy)}</dd></dl></div></details>`;}
 function comparisonBlock(filters){const periods=R.periods(filters);return `<section class="spec-comparison" aria-label="同比与环比规则"><div class="spec-section-heading"><h3>同比与环比：日期和计算规则</h3><span>当前业务卡片展示环比</span></div><div class="spec-periods">${[['本期',periods.current],['环比基期',periods.mom],['同比基期',periods.yoy]].map(([name,p])=>`<div><span>${name}</span><strong>${p.start} — ${p.end}</strong><small>${R.available(p)?'明细区间完整':'明细覆盖不足 · 暂无可比数据'}</small></div>`).join('')}</div><details class="spec-rules"><summary>查看统一计算规则、零分母及缺失数据处理</summary><dl>${R.comparisonRules.map(([name,rule])=>`<dt>${esc(name)}</dt><dd>${esc(rule)}</dd>`).join('')}</dl></details></section>`;}
 function featureCard(f){return `<article class="spec-feature"><header><span>${f.id} · ${esc(pageName(f.page))}</span><h4>${esc(f.name)}</h4></header><dl><dt>需求说明</dt><dd>${esc(f.rule)}</dd><dt>验收要求</dt><dd>${esc(f.acceptance)}</dd></dl></article>`;}
 function chartCard(c){return `<article class="spec-chart"><h4>${esc(c.name)}</h4><p>${esc(c.rule)}</p><div>${c.metrics.map(id=>`<button type="button" class="spec-metric-link" data-action="doc-metric" data-key="${esc(id)}">${esc(R.findMetric(id).name)} ↗</button>`).join('')}</div></article>`;}
 function results(query='',selection='all'){
  if(context.kind==='metrics'){
   const list=R.metrics.filter(m=>(selection==='all'||String(m.group)===selection)&&(!context.key||m.id===R.findMetric(context.key)?.id)&&textMatch(m,query));
   return{count:`${list.length} 项指标 · 每项含取值、环比及同比规则`,html:list.length?`<p class="spec-scope">${esc(R.person)} 比较边界和缺失数据处理以顶部统一规则为准。</p>${list.map(m=>metricCard(m,!!context.key||!!query)).join('')}`:'<div class="spec-empty">没有找到匹配的指标，请调整关键词或分组。</div>'};
  }
  const list=R.features.filter(f=>(selection==='all'||f.page==='common'||f.page===selection)&&textMatch(f,query));
  const charts=R.chartRules.filter(c=>(selection==='all'||c.page===selection)&&textMatch(c,query));
  const sections=[...new Set(list.map(f=>f.section))];
  const html=sections.map(section=>`<section class="spec-feature-group"><h3>${esc(section)}</h3>${list.filter(f=>f.section===section).map(featureCard).join('')}</section>`).join('');
  return{count:`${list.length} 项功能需求 · ${charts.length} 张图表说明`,html:html+(charts.length?`<section class="spec-feature-group"><h3>图表逐项要求</h3><div class="spec-chart-grid">${charts.map(chartCard).join('')}</div></section>`:'')||'<div class="spec-empty">没有找到匹配的功能，请调整关键词或模块。</div>'};
 }
 function render({kind,key=null,filters,page}){context={kind,key,filters,page};const isMetrics=kind==='metrics';const initial=results();return `<div class="spec-document" data-document-kind="${kind}"><div class="spec-intro"><span class="spec-version">业务基线 V${R.baseline} · 说明 V${R.version}</span><p>${isMetrics?'按指标查看来源、公式、去重、时间、边界及同比/环比。所有数值仍为模拟数据，未接入真实业务接口。':'覆盖当前版本九个页面、24张图表，以及筛选、明细、导出、下钻、交互偏好和正式接入边界。每项列出需求与验收要求。'}</p></div><div class="spec-doc-actions"><button class="button" data-action="${isMetrics?'requirements':'definitions'}">${isMetrics?'查看需求说明':'查看指标口径'} ↗</button><button class="button" data-action="export-requirements">下载完整需求与指标说明</button>${key?'<button class="text-button" data-action="definitions">查看全部指标</button>':''}</div>${isMetrics?comparisonBlock(filters):''}<div class="spec-controls"><label><span>搜索${isMetrics?'指标':'需求'}</span><input type="search" id="spec-search" placeholder="${isMetrics?'输入指标名、数据来源或公式':'输入功能名、需求或验收关键词'}" autocomplete="off"></label><label><span>${isMetrics?'指标分组':'功能模块'}</span><select id="spec-selection"><option value="all">全部${isMetrics?'指标':'模块'}</option>${(isMetrics?R.groups.map((name,i)=>[i,name]):R.pages).map(([id,name])=>`<option value="${id}">${esc(name)}</option>`).join('')}</select></label></div><p id="spec-count" class="spec-count" role="status">${initial.count}</p><div id="spec-results">${initial.html}</div></div>`;}
 function update(){const search=document.querySelector('#spec-search'),selection=document.querySelector('#spec-selection');if(!search||!selection)return;context.key=null;const result=results(search.value,selection.value);document.querySelector('#spec-results').innerHTML=result.html;document.querySelector('#spec-count').textContent=result.count;}
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&e.target.closest('.spec-document')){e.preventDefault();document.querySelector('#detail-dialog').close();}});
 document.addEventListener('input',e=>{if(e.target.id==='spec-search')update();});
 document.addEventListener('change',e=>{if(e.target.id==='spec-selection')update();});
 window.RequirementsUI={render,metricCard,comparisonBlock};
})();
