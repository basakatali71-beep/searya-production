import { SearyaApi } from './api.js?v=20260812-10';

const $=selector=>document.querySelector(selector);
const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const date=value=>value?new Intl.DateTimeFormat('tr-TR',{dateStyle:'medium',timeStyle:'short'}).format(new Date(value)):'—';
const money=(cents,currency='USD')=>new Intl.NumberFormat('tr-TR',{style:'currency',currency:String(currency).toUpperCase()}).format(Number(cents||0)/100);
const empty=message=>`<p class="empty">${message}</p>`;
const statusLabel=value=>({active:'Aktif',pending:'Onay bekliyor',approved:'Onaylandı',verified:'Doğrulandı',rejected:'Reddedildi',suspended:'Askıya alındı',paid:'Ödendi',open:'Açık',resolved:'Çözüldü',dismissed:'Kapatıldı',Aktif:'Aktif',Doğrulanmış:'Doğrulanmış'}[value]||value);
const roleLabel=value=>({buyer:'Alıcı',seller:'Satıcı',both:'Alıcı ve satıcı'}[value]||value);
const deviceLabel=value=>({desktop:'Masaüstü',tablet:'Tablet',mobile:'Mobil',unknown:'Bilinmiyor'}[value]||value);
const sourceLabel=value=>({direct:'Doğrudan',referral:'Yönlendirme'}[value]||value);
const behaviorLabel=value=>({session_started:'Oturum başladı',tab_changed:'Pazar sekmesini değiştirdi',search_performed:'Proje aradı',filter_changed:'Kategori filtresini değiştirdi',sort_changed:'Sıralamayı değiştirdi',listing_opened:'Bir ilanı açtı',listing_shared:'Bir ilanı paylaştı',button_clicked:'Bir işlem düğmesine tıkladı',auth_started:'Giriş ekranını açtı',auth_completed:'Giriş veya kayıt tamamlandı',auth_failed:'Giriş veya kayıt başarısız oldu',auth_abandoned:'Giriş ekranından ayrıldı',listing_form_started:'İlan formunu başlattı',listing_form_abandoned:'İlan formundan ayrıldı',listing_submit_attempted:'İlanı göndermeyi denedi',listing_submit_succeeded:'İlan başarıyla gönderildi',listing_submit_failed:'İlan gönderilemedi',conversation_attempted:'Üyeyle iletişim kurmayı denedi',conversation_started_client:'Görüşme başladı',conversation_failed:'Görüşme başlatılamadı',exit_feedback_shown:'Çıkış sorusu gösterildi',exit_feedback_submitted:'Çıkış geri bildirimi alındı',exit_feedback_dismissed:'Çıkış sorusu kapatıldı',ui_error:'Arayüz hatası'}[value]||String(value||'').replaceAll('_',' '));
const reasonLabel=value=>({could_not_find_project:'Aradığı projeyi bulamadı',trust_concerns:'Daha fazla güven veya doğrulama istiyor',not_ready:'Şimdilik yalnızca inceliyor',something_broken:'Bir şey çalışmadı',need_more_information:'Daha fazla bilgiye ihtiyaç duyuyor',other:'Başka bir neden'}[value]||behaviorLabel(value));
const duration=seconds=>{const value=Math.max(0,Number(seconds||0));return value<60?`${value} sn`:`${Math.floor(value/60)} dk ${value%60} sn`;};
let data;
let loading=false;

document.querySelectorAll('nav button').forEach(button=>button.addEventListener('click',()=>{
  document.querySelectorAll('nav button,.panel').forEach(item=>item.classList.remove('active'));
  button.classList.add('active'); $(`#${button.dataset.section}`).classList.add('active');
  $('#page-title').textContent=button.childNodes[0].textContent.trim();
}));

document.querySelectorAll('[data-search]').forEach(input=>input.addEventListener('input',()=>{
  const query=input.value.toLocaleLowerCase('tr-TR');
  document.querySelectorAll(`#${input.dataset.search} tr`).forEach(row=>row.hidden=!row.textContent.toLocaleLowerCase('tr-TR').includes(query));
}));

