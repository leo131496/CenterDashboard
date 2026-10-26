/* Independent chart controls; preferences stay in this browser, filters in this session. */
(()=>{
 'use strict';
 const A=window.ChartAnalytics,D=window.DemoData,colors=A.colors;
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const fmt=n=>new Intl.NumberFormat('zh-CN',{maximumFractionDigits:1}).format(n||0);
 const typeLabels={donut:'环形图',pie:'饼图',bar:'条形图',column:'柱状图',line:'折线图',area:'面积图',heatmap:'热力图',table:'数据表'};
 const allowed={distribution:['donut','pie','bar','column','table'],ranking:['bar','column','table'],trend:['line','area','column','table'],matrix:['heatmap','table']};
 const storageKey='milliken.chart-types.v1',states=new Map();let global={},types={},onExport,onDrill,notify=()=>{},storageAvailable=true;
 try{const saved=JSON.parse(localStorage.getItem(storageKey)||'{}');if(saved&&typeof saved==='object')for(const key of Object.keys(A.catalog))if(allowed[A.catalog[key].kind].includes(saved[key]))types[key]=saved[key];}catch{storageAvailable=false;}
 const glyph={filter:'M4 5h16l-6 7v6l-4 2v-8Z',reset:'M3 10a9 9 0 1 1 2 8M3 4v6h6',download:'M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5',chart:'M3 3v18h18M7 16V9m5 7V5m5 11v-4',arrow:'M4 12h16m-6-6 6 6-6 6'};
 const icon=name=>`<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="${glyph[name]||glyph.chart}"/></svg>`;
 const value=(r,c)=>r.noSample?'—':fmt(r.value)+(c.suffix||'');
 function get(key){if(!states.has(key))states.set(key,{local:{},draft:null,open:false,error:'',notice:'',link:'',chart:null,signature:''});return states.get(key);}
 function begin(filters){global={...filters};for(const [key,s] of states){const before=JSON.stringify(s.local);s.local={...s.local};
   if(s.local.start&&s.local.start<global.start)s.local.start=global.start;
   if(s.local.end&&s.local.end>global.end)s.local.end=global.end;
   if((s.local.start||global.start)>(s.local.end||global.end)){delete s.local.start;delete s.local.end;}
   for(const k of ['organization','identity','salesRegion'])if(global[k]&&global[k]!=='all')delete s.local[k];
   const identity=global.identity!=='all'?global.identity:A.catalog[key].identity||s.local.identity;
   if(s.local.organization){const o=D.organizations.find(o=>o.id===s.local.organization);if(o&&identity&&identity!=='all'&&(o.kind==='dealer'?'经销商':'员工')!==identity)delete s.local.organization;}
   if(identity!=='员工')delete s.local.salesRegion;
   if(before!==JSON.stringify(s.local))s.notice='单图条件已随全局范围调整。';
   s.error='';s.draft=null;s.signature='';
  }}
 function result(key){const s=get(key),signature=JSON.stringify([global,s.local]);if(s.signature!==signature){s.chart=A.build(key,global,s.local);s.signature=signature;}return s.chart;}
 function currentType(key){const c=A.catalog[key];return types[key]||allowed[c.kind][0];}
 function option(value,label,selected){return `<option value="${esc(value)}" ${value===selected?'selected':''}>${esc(label)}</option>`;}
 function filterForm(c,s){const l=s.draft||s.local,definition=A.catalog[c.key];
  const fixedIdentity=global.identity!=='all'?global.identity:definition.identity;
  const identity=fixedIdentity||l.identity||'all';
  const orgs=D.organizations.filter(o=>(global.organization==='all'||o.id===global.organization)&&(!identity||identity==='all'||(identity==='经销商'?o.kind==='dealer':o.kind==='internal')));
  const orgOptions=D.organizations.filter(o=>global.organization==='all'||o.id===global.organization);
  // All authorized companies remain selectable when identity is editable; incompatible combinations get an explicit validation error.
  const companies=fixedIdentity?orgs:orgOptions;
  return `<div class="chart-filter-form" id="${c.key}-filters" ${s.open?'':'hidden'}><p class="chart-filter-hint">仅影响此图。日期须在顶部全局范围 ${esc(global.start)} — ${esc(global.end)} 内。</p><div class="chart-filter-fields">
   <label>开始日期<input type="date" data-chart-field="start" aria-label="${esc(c.title)}单图开始日期" min="${global.start}" max="${global.end}" value="${l.start||global.start}"></label>
   <label>结束日期<input type="date" data-chart-field="end" aria-label="${esc(c.title)}单图结束日期" min="${global.start}" max="${global.end}" value="${l.end||global.end}"></label>
   ${!fixedIdentity?`<label>学员身份<select data-chart-field="identity" aria-label="${esc(c.title)}单图身份">${option('all','跟随全局身份',l.identity||'all')}${['经销商','员工'].map(v=>option(v,v,l.identity)).join('')}</select></label>`:''}
   ${global.organization==='all'?`<label>所属企业<select data-chart-field="organization" aria-label="${esc(c.title)}单图企业">${option('all','当前范围内全部企业',l.organization||'all')}${companies.map(o=>option(o.id,o.name,l.organization)).join('')}</select></label>`:''}
   ${identity==='员工'&&global.salesRegion==='all'?`<label>销售区域<select data-chart-field="salesRegion" aria-label="${esc(c.title)}单图销售区域">${option('all','当前范围内全部销售区域',l.salesRegion||'all')}${D.salesRegions.map(v=>option(v,v,l.salesRegion)).join('')}</select></label>`:''}
   ${definition.course?`<label>课程分类<select data-chart-field="courseCategory" aria-label="${esc(c.title)}单图课程分类">${option('all','全部课程分类',l.courseCategory||'all')}${A.categories.map(v=>option(v,v,l.courseCategory)).join('')}</select></label><label>关联课程<select data-chart-field="courseId" aria-label="${esc(c.title)}单图课程">${option('all','全部课程',l.courseId||'all')}${D.courses.map(v=>option(v.id,v.name,l.courseId)).join('')}</select></label>`:''}
   ${definition.format?`<label>附件类型<select data-chart-field="format" aria-label="${esc(c.title)}单图附件类型">${option('all','全部附件类型',l.format||'all')}${['音频','图片','PDF','Word','PPT','视频'].map(v=>option(v,v,l.format)).join('')}</select></label>`:''}
   ${definition.keyword?`<label>检索关键词<input type="search" data-chart-field="keyword" aria-label="${esc(c.title)}单图关键词" placeholder="输入关键词" maxlength="50" value="${esc(l.keyword||'')}"></label>`:''}
  </div><p class="chart-filter-error" role="alert" ${s.error?'':'hidden'}>${esc(s.error)}</p><div class="chart-filter-actions"><button data-chart-action="reset">重置此图筛选</button><button data-chart-action="cancel">收起</button><button class="apply-chart-filter" data-chart-action="apply">应用到此图</button></div></div>`;
 }
 function filterSummary(c,s){const l=s.local,parts=[];
  if(l.start||l.end)parts.push(c.filters.start.slice(5)+' — '+c.filters.end.slice(5));
  if(l.identity)parts.push(l.identity);
  if(l.organization)parts.push(D.organizations.find(o=>o.id===l.organization)?.name||'');
  if(l.salesRegion)parts.push(l.salesRegion);
  if(l.courseCategory)parts.push(l.courseCategory);
  if(l.courseId)parts.push(D.courses.find(v=>v.id===l.courseId)?.name||'');
  if(l.format)parts.push(l.format);
  if(l.keyword)parts.push('关键词：'+l.keyword);
  return `<div class="chart-scope ${parts.length?'has-chart-filter':''}"><span>${parts.length?'仅此图 · '+esc(parts.join(' / ')):'跟随全局筛选'}</span>${parts.length?'<button data-chart-action="reset" aria-label="清除'+esc(c.title)+'单图筛选">清除 ×</button>':''}</div>${s.notice?`<p class="chart-filter-notice" role="status">${esc(s.notice)}</p>`:''}`;
 }
 function panel(key,link=''){const s=get(key);s.link=link;const c=result(key),type=currentType(key);
  return `<section class="panel chart-panel" data-chart-panel="${key}" data-chart-type="${type}" aria-label="${esc(c.title)}图表"><div class="panel-heading"><h2>${esc(c.title)}</h2>${s.link}</div><p class="panel-subtitle">${esc(c.subtitle)}</p><div class="chart-toolbar"><label class="chart-type-label">${icon('chart')}<span class="sr-only">${esc(c.title)}图表类型</span><select data-chart-type-select aria-label="${esc(c.title)}图表类型">${allowed[c.kind].map(v=>option(v,typeLabels[v],type)).join('')}</select></label><button class="chart-filter-button ${Object.keys(s.local).length?'filtered':''}" data-chart-action="toggle" aria-expanded="${s.open}" aria-controls="${key}-filters">${icon('filter')}筛选${Object.keys(s.local).length?'<i></i>':''}</button><button class="chart-export-button" data-chart-action="export" aria-label="导出${esc(c.title)}图表数据">${icon('download')}导出</button></div>${filterForm(c,s)}${filterSummary(c,s)}<div class="chart-body" aria-live="polite">${render(c,type)}</div><p class="chart-data-caption">${c.filters.start} — ${c.filters.end} · ${c.filters.identity==='all'?'全部身份':esc(c.filters.identity)} · 模拟数据${c.filters.start<D.DATA_START?' · 明细自 '+D.DATA_START+' 起':''}</p></section>`;
 }
 function noData(){return '<div class="chart-empty">当前筛选下暂无数据<p>可调整此图条件或重置筛选。</p></div>';}
 function render(c,type){
  if(type==='table')return dataTable(c);
  if(c.kind==='trend')return trend(c,type);
  if(c.kind==='matrix')return matrix(c);
  if(!c.rows.length)return noData();
  if(type==='donut'||type==='pie')return radial(c,type);
  if(type==='column')return columns(c);
  return horizontal(c);
 }
 function horizontal(c){const max=c.max||Math.max(1,...c.rows.map(r=>r.value));return `<div class="flexible-bars" role="img" aria-label="${esc(c.title)}">${c.rows.map((r,i)=>`<div class="flexible-bar-row"><div class="flexible-bar-name">${c.drill?`<button data-chart-action="drill" data-row-id="${esc(r.id)}">${esc(r.name.replace('（示例）',''))} ↗</button>`:`<span>${esc(r.name)}</span>`}${r.sample?`<small>${esc(r.sample)}</small>`:''}</div><div class="flexible-bar-track"><i style="width:${Math.max(0,Math.min(100,r.value/max*100))}%;background:${r.color||colors[i%colors.length]}"></i></div><b>${value(r,c)}</b></div>`).join('')}</div>`;}
 function radial(c,type){const total=D.sum(c.rows,'value'),radius=48,circ=2*Math.PI*radius;let offset=0;
  const pieces=c.rows.map((r,i)=>{const share=total?r.value/total:0,angle=share*Math.PI*2,color=r.color||colors[i%colors.length];let shape='';
   if(type==='donut'){const length=share*circ;shape=`<circle cx="64" cy="64" r="48" fill="none" stroke="${color}" stroke-width="15" stroke-dasharray="${Math.max(0,length-(length>3?2:0))} ${circ}" stroke-dashoffset="${-offset*radius}" transform="rotate(-90 64 64)"><title>${esc(r.name)}：${fmt(r.value)}</title></circle>`;}
   else if(share>=1)shape=`<circle cx="64" cy="64" r="48" fill="${color}"><title>${esc(r.name)}：${fmt(r.value)}</title></circle>`;
   else if(share>0){const a=offset-Math.PI/2,b=a+angle,x1=64+radius*Math.cos(a),y1=64+radius*Math.sin(a),x2=64+radius*Math.cos(b),y2=64+radius*Math.sin(b);shape=`<path d="M64 64L${x1} ${y1}A48 48 0 ${share>.5?1:0} 1 ${x2} ${y2}Z" fill="${color}" stroke="white" stroke-width="1"><title>${esc(r.name)}：${fmt(r.value)}</title></path>`;}
   offset+=angle;return shape;
  }).join('');
  return `<div class="chart-radial"><div class="radial-figure"><svg viewBox="0 0 128 128" role="img" aria-label="${esc(c.title+'，'+c.rows.map(r=>r.name+' '+r.value).join('，'))}">${type==='donut'?'<circle cx="64" cy="64" r="48" fill="none" stroke="#edf2f9" stroke-width="15"/>':'<circle cx="64" cy="64" r="48" fill="#edf2f9"/>'}${pieces}</svg>${type==='donut'?`<div class="radial-center"><strong>${fmt(total)}</strong><span>${esc(c.label)}</span></div>`:''}</div><div class="radial-legend">${c.rows.map((r,i)=>`<div><i style="background:${r.color||colors[i%colors.length]}"></i><span>${esc(r.name)}</span><strong>${fmt(r.value)}</strong><small>${total?fmt(r.value/total*100)+'%':'—'}</small></div>`).join('')}${type==='pie'?`<p>${esc(c.label)} · 合计 ${fmt(total)}</p>`:''}</div></div>${total?'':'<p class="chart-zero-note">当前筛选下没有有效记录，分类数量均为0。</p>'}`;
 }
 function columns(c){const rows=c.rows,max=c.max||Math.max(1,...rows.map(r=>r.value)),w=Math.max(420,rows.length*76),h=255,L=42,R=15,T=22,B=60,plot=w-L-R,top=max>10?Math.ceil(max/10)*10:max,x=i=>L+(i+.5)*plot/rows.length,y=v=>T+(h-T-B)*(1-v/top),barWidth=Math.min(46,plot/Math.max(1,rows.length)*.6);
  let svg=`<svg class="chart-svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(c.title)}柱状图">`;
  for(let i=0;i<=4;i++)svg+=`<path d="M${L} ${y(top*i/4)}H${w-R}" stroke="#e2e9f3" stroke-dasharray="3 4"/><text x="${L-8}" y="${y(top*i/4)+3}" text-anchor="end">${fmt(top*i/4)}${c.suffix}</text>`;
  rows.forEach((r,i)=>{const yy=y(r.value);svg+=`<rect x="${x(i)-barWidth/2}" y="${yy}" width="${barWidth}" height="${Math.max(0,y(0)-yy)}" rx="3" fill="${r.color||colors[i%colors.length]}"><title>${esc(r.name)}：${value(r,c)} ${esc(r.sample||'')}</title></rect><text class="column-value" x="${x(i)}" y="${yy-8}" text-anchor="middle">${value(r,c)}</text><text x="${x(i)}" y="${h-38}" text-anchor="middle">${esc(r.name.length>8?r.name.slice(0,7)+'…':r.name)}<title>${esc(r.name)}</title></text>`;});
  return `<div class="chart-column-scroll"><div style="min-width:${w}px">${svg}</svg></div></div>`;
 }
 function trend(c,type){const rows=c.rows,series=c.series,w=650,h=225,L=38,R=14,T=20,B=29,top=Math.ceil(Math.max(5,...rows.flatMap(r=>series.map(s=>r[s.key])))/5)*5,x=i=>L+(w-L-R)*(rows.length===1?.5:i/(rows.length-1)),y=v=>T+(h-T-B)*(1-v/top);
  let svg=`<svg class="chart-svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(c.title)}${typeLabels[type]}">`;
  for(let i=0;i<=4;i++)svg+=`<path d="M${L} ${y(top*i/4)}H${w-R}" stroke="#e2e9f3" stroke-dasharray="3 4"/><text x="${L-8}" y="${y(top*i/4)+3}" text-anchor="end">${fmt(top*i/4)}</text>`;
  const step=Math.max(1,Math.ceil(rows.length/7));rows.forEach((r,i)=>{if(i%step===0||i===rows.length-1)svg+=`<text x="${x(i)}" y="${h-7}" text-anchor="middle">${r.date.slice(5).replace('-','/')}</text>`;});
  series.forEach((s,si)=>{const points=rows.map((r,i)=>`${x(i)},${y(r[s.key])}`);if(type==='column'){const width=Math.min(20,(w-L-R)/Math.max(1,rows.length)/series.length*.8);rows.forEach((r,i)=>{svg+=`<rect class="chart-point" tabindex="0" aria-label="${r.date} ${s.name} ${fmt(r[s.key])}" data-tip="${r.date}|${esc(s.name)}：${fmt(r[s.key])}" x="${x(i)+(si-(series.length-1)/2)*width-width/2}" y="${y(r[s.key])}" width="${width}" height="${Math.max(0,y(0)-y(r[s.key]))}" fill="${s.color}"/>`;});return;}
   if(type==='area'&&rows.length)svg+=`<path d="M${x(0)} ${y(0)}L${points.join(' L')}L${x(rows.length-1)} ${y(0)}Z" fill="${s.color}" opacity=".13"/>`;
   svg+=`<polyline points="${points.join(' ')}" fill="none" stroke="${s.color}" stroke-width="2" stroke-linejoin="round"/>`;
   rows.forEach((r,i)=>{svg+=`<circle class="chart-point" cx="${x(i)}" cy="${y(r[s.key])}" r="${rows.length>90?1.6:3}" fill="white" stroke="${s.color}" stroke-width="1.5" tabindex="0" aria-label="${r.date} ${s.name} ${fmt(r[s.key])}" data-tip="${r.date}|${esc(s.name)}：${fmt(r[s.key])}"/>`;});
  });svg+='</svg>';
  return `<div class="chart-legend">${series.map(s=>`<span><i class="legend-dot" style="background:${s.color}"></i>${esc(s.name)}</span>`).join('')}</div><div class="chart-wrap">${svg}<div class="chart-tooltip" hidden></div></div>`;
 }
 function matrix(c){if(!c.rows.length)return noData();return `<div class="heatmap-scroll"><table class="heatmap"><thead><tr><th>分析对象</th>${c.categories.map(v=>`<th>${esc(v)}</th>`).join('')}</tr></thead><tbody>${c.rows.map(r=>`<tr><th>${esc(r.name.replace('（示例）',''))}<small>${r.members} 人</small></th>${r.competencies.filter(v=>c.categories.includes(v.category)).map(v=>`<td><span class="heat-cell ${v.assigned?'':'no-sample'}" style="--heat:${v.assigned?.1+v.rate/100*.73:0}" title="${esc(r.name)} · ${esc(v.category)}：${v.completed}/${v.assigned} 项">${v.assigned?fmt(v.rate)+'%':'—'}<small>${v.completed} / ${v.assigned}</small></span></td>`).join('')}</tr>`).join('')}</tbody></table></div><div class="heatmap-legend"><span>完成 / 分配任务数 · 无任务显示“—”</span><span>低 <i></i> 高</span></div>`;}
 function dataTable(c){const data=A.exportData(c);if(!data.rows.length)return noData();return `<div class="chart-data-table"><table><thead><tr>${data.columns.map(([label])=>`<th>${esc(label)}</th>`).join('')}</tr></thead><tbody>${data.rows.map(r=>`<tr>${data.columns.map(([,key])=>`<td>${esc(typeof r[key]==='number'?fmt(r[key]):r[key])}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;}
 function bindTooltips(root=document){root.querySelectorAll('.chart-panel .chart-point').forEach(point=>{if(point.dataset.chartBound)return;point.dataset.chartBound='true';const show=()=>{const wrap=point.closest('.chart-wrap'),tt=wrap.querySelector('.chart-tooltip'),box=point.getBoundingClientRect(),container=wrap.getBoundingClientRect();tt.innerHTML=point.dataset.tip.split('|').map(esc).join('<br>');tt.hidden=false;tt.style.left=Math.max(65,Math.min(container.width-65,box.x-container.x))+'px';tt.style.top=(box.y-container.y-9)+'px';};const hide=()=>point.closest('.chart-wrap').querySelector('.chart-tooltip').hidden=true;point.addEventListener('mouseenter',show);point.addEventListener('focus',show);point.addEventListener('mouseleave',hide);point.addEventListener('blur',hide);});}
 function update(key,focus){const el=document.querySelector(`[data-chart-panel="${key}"]`);if(!el)return;const link=get(key).link;el.outerHTML=panel(key,link);bindTooltips();if(focus)document.querySelector(`[data-chart-panel="${key}"] ${focus}`)?.focus();}
 function readDraft(root){const draft={};root.querySelectorAll('[data-chart-field]').forEach(input=>{draft[input.dataset.chartField]=input.value.trim();});return draft;}
 function reset(key){const s=get(key);s.local={};s.draft=null;s.error='';s.notice='';s.signature='';s.open=false;update(key,'[data-chart-action="toggle"]');}
 document.addEventListener('change',e=>{const el=e.target;if(el.matches('[data-chart-field="identity"]')){const root=el.closest('[data-chart-panel]'),key=root.dataset.chartPanel,s=get(key);s.draft=readDraft(root);if(el.value!=='员工')delete s.draft.salesRegion;update(key,'[data-chart-field="identity"]');return;}if(!el.matches('[data-chart-type-select]'))return;const key=el.closest('[data-chart-panel]').dataset.chartPanel;if(!allowed[A.catalog[key].kind].includes(el.value))return;if(get(key).open)get(key).draft=readDraft(el.closest('[data-chart-panel]'));types[key]=el.value;try{localStorage.setItem(storageKey,JSON.stringify(types));}catch{storageAvailable=false;}update(key,'[data-chart-type-select]');if(!storageAvailable)notify('图表已切换；当前浏览器未允许保存偏好，本次选择仍有效。');});
 document.addEventListener('click',e=>{const el=e.target.closest('[data-chart-action]');if(!el)return;const root=el.closest('[data-chart-panel]'),key=root.dataset.chartPanel,s=get(key);switch(el.dataset.chartAction){
  case 'toggle':s.open=!s.open;s.draft=null;s.error='';update(key,'[data-chart-action="toggle"]');break;
  case 'cancel':s.open=false;s.draft=null;s.error='';update(key,'[data-chart-action="toggle"]');break;
  case 'reset':reset(key);break;
  case 'apply':{const draft={};root.querySelectorAll('[data-chart-field]').forEach(input=>{const v=input.value.trim(),field=input.dataset.chartField;if(v&&v!=='all'&&!(field==='start'&&v===global.start)&&!(field==='end'&&v===global.end))draft[field]=v;});const error=A.validate(global,draft,A.catalog[key]);if(error){const err=root.querySelector('.chart-filter-error');err.textContent=error;err.hidden=false;return;}s.local=draft;s.draft=null;s.error='';s.notice='';s.open=false;s.signature='';update(key,'[data-chart-action="toggle"]');break;}
  case 'export':{const c=result(key);onExport?.(c,A.exportData(c),{...s.local});break;}
  case 'drill':{const c=result(key),row=c.rows.find(r=>r.id===el.dataset.rowId);if(row)onDrill?.(c,row);break;}
 }});
 window.ChartUI={begin,panel,afterRender:bindTooltips,configure(options){onExport=options.export;onDrill=options.drill;notify=options.notify||notify;}};
})();
