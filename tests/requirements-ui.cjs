const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs/promises');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
 try{
  const page=await browser.newPage({viewport:{width:1512,height:1100},acceptDownloads:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  const base=process.env.DEMO_URL||'http://127.0.0.1:4173';await fs.mkdir('test-results',{recursive:true});await page.goto(base+'/?v=2.6#overview');
  const dialog=page.locator('#detail-dialog'),body=page.locator('#dialog-content');
  assert.deepEqual(await page.locator('.heading-actions button').allTextContents(),['指标口径','需求说明','导出数据']);
  await page.locator('.heading-actions [data-action="requirements"]').click();assert.match(await body.innerText(),/29 项功能需求 · 24 张图表说明/);assert.equal(await body.locator('.spec-feature').count(),29);assert.equal(await body.locator('.spec-chart').count(),24);
  await page.locator('#spec-selection').selectOption('employees');assert.match(await body.innerText(),/华南、西南/);assert.equal(await body.locator('.spec-chart').count(),3);assert(!await body.locator('.spec-feature header h4').allTextContents().then(a=>a.includes('公司对比工作台')));
  await page.locator('#spec-search').fill('公司到人员搜索');assert.equal(await body.locator('.spec-feature').count(),1);await page.locator('#spec-search').fill('不存在的需求测试');assert.match(await body.innerText(),/没有找到匹配的功能/);await page.locator('#spec-search').fill('');await page.locator('#spec-selection').selectOption('all');
  const pending=page.waitForEvent('download');await body.locator('[data-action="export-requirements"]').click();const dl=await pending;const md=await fs.readFile(await dl.path(),'utf8');assert.match(md,/FR-29/);assert.match(md,/同比区间/);assert.match(md,/成长值净变化/);assert.match(md,/\(themeCompletion\)/);
  await page.screenshot({path:'test-results/requirements-desktop.png'});await page.keyboard.press('Escape');assert(await dialog.isHidden());
  await page.locator('.heading-actions [data-action="definitions"]').click();assert.equal(await body.locator('.metric-entry').count(),80);assert.match(await body.innerText(),/2025-10-01 — 2025-10-23/);
  await body.locator('.spec-rules summary').click();assert.match(await body.innerText(),/当前Demo无去年|不包含2025年数据/);assert.match(await body.innerText(),/分母为0/);await body.locator('.spec-rules summary').click();
  await page.locator('#spec-search').fill('课程任务完成率');const completion=body.locator('[data-metric-id="completion"]');assert(await completion.getAttribute('open')!==null);assert.match(await completion.innerText(),/取值公式/);assert.match(await completion.innerText(),/环比规则/);assert.match(await completion.innerText(),/同比规则/);assert.match(await completion.innerText(),/百分点/);
  await page.locator('#spec-search').fill('');await page.locator('#spec-selection').selectOption('2');assert.equal(await body.locator('.metric-entry').count(),13);await page.locator('#spec-search').fill('<script>');assert.match(await body.innerText(),/没有找到匹配的指标/);assert.equal(await body.locator('script').count(),0);await page.keyboard.press('Escape');
  await page.locator('.kpi-card').nth(2).click();assert.equal(await body.locator('.metric-entry').count(),1);assert.match(await body.innerText(),/当前值/);assert.match(await body.innerText(),/当前指标对应人员/);await page.screenshot({path:'test-results/metric-completion-desktop.png'});await page.keyboard.press('Escape');
  await page.locator('#main-nav [data-tab="courses"]').click();await page.waitForFunction(()=>document.querySelector('#page-title').textContent==='课程分析');await page.locator('.kpi-card').nth(1).click();assert.match(await body.innerText(),/有效学习事件|有效学习分钟/);assert(await body.locator('[data-action="kpi-detail"]').isVisible());await page.keyboard.press('Escape');
  for(const route of ['overview','dealers','companies','employees','courses','knowledge','exams','growth','governance']){
   await page.locator(`#main-nav [data-tab="${route}"]`).click();await page.waitForFunction(r=>document.querySelector(`#main-nav [data-tab="${r}"]`)?.getAttribute('aria-current')==='page',route);
   await page.locator('.heading-actions [data-action="requirements"]').click();assert(await dialog.isVisible());await page.keyboard.press('Escape');
  }
  // A partially covered comparison and a rate with no reference tasks must not claim a growth rate.
  await page.locator('#start-date').fill('2026-04-10');await page.locator('#start-date').dispatchEvent('change');await page.locator('#end-date').fill('2026-04-23');await page.locator('#end-date').dispatchEvent('change');assert.match(await page.locator('.kpi-bottom').first().innerText(),/暂无可比数据/);
  const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true});mobile.on('pageerror',e=>errors.push(e.message));await mobile.goto(base+'/?v=2.6#overview');assert.equal(await mobile.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await mobile.locator('.heading-actions [data-action="requirements"]').click();assert.equal(await mobile.locator('#detail-dialog').evaluate(el=>el.scrollWidth>el.clientWidth),false);await mobile.screenshot({path:'test-results/requirements-mobile.png'});await mobile.keyboard.press('Escape');
  await mobile.locator('.heading-actions [data-action="definitions"]').click();await mobile.locator('#spec-search').fill('考试通过率');await mobile.locator('[data-metric-id="passRate"]').scrollIntoViewIfNeeded();assert.equal(await mobile.locator('#detail-dialog').evaluate(el=>el.scrollWidth>el.clientWidth),false);await mobile.screenshot({path:'test-results/metric-mobile.png'});
  assert.deepEqual(errors,[]);console.log('PASS: full requirements/metric catalog, module and text search, formulas, MoM/YoY periods, card links, download, nine routes, missing history and mobile dialogs.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