function actions(id,status,type){
  if(type==='listing'&&status==='pending') return `<div class="actions"><button class="action good" data-listing="${id}" data-action="approve">Onayla</button><button class="action" data-listing="${id}" data-action="verify">Doğrula</button><button class="action danger" data-listing="${id}" data-action="reject">Reddet</button></div>`;
  if(type==='user') return `<button class="action ${status==='active'?'danger':'good'}" data-user="${id}" data-status="${status==='active'?'suspended':'active'}">${status==='active'?'Askıya al':'Etkinleştir'}</button>`;
  if(type==='report'&&status==='open') return `<div class="actions"><button class="action good" data-report="${id}" data-status="resolved">Çözüldü</button><button class="action" data-report="${id}" data-status="dismissed">Kapat</button></div>`;
  return '—';
}

function render(){
  const c=data.counts;
  const presence=data.analytics?.presence||{activeNow:0,enteredToday:0,exitedToday:0,updatedAt:null};
  $('#live-metrics').innerHTML=[['Şu an aktif',presence.activeNow,'Son 2 dakika'],['Bugün giren',presence.enteredToday,'Benzersiz ziyaretçi'],['Bugün ayrılan',presence.exitedToday,'Çıkış veya zaman aşımı']].map(([label,value,note],index)=>`<article class="metric ${index===0?'metric-live':''}"><span>${label}</span><strong>${value}</strong><small>${note}</small></article>`).join('');
  $('#live-updated').textContent=presence.updatedAt?`Güncellendi: ${new Intl.DateTimeFormat('tr-TR',{hour:'2-digit',minute:'2-digit',second:'2-digit'}).format(new Date(presence.updatedAt))}`:'—';
  $('#pending-badge').textContent=c.pendingListings; $('#report-badge').textContent=c.openReports;
  $('#metrics').innerHTML=[['Bugünkü ziyaretçiler',c.visitorsToday,'Benzersiz'],['Son 7 gün',c.visitors7d,`${c.pageViews7d} sayfa görüntüleme`],['Toplam kullanıcı',c.users,`Bugün +${c.usersToday}`],['Toplam ilan',c.listings,`${c.pendingListings} onay bekliyor`],['Paket satışları',c.paidPurchases,'Başarılı ödemeler'],['Toplam gelir',money(c.revenueCents),'Komisyon yok'],['Açık şikâyetler',c.openReports,'İnceleme bekliyor']].map(([label,value,note])=>`<article class="metric"><span>${label}</span><strong>${value}</strong><small>${note}</small></article>`).join('');
  const max=Math.max(1,...data.daily.flatMap(item=>[item.visitors,item.signups]));
  $('#chart').innerHTML=data.daily.map(item=>`<div class="day"><div class="bars"><i class="bar" title="${item.visitors} ziyaretçi" style="height:${Math.max(3,item.visitors/max*100)}%"></i><i class="bar signup" title="${item.signups} kayıt" style="height:${Math.max(3,item.signups/max*100)}%"></i></div><label>${new Date(item.day+'T12:00:00').toLocaleDateString('tr-TR',{weekday:'short'})}</label></div>`).join('');
  const funnel=data.analytics?.funnel||{visitors:0,signups:0,listings:0,conversations:0};
  const rate=value=>funnel.visitors?`${(value/funnel.visitors*100).toFixed(1)}%`:'0%';
  $('#funnel-metrics').innerHTML=[['Ziyaretçiler',funnel.visitors,'Başlangıç noktası'],['Kayıtlar',funnel.signups,rate(funnel.signups)],['Yayınlanan ilanlar',funnel.listings,rate(funnel.listings)],['Yeni görüşmeler',funnel.conversations,rate(funnel.conversations)]].map(([label,value,note])=>`<article class="metric"><span>${label}</span><strong>${value}</strong><small>${note}</small></article>`).join('');
  $('#campaign-table').innerHTML=(data.analytics?.campaigns||[]).map(item=>`<tr><td><strong>${esc(sourceLabel(item.source||'direct'))}</strong></td><td>${esc(sourceLabel(item.medium||'direct'))}</td><td>${esc(item.campaign||'—')}</td><td>${item.visitors}</td><td>${item.signups}</td><td>${item.listings}</td><td>${item.conversations}</td></tr>`).join('')||`<tr><td colspan="7">${empty('Henüz ölçülebilir kampanya verisi yok.')}</td></tr>`;
  renderBehavior(data.analytics?.behavior||{});
  $('#pending-preview').innerHTML=data.pendingListings.slice(0,5).map(item=>`<div class="mini"><div><strong>${esc(item.title)}</strong><small>${esc(item.category)} · $${Number(item.askingPrice).toLocaleString('tr-TR')}</small></div>${actions(item.id,'pending','listing')}</div>`).join('')||empty('Onay bekleyen ilan yok.');
  $('#report-preview').innerHTML=data.reports.filter(item=>item.status==='open').slice(0,5).map(item=>`<div class="mini"><div><strong>${esc(item.targetLabel)}</strong><small>${esc(item.reason)}</small></div>${actions(item.id,item.status,'report')}</div>`).join('')||empty('Açık şikâyet yok.');
  $('#listing-table').innerHTML=data.recentListings.map(item=>`<tr><td><strong>${esc(item.title)}</strong><small>${esc(item.category)}</small></td><td>${esc(item.ownerName)}<small>${esc(item.ownerEmail||'E-posta yok')}</small></td><td>$${Number(item.askingPrice).toLocaleString('tr-TR')}</td><td><span class="badge ${['Active','Verified','Aktif','Doğrulanmış'].includes(item.status)?'approved':item.status}">${esc(statusLabel(item.status))}</span></td><td>${actions(item.id,item.status,'listing')}</td></tr>`).join('');
  $('#user-table').innerHTML=data.users.map(user=>`<tr><td><strong>${esc(user.name)}</strong><small>${esc(user.email||'Herkese açık e-posta yok')}</small></td><td>${esc(roleLabel(user.role))}${user.isAdmin?' · Yönetici':''}</td><td>${user.buyerConnections} bağlantı<small>${user.sellerListingCredits} standart · ${user.sellerVipCredits} VIP ilan</small></td><td>${date(user.lastSeenAt)}</td><td>${user.isAdmin?'—':actions(user.id,user.status,'user')}</td></tr>`).join('');
  $('#purchase-table').innerHTML=data.purchases.map(item=>`<tr><td>${esc(item.userName)}<small>${esc(item.userEmail||'')}</small></td><td>${esc(item.packageKey)}</td><td>${money(item.amountCents,item.currency)}</td><td><span class="badge ${item.status}">${esc(statusLabel(item.status))}</span></td><td>${date(item.createdAt)}</td></tr>`).join('')||`<tr><td colspan="5">${empty('Henüz paket satışı yok.')}</td></tr>`;
  $('#report-table').innerHTML=data.reports.map(item=>`<tr><td>${esc(item.reporterName)}<small>${esc(item.reporterEmail||'')}</small></td><td>${esc(item.targetLabel)}<small>${esc(item.targetType)}</small></td><td>${esc(item.reason)}</td><td><span class="badge ${item.status}">${esc(statusLabel(item.status))}</span></td><td>${actions(item.id,item.status,'report')}</td></tr>`).join('')||`<tr><td colspan="5">${empty('Şikâyet yok.')}</td></tr>`;
}

