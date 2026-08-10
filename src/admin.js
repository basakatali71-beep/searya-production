import { SearyaApi } from './api.js?v=20260810-6';

const $=selector=>document.querySelector(selector);
const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const date=value=>value?new Intl.DateTimeFormat('tr-TR',{dateStyle:'short',timeStyle:'short'}).format(new Date(value)):'—';
const money=(cents,currency='USD')=>new Intl.NumberFormat('tr-TR',{style:'currency',currency:String(currency).toUpperCase()}).format(Number(cents||0)/100);
const empty=message=>`<p class="empty">${message}</p>`;
let data;

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
  if(type==='user') return `<button class="action ${status==='active'?'danger':'good'}" data-user="${id}" data-status="${status==='active'?'suspended':'active'}">${status==='active'?'Askıya al':'Aktifleştir'}</button>`;
  if(type==='report'&&status==='open') return `<div class="actions"><button class="action good" data-report="${id}" data-status="resolved">Çözüldü</button><button class="action" data-report="${id}" data-status="dismissed">Kapat</button></div>`;
  return '—';
}

function render(){
  const c=data.counts;
  $('#pending-badge').textContent=c.pendingListings; $('#report-badge').textContent=c.openReports;
  $('#metrics').innerHTML=[['Bugünkü ziyaretçi',c.visitorsToday,'Tekil'],['Son 7 gün',c.visitors7d,`${c.pageViews7d} görüntüleme`],['Toplam üye',c.users,`Bugün +${c.usersToday}`],['Toplam ilan',c.listings,`${c.pendingListings} onay bekliyor`],['Paket satışı',c.paidPurchases,'Başarılı ödeme'],['Toplam gelir',money(c.revenueCents),'Komisyonsuz'],['Açık şikâyet',c.openReports,'İnceleme bekliyor']].map(([label,value,note])=>`<article class="metric"><span>${label}</span><strong>${value}</strong><small>${note}</small></article>`).join('');
  const max=Math.max(1,...data.daily.flatMap(item=>[item.visitors,item.signups]));
  $('#chart').innerHTML=data.daily.map(item=>`<div class="day"><div class="bars"><i class="bar" title="${item.visitors} ziyaretçi" style="height:${Math.max(3,item.visitors/max*100)}%"></i><i class="bar signup" title="${item.signups} üyelik" style="height:${Math.max(3,item.signups/max*100)}%"></i></div><label>${new Date(item.day+'T12:00:00').toLocaleDateString('tr-TR',{weekday:'short'})}</label></div>`).join('');
  const funnel=data.analytics?.funnel||{visitors:0,signups:0,listings:0,conversations:0};
  const rate=value=>funnel.visitors?`%${(value/funnel.visitors*100).toFixed(1).replace('.',',')}`:'%0';
  $('#funnel-metrics').innerHTML=[['Ziyaretçi',funnel.visitors,'Başlangıç'],['Kayıt',funnel.signups,rate(funnel.signups)],['İlan yayınlama',funnel.listings,rate(funnel.listings)],['Yeni görüşme',funnel.conversations,rate(funnel.conversations)]].map(([label,value,note])=>`<article class="metric"><span>${label}</span><strong>${value}</strong><small>${note}</small></article>`).join('');
  $('#campaign-table').innerHTML=(data.analytics?.campaigns||[]).map(item=>`<tr><td><strong>${esc(item.source||'direct')}</strong></td><td>${esc(item.medium||'direct')}</td><td>${esc(item.campaign||'—')}</td><td>${item.visitors}</td><td>${item.signups}</td><td>${item.listings}</td><td>${item.conversations}</td></tr>`).join('')||`<tr><td colspan="7">${empty('Henüz ölçülebilen kampanya verisi yok.')}</td></tr>`;
  $('#pending-preview').innerHTML=data.pendingListings.slice(0,5).map(item=>`<div class="mini"><div><strong>${esc(item.title)}</strong><small>${esc(item.category)} · $${Number(item.askingPrice).toLocaleString('tr-TR')}</small></div>${actions(item.id,'pending','listing')}</div>`).join('')||empty('Bekleyen ilan yok.');
  $('#report-preview').innerHTML=data.reports.filter(item=>item.status==='open').slice(0,5).map(item=>`<div class="mini"><div><strong>${esc(item.targetLabel)}</strong><small>${esc(item.reason)}</small></div>${actions(item.id,item.status,'report')}</div>`).join('')||empty('Açık şikâyet yok.');
  $('#listing-table').innerHTML=data.recentListings.map(item=>`<tr><td><strong>${esc(item.title)}</strong><small>${esc(item.category)}</small></td><td>${esc(item.ownerName)}<small>${esc(item.ownerEmail||'E-posta yok')}</small></td><td>$${Number(item.askingPrice).toLocaleString('tr-TR')}</td><td><span class="badge ${item.status==='Aktif'||item.status==='Doğrulanmış'?'approved':item.status}">${esc(item.status)}</span></td><td>${actions(item.id,item.status,'listing')}</td></tr>`).join('');
  $('#user-table').innerHTML=data.users.map(user=>`<tr><td><strong>${esc(user.name)}</strong><small>${esc(user.email||'Örnek profil')}</small></td><td>${esc(user.role)}${user.isAdmin?' · Yönetici':''}</td><td>${user.buyerConnections} bağlantı<small>${user.sellerListingCredits} standart · ${user.sellerVipCredits} VIP ilan</small></td><td>${date(user.lastSeenAt)}</td><td>${user.isAdmin?'—':actions(user.id,user.status,'user')}</td></tr>`).join('');
  $('#purchase-table').innerHTML=data.purchases.map(item=>`<tr><td>${esc(item.userName)}<small>${esc(item.userEmail||'')}</small></td><td>${esc(item.packageKey)}</td><td>${money(item.amountCents,item.currency)}</td><td><span class="badge ${item.status}">${esc(item.status)}</span></td><td>${date(item.createdAt)}</td></tr>`).join('')||`<tr><td colspan="5">${empty('Henüz paket satışı yok.')}</td></tr>`;
  $('#report-table').innerHTML=data.reports.map(item=>`<tr><td>${esc(item.reporterName)}<small>${esc(item.reporterEmail||'')}</small></td><td>${esc(item.targetLabel)}<small>${esc(item.targetType)}</small></td><td>${esc(item.reason)}</td><td><span class="badge ${item.status}">${esc(item.status)}</span></td><td>${actions(item.id,item.status,'report')}</td></tr>`).join('')||`<tr><td colspan="5">${empty('Şikâyet yok.')}</td></tr>`;
}

async function load(){
  $('#notice').className='notice'; $('#notice').textContent='Veriler yükleniyor…';
  try{data=await SearyaApi.adminOverview();render();$('#notice').classList.add('hidden');}
  catch(error){$('#notice').className='notice error';$('#notice').innerHTML=`Yönetici oturumu gerekli. <a href="/">Ana sayfada giriş yap</a>`;}
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
