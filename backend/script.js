document.addEventListener('DOMContentLoaded', () => {
    const API = window.location.protocol === 'file:' ? 'http://127.0.0.1:8000' : '';
    const $ = id => document.getElementById(id);
    let currentFile = null, f1Chart = null, distilledFile = null;
    
    // Set absolute download links
    $('dl-distilled').href = API + '/api/download_distilled';
    document.querySelector('#dl-card .btn-download').href = API + '/api/download_generated';

    function getDesktopApi() {
        return window.pywebview && window.pywebview.api ? window.pywebview.api : null;
    }

    async function saveCsvViaDesktop(kind) {
        const method = kind === 'distilled' ? 'save_distilled_csv' : 'save_generated_csv';
        const desktopApi = getDesktopApi();
        if (!desktopApi || !desktopApi[method]) {
            log('Masaüstü kaydetme servisi hazır değil. Uygulamayı main.py ile açın.', 'err');
            return false;
        }

        const result = await desktopApi[method]();
        if (result && result.ok) {
            log('CSV kaydedildi: ' + result.path, 'ok');
        } else if (result && !result.cancelled) {
            log(result.message || 'CSV kaydedilemedi.', 'err');
        }
        return true;
    }

    $('dl-distilled').addEventListener('click', async e => {
        if (getDesktopApi()) {
            e.preventDefault();
            await saveCsvViaDesktop('distilled');
        }
    });
    document.querySelector('#dl-card .btn-download').addEventListener('click', async e => {
        if (getDesktopApi()) {
            e.preventDefault();
            await saveCsvViaDesktop('generated');
        }
    });

    // === NAV ===
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
            item.classList.add('active');
            $('panel-' + item.dataset.panel).classList.add('active');
            $('panel-title').textContent = item.querySelector('span').textContent;
        });
    });

    // === CLOCK ===
    setInterval(() => { $('clock').textContent = new Date().toLocaleTimeString('tr-TR',{hour12:false}); }, 1000);

    // === LOG ===
    function log(msg, type='') {
        const d = document.createElement('div');
        d.className = 'clog ' + type;
        const t = new Date().toLocaleTimeString('tr-TR',{hour12:false});
        d.innerHTML = `<span style="opacity:.4">[${t}]</span> ${msg}`;
        $('console-out').appendChild(d);
        $('console-out').scrollTop = 99999;
    }

    // === STATUS ===
    async function checkStatus() {
        try {
            const r = await fetch(API+'/api/system_status');
            const d = await r.json();
            if(d.model_loaded){
                $('sys-indicator').innerHTML='<span class="blink-dot green"></span>';
                $('sys-label').textContent='GODMODE Aktif';$('sys-label').style.color='var(--green)';
                log('RCGAN GODMODE yüklendi: '+d.model_name,'ok');
            } else { $('sys-label').textContent='Fallback';$('sys-label').style.color='var(--amber)'; }
            $('sys-seed').textContent=d.seed_rows.toLocaleString();
            log('Seed: '+d.seed_rows.toLocaleString()+' yörünge');
        } catch { $('sys-label').textContent='Bağlantı Yok';$('sys-label').style.color='var(--red)'; log('Sunucuya bağlanılamadı!','err'); }
    }
    checkStatus();

    // === CHART ===
    (function(){
        const ctx=$('f1Chart').getContext('2d');
        Chart.defaults.color='#5a6578';Chart.defaults.font.family='Inter';
        f1Chart=new Chart(ctx,{type:'bar',data:{labels:['Baseline','Augmented'],datasets:[{data:[0,0],backgroundColor:['rgba(99,102,241,.45)','rgba(16,185,129,.6)'],borderColor:['#6366f1','#10b981'],borderWidth:2,borderRadius:6,barPercentage:.5}]},options:{responsive:true,maintainAspectRatio:false,scales:{y:{beginAtZero:true,max:1,grid:{color:'rgba(255,255,255,.03)'}},x:{grid:{display:false}}},plugins:{legend:{display:false}}}});
    })();

    // === SLIDER ===
    $('n-samples').addEventListener('input', e => { $('slider-val').textContent = e.target.value; });

    // === UPLOAD ===
    const dz=$('drop-zone');
    dz.addEventListener('click',()=>$('file-input').click());
    dz.addEventListener('dragover',e=>{e.preventDefault();dz.classList.add('over')});
    dz.addEventListener('dragleave',()=>dz.classList.remove('over'));
    dz.addEventListener('drop',e=>{e.preventDefault();dz.classList.remove('over');if(e.dataTransfer.files.length)loadFile(e.dataTransfer.files[0])});
    $('file-input').addEventListener('change',e=>{if(e.target.files.length)loadFile(e.target.files[0])});
    $('btn-remove').addEventListener('click',()=>{
        currentFile=null;distilledFile=null;$('file-input').value='';
        dz.classList.remove('hidden');$('file-pill').classList.add('hidden');
        $('btn-generate').disabled=true;$('btn-distill').disabled=true;
        log('Dosya kaldırıldı.');
    });

    function loadFile(f) {
        currentFile=f;
        $('fname').textContent=f.name;$('fsize').textContent=(f.size/1024).toFixed(0)+' KB';
        dz.classList.add('hidden');$('file-pill').classList.remove('hidden');
        $('btn-distill').disabled=false;
        $('btn-generate').disabled=false;  // generate also works without distill
        log('Dosya: '+f.name+' ('+(f.size/1024).toFixed(0)+' KB)','ok');
    }

    // === DISTILL ===
    $('btn-distill').addEventListener('click', async () => {
        if(!currentFile) return;
        const btn=$('btn-distill');
        btn.disabled=true; btn.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i> Damıtılıyor...';
        $('distill-progress').classList.remove('hidden');
        log('Bilgi damıtma başlatıldı...','ok');

        let p=0;
        const iv=setInterval(()=>{p+=Math.random()*15;if(p>90)p=90;$('distill-thumb').style.width=p+'%'},300);

        try {
            const fd=new FormData(); fd.append('file',currentFile);
            const r=await fetch(API+'/api/distill',{method:'POST',body:fd});
            if(!r.ok) throw new Error('Damıtma hatası: '+r.status);
            const d=await r.json();
            clearInterval(iv);
            $('distill-thumb').style.width='100%';
            $('distill-text').textContent='Damıtma tamamlandı!';
            btn.innerHTML='<i class="fa-solid fa-check"></i> Damıtma Tamamlandı';

            // Build report
            const rpt=$('distill-report'); rpt.innerHTML='';
            const rep=d.report;

            // Original info
            addDistillRow(rpt,'Orijinal Veri', rep.original_rows.toLocaleString()+' satır, '+rep.original_cols+' sütun','');

            // Steps
            rep.steps.forEach(s=>{
                let val='', cls='';
                if(s.removed!==undefined){val='-'+s.removed;cls='removed';}
                else if(s.fixed!==undefined){val='~'+s.fixed+' düzeltildi';cls='fixed';}
                else {val=s.detail;cls='';}
                addDistillRow(rpt,s.name,val,cls);
                log('🔧 '+s.name+': '+s.detail);
            });

            // Summary
            const sum=document.createElement('div');
            sum.className='distill-summary';
            sum.textContent='✅ Temiz veri: '+rep.clean_rows.toLocaleString()+' satır ('+rep.reduction_pct+'% azaltma)';
            rpt.appendChild(sum);

            $('dl-distilled').classList.remove('hidden');
            log('Damıtma tamamlandı: '+rep.original_rows+' → '+rep.clean_rows+' satır ('+rep.reduction_pct+'% azaltma)','ok');

            // Store distilled file info for generate
            distilledFile = true;
        } catch(e) {
            clearInterval(iv); log(e.message,'err');
            btn.disabled=false; btn.innerHTML='<i class="fa-solid fa-broom"></i> Veriyi Damıt';
        }
    });

    function addDistillRow(container, name, val, cls) {
        const r=document.createElement('div'); r.className='distill-row';
        r.innerHTML=`<span class="d-name">${name}</span><span class="d-val ${cls}">${val}</span>`;
        container.appendChild(r);
    }

    // === GENERATE ===
    $('btn-generate').addEventListener('click', async () => {
        if(!currentFile) return;
        const btn=$('btn-generate');
        const nSamples=parseInt($('n-samples').value);
        btn.disabled=true; btn.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i> İşleniyor...';
        $('gen-progress').classList.remove('hidden');
        log('Sentez başlatıldı ('+nSamples+' örnek)...','ok');

        let p=0;
        const iv=setInterval(()=>{p+=Math.random()*10;if(p>92)p=92;$('gen-thumb').style.width=p+'%'},400);

        try {
            const fd=new FormData();
            fd.append('file',currentFile);
            fd.append('n_samples', nSamples.toString());
            const r=await fetch(API+'/api/evaluate_pipeline',{method:'POST',body:fd});
            if(!r.ok){ const err=await r.json(); throw new Error(err.detail||'Hata: '+r.status); }
            const d=await r.json();
            clearInterval(iv);
            $('gen-thumb').style.width='100%';$('gen-text').textContent='Tamamlandı!';
            btn.innerHTML='<i class="fa-solid fa-check"></i> Tamamlandı';
            showResults(d);
        } catch(e) {
            clearInterval(iv); log(e.message,'err');
            btn.disabled=false; btn.innerHTML='<i class="fa-solid fa-play"></i> Üretimi Başlat';
        }
    });

    function showResults(d) {
        $('kpi-seed').textContent=d.seed_count.toLocaleString();
        $('kpi-gen').textContent=d.gen_count.toLocaleString();
        $('kpi-factor').textContent='×'+d.multiplication_factor;
        $('kpi-cov').textContent='%'+d.generative_coverage;
        $('kpi-f1').textContent=d.augmented_f1.toFixed(4);
        const imp=$('kpi-imp');
        imp.textContent=(d.improvement>0?'+':'')+d.improvement.toFixed(1)+'%';
        imp.style.color=d.improvement>0?'var(--green)':'var(--red)';

        const methodNames={rcgan:'RCGAN GODMODE',ctgan:'CTGAN (On-the-fly)',smote:'SMOTE+Gaussian'};
        f1Chart.data.labels=['Baseline',methodNames[d.method]||'Augmented'];
        f1Chart.data.datasets[0].data=[d.seed_f1,d.augmented_f1];
        f1Chart.update();

        // Details
        const dl=$('detail-list'); dl.innerHTML='';
        if(d.dataset_info){
            const di=d.dataset_info;
            [['Satır (temiz)',d.seed_count.toLocaleString()],['Özellik',di.features],['Sınıf',di.classes],
             ['Label','"'+di.label_col+'"'],['Format',di.is_waymo?'Waymo':'Genel'],
             ['Yöntem',methodNames[d.method]||d.method],
             ['Seed F1',d.seed_f1.toFixed(4)],['Aug F1',d.augmented_f1.toFixed(4)]
            ].forEach(([l,v])=>{
                const r=document.createElement('div');r.className='detail-row';
                r.innerHTML=`<span class="label">${l}</span><span class="val">${v}</span>`;
                dl.appendChild(r);
            });
        }

        // Distillation report in details
        if(d.distillation && d.distillation.steps){
            const hdr=document.createElement('div');hdr.className='detail-row';
            hdr.innerHTML='<span class="label" style="color:var(--cyan);font-weight:700">── Damıtma ──</span><span></span>';
            dl.appendChild(hdr);
            d.distillation.steps.forEach(s=>{
                const r=document.createElement('div');r.className='detail-row';
                r.innerHTML=`<span class="label">${s.name}</span><span class="val">${s.detail}</span>`;
                dl.appendChild(r);
            });
        }
        
        // Fidelity & Utility (Akademik Metrikler)
        if (d.fidelity && d.utility) {
            // Fidelity
            const hdrF=document.createElement('div');hdrF.className='detail-row';
            hdrF.innerHTML='<span class="label" style="color:var(--green);font-weight:700;margin-top:10px">── Fidelity (Benzerlik) ──</span><span></span>';
            dl.appendChild(hdrF);
            
            [['Cosine Benzerliği', (d.fidelity.cosine_similarity*100).toFixed(1)+'%'],
             ['Sütun Korelasyonu', (d.fidelity.column_correlation*100).toFixed(1)+'%']
            ].forEach(([l,v])=>{
                const r=document.createElement('div');r.className='detail-row';
                r.innerHTML=`<span class="label">${l}</span><span class="val">${v}</span>`;
                dl.appendChild(r);
            });

            // Utility
            const hdrU=document.createElement('div');hdrU.className='detail-row';
            hdrU.innerHTML='<span class="label" style="color:var(--yellow);font-weight:700;margin-top:10px">── Utility (Fayda) ──</span><span></span>';
            dl.appendChild(hdrU);
            
            let f1_target_str = d.utility.f1_target_met ? '✅ Başarılı' : '❌ Başarısız';
            let recall_target_str = d.utility.recall_target_met ? '✅ Başarılı' : '❌ Başarısız';
            
            [['Azınlık Sınıfı', d.utility.minority_class || '-'],
             ['Azınlık Recall (Seed)', (d.utility.minority_recall_seed*100).toFixed(1)+'%'],
             ['Azınlık Recall (Aug)', (d.utility.minority_recall_augmented*100).toFixed(1)+'%'],
             ['Hedef: F1 > %15 Artış', f1_target_str],
             ['Hedef: Recall > %80', recall_target_str]
            ].forEach(([l,v])=>{
                const r=document.createElement('div');r.className='detail-row';
                r.innerHTML=`<span class="label">${l}</span><span class="val">${v}</span>`;
                dl.appendChild(r);
            });
        }

        $('dl-card').classList.remove('hidden');
        log('F1: '+d.seed_f1.toFixed(4)+' → '+d.augmented_f1.toFixed(4)+' ('+(d.improvement>0?'+':'')+d.improvement.toFixed(1)+'%)','ok');

        // Switch to analysis
        document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
        document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
        document.querySelector('[data-panel="analysis"]').classList.add('active');
        $('panel-analysis').classList.add('active');
        $('panel-title').textContent='Analiz';
    }

    // === SIMULATION ===
    const simC=$('simCanvas'),sctx=simC.getContext('2d');let simOn=false;
    function rsc(){const p=simC.parentElement;simC.width=p.clientWidth;simC.height=p.clientHeight}
    window.addEventListener('resize',rsc);rsc();

    $('btn-sim').addEventListener('click',async()=>{
        if(simOn)return;const t=$('sim-type').value;log('Simülasyon: '+t.toUpperCase());
        try{const r=await fetch(API+'/api/simulation_sample',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:t})});if(!r.ok)throw new Error('Veri yok');runSim(await r.json())}catch(e){log(e.message,'err')}
    });

    function runSim(data){
        simOn=true;$('btn-sim').disabled=true;let f=0;const tot=data.x.length;let ro=0;
        const tc={spike:'#ef4444',drift:'#f59e0b',freeze:'#22d3ee',dropout:'#8b5cf6',noise:'#ec4899'};
        const ac=tc[data.type]||'#ef4444';
        (function draw(){
            if(f>=tot){simOn=false;$('btn-sim').disabled=false;$('s-status').textContent='FIN';$('s-status').style.color='var(--green)';return}
            const sp=data.speed[f],cy=data.y[f]-data.y[0],ax=f>0?(data.speed[f]-data.speed[f-1])/.1:0;
            const ano=Math.abs(ax)>10||Math.abs(cy)>5||sp<.1;
            sctx.fillStyle='#080c14';sctx.fillRect(0,0,simC.width,simC.height);
            ro-=sp*.5;sctx.strokeStyle='rgba(99,102,241,.08)';sctx.setLineDash([18,24]);sctx.lineWidth=1;
            const mid=simC.height/2;
            [-130,0,130].forEach(o=>{sctx.beginPath();sctx.lineDashOffset=ro;sctx.moveTo(0,mid+o);sctx.lineTo(simC.width,mid+o);sctx.stroke()});
            sctx.setLineDash([]);
            if(ano){sctx.fillStyle=ac+'12';sctx.fillRect(0,0,simC.width,simC.height);$('s-status').textContent='⚠ ANOMALİ';$('s-status').style.color=ac}
            else{$('s-status').textContent='NORMAL';$('s-status').style.color='var(--green)'}
            if(f>2){sctx.beginPath();sctx.strokeStyle=ano?ac+'50':'rgba(99,102,241,.15)';sctx.lineWidth=2;for(let i=Math.max(0,f-10);i<=f;i++){const tx=simC.width/4,ty=mid+(data.y[i]-data.y[0])*30;i===Math.max(0,f-10)?sctx.moveTo(tx-(f-i)*14,ty):sctx.lineTo(tx-(f-i)*14,ty)}sctx.stroke()}
            const cx=simC.width/4,ccy=mid+cy*30,ag=Math.atan2(data.vy[f],data.vx[f]+1e-8);
            sctx.save();sctx.translate(cx,ccy);sctx.rotate(ag);sctx.shadowBlur=20;sctx.shadowColor=ano?ac:'#6366f1';
            sctx.fillStyle=ano?ac:'#e2e8f0';sctx.beginPath();sctx.roundRect(-22,-11,44,22,5);sctx.fill();
            sctx.fillStyle='#080c14';sctx.fillRect(6,-9,9,18);sctx.fillStyle='#fbbf24';sctx.fillRect(20,-10,3,5);sctx.fillRect(20,5,3,5);
            sctx.restore();sctx.shadowBlur=0;
            $('s-speed').textContent=sp.toFixed(1);$('s-accel').textContent=ax.toFixed(1);$('s-offset').textContent=cy.toFixed(2);
            f++;setTimeout(()=>requestAnimationFrame(draw),55);
        })();
    }

    // === AUTOMATION ===
    const btnAuto = $('btn-auto');
    if(btnAuto) btnAuto.addEventListener('click',async()=>{
        const btn=$('btn-auto');btn.disabled=true;btn.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i> İşleniyor...';
        $('auto-progress').classList.remove('hidden');
        const nSamples=parseInt($('n-samples').value)||2000;
        log('OTOMASYON: '+nSamples+' örnek üretiliyor...','ok');
        let p=0;
        const iv=setInterval(()=>{p+=(100-p)*.05;$('auto-thumb').style.width=p+'%';
            if(p>25&&p<30)$('auto-text').textContent='Damıtma...';
            if(p>45&&p<50)$('auto-text').textContent='Sentez...';
            if(p>70&&p<75)$('auto-text').textContent='Model eğitimi...';
        },800);
        try{
            const r=await fetch(API+'/api/run_full_automation',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({n_samples:nSamples})});
            if(!r.ok)throw new Error('Hata:'+r.status);
            const d=await r.json();clearInterval(iv);
            $('auto-thumb').style.width='100%';$('auto-text').textContent='BAŞARILI: '+d.gen_count.toLocaleString()+' örnek!';
            btn.innerHTML='<i class="fa-solid fa-check"></i> Tamamlandı';
            showResults(d);
            log('Otomasyon tamamlandı! '+d.gen_count+' örnek','ok');
        }catch(e){clearInterval(iv);log(e.message,'err');btn.disabled=false;btn.innerHTML='<i class="fa-solid fa-bolt"></i> TÜM SÜRECİ BAŞLAT'}
    });
});