function insightRows(items,labelFor=value=>value,noteFor=()=>'',max=1){
  if(!items?.length)return empty('Henüz veri yok. Analitik izni veren ziyaretçiler siteyi kullandıkça bilgiler burada görünecek.');
  const peak=Math.max(max,...items.map(item=>Number(item.count||0)));
  return items.map(item=>`<div class="insight-row"><div class="insight-copy"><strong>${esc(labelFor(item))}</strong><small>${esc(noteFor(item))}</small></div><div class="insight-value"><b>${Number(item.count||0)}</b><i style="--fill:${Math.max(4,Number(item.count||0)/peak*100)}%"></i></div></div>`).join('');
}

function journeyEvent(event){
  const meta=event.metadata||{};
  const detail=meta.listingTitle||meta.query||meta.category||meta.sort||meta.reason&&reasonLabel(meta.reason)||meta.code||meta.tab||'';
  return `<li><i></i><div><strong>${esc(behaviorLabel(event.eventName))}</strong>${detail?`<small>${esc(detail)}</small>`:''}</div><time>${new Intl.DateTimeFormat('tr-TR',{hour:'2-digit',minute:'2-digit'}).format(new Date(event.createdAt))}</time></li>`;
}

function renderBehavior(behavior){
  const summary=behavior.summary||{};
  $('#behavior-metrics').innerHTML=[['Takip edilen oturum',summary.sessions||0,'Son 30 gün'],['Şu an aktif',summary.activeNow||0,'İzin veren ziyaretçiler'],['Ortalama oturum',duration(summary.avgDurationSeconds||0),'Yaklaşık süre'],['Hemen çıkma sinyali',`${summary.bounceRate||0}%`,'Takip edilen etkileşim yok'],['Çıkış yanıtları',summary.feedbackResponses||0,'Gönüllü yanıtlar'],['Hata sinyalleri',summary.errors||0,'Kullanıcıya yansıyan sorunlar']].map(([label,value,note])=>`<article class="metric"><span>${label}</span><strong>${value}</strong><small>${note}</small></article>`).join('');
  $('#behavior-listings').innerHTML=insightRows(behavior.topListings,item=>item.title);
  $('#behavior-searches').innerHTML=insightRows(behavior.searches,item=>item.query,item=>item.zeroResults?`${item.zeroResults} sonuçsuz arama`:'Sonuç bulundu');
  const combinedExits=[...(behavior.exitReasons||[]).map(item=>({...item,label:reasonLabel(item.key)})),...(behavior.exitPages||[]).map(item=>({...item,label:`Çıkış sayfası: ${item.key}`}))];
  $('#behavior-exits').innerHTML=insightRows(combinedExits,item=>item.label);
  $('#behavior-dropoffs').innerHTML=insightRows(behavior.dropOffs,item=>behaviorLabel(item.key));
  $('#behavior-actions').innerHTML=insightRows(behavior.popularActions,item=>behaviorLabel(item.key));
  $('#behavior-devices').innerHTML=insightRows(behavior.devices,item=>deviceLabel(item.key||'unknown'));
  $('#behavior-journeys').innerHTML=(behavior.journeys||[]).map(item=>{
    const identity=item.userEmail?`${item.userName||'Üye'} · ${item.userEmail}`:`Anonim ziyaretçi ${item.visitorKey}`;
    const outcome=item.feedback?reasonLabel(item.feedback):item.active?'Şu an aktif':item.endReason==='timeout'?'Zaman aşımına uğradı':'Siteden ayrıldı';
    return `<details class="journey"><summary><div><strong>${esc(identity)}</strong><small>${esc(sourceLabel(item.source||'direct'))} · ${esc(deviceLabel(item.device||'unknown'))} · ${date(item.startedAt)}</small></div><div class="journey-outcome"><span class="badge ${item.active?'active':''}">${esc(outcome)}</span><b>${duration(item.durationSeconds)}</b></div></summary><div class="journey-body"><p><strong>Son sayfa</strong> ${esc(item.path||'/')} ${item.campaign?`· Kampanya: ${esc(item.campaign)}`:''}</p>${item.events?.length?`<ol>${item.events.map(journeyEvent).join('')}</ol>`:empty('Bu oturumda takip edilen etkileşim yok.')}</div></details>`;
  }).join('')||empty('Henüz ziyaretçi yolculuğu yok.');
}

async function load({silent=false}={}){
  if(loading)return;
  loading=true;
  if(!silent){$('#notice').className='notice';$('#notice').textContent='Veriler yükleniyor…';}
  try{data=await SearyaApi.adminOverview();render();$('#notice').classList.add('hidden');}
  catch(error){if(!silent){$('#notice').className='notice error';$('#notice').innerHTML=`Yönetici girişi gerekiyor. <a href="/">Ana sayfadan giriş yapın</a>`;}}
  finally{loading=false;}
}

document.addEventListener('click',async event=>{
  const button=event.target.closest('[data-listing],[data-user],[data-report]'); if(!button)return;
  button.disabled=true;
  try{
    if(button.dataset.listing)await SearyaApi.moderateListing(button.dataset.listing,button.dataset.action);
    if(button.dataset.user)await SearyaApi.updateAdminUserStatus(button.dataset.user,button.dataset.status);
    if(button.dataset.report)await SearyaApi.updateAdminReport(button.dataset.report,button.dataset.status);
    await load();
  }catch(error){alert(error.message);button.disabled=false;}
});
$('#refresh-btn').addEventListener('click',load);
load();
window.setInterval(()=>{if(!document.hidden)load({silent:true});},15000);
