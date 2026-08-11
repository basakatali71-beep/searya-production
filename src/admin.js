import { SearyaApi } from './api.js?v=20260812-8';

const $=selector=>document.querySelector(selector);
const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const date=value=>value?new Intl.DateTimeFormat('en-US',{dateStyle:'medium',timeStyle:'short'}).format(new Date(value)):'—';
const money=(cents,currency='USD')=>new Intl.NumberFormat('en-US',{style:'currency',currency:String(currency).toUpperCase()}).format(Number(cents||0)/100);
const empty=message=>`<p class="empty">${message}</p>`;
const statusLabel=value=>({Aktif:'Active',Doğrulanmış:'Verified'}[value]||value);
let data;
let loading=false;

document.querySelectorAll('nav button').forEach(button=>button.addEventListener('click',()=>{
  document.querySelectorAll('nav button,.panel').forEach(item=>item.classList.remove('active'));
  button.classList.add('active'); $(`#${button.dataset.section}`).classList.add('active');
  $('#page-title').textContent=button.childNodes[0].textContent.trim();
}));

document.querySelectorAll('[data-search]').forEach(input=>input.addEventListener('input',()=>{
  const query=input.value.toLocaleLowerCase('en-US');
  document.querySelectorAll(`#${input.dataset.search} tr`).forEach(row=>row.hidden=!row.textContent.toLocaleLowerCase('en-US').includes(query));
}));

function actions(id,status,type){
  if(type==='listing'&&status==='pending') return `<div class="actions"><button class="action good" data-listing="${id}" data-action="approve">Approve</button><button class="action" data-listing="${id}" data-action="verify">Verify</button><button class="action danger" data-listing="${id}" data-action="reject">Reject</button></div>`;
  if(type==='user') return `<button class="action ${status==='active'?'danger':'good'}" data-user="${id}" data-status="${status==='active'?'suspended':'active'}">${status==='active'?'Suspend':'Activate'}</button>`;
  if(type==='report'&&status==='open') return `<div class="actions"><button class="action good" data-report="${id}" data-status="resolved">Resolve</button><button class="action" data-report="${id}" data-status="dismissed">Dismiss</button></div>`;
  return '—';
}

function render(){
  const c=data.counts;
  const presence=data.analytics?.presence||{activeNow:0,enteredToday:0,exitedToday:0,updatedAt:null};
  $('#live-metrics').innerHTML=[['Active now',presence.activeNow,'Last 2 minutes'],['Entered today',presence.enteredToday,'Unique visitors'],['Left today',presence.exitedToday,'Exit or timeout']].map(([label,value,note],index)=>`<article class="metric ${index===0?'metric-live':''}"><span>${label}</span><strong>${value}</strong><small>${note}</small></article>`).join('');
  $('#live-updated').textContent=presence.updatedAt?`Updated ${new Intl.DateTimeFormat('en-US',{hour:'2-digit',minute:'2-digit',second:'2-digit'}).format(new Date(presence.updatedAt))}`:'—';
  $('#pending-badge').textContent=c.pendingListings; $('#report-badge').textContent=c.openReports;
  $('#metrics').innerHTML=[['Visitors today',c.visitorsToday,'Unique'],['Last 7 days',c.visitors7d,`${c.pageViews7d} page views`],['Total users',c.users,`+${c.usersToday} today`],['Total listings',c.listings,`${c.pendingListings} pending approval`],['Plan sales',c.paidPurchases,'Successful payments'],['Total revenue',money(c.revenueCents),'No commission'],['Open reports',c.openReports,'Pending review']].map(([label,value,note])=>`<article class="metric"><span>${label}</span><strong>${value}</strong><small>${note}</small></article>`).join('');
  const max=Math.max(1,...data.daily.flatMap(item=>[item.visitors,item.signups]));
  $('#chart').innerHTML=data.daily.map(item=>`<div class="day"><div class="bars"><i class="bar" title="${item.visitors} visitors" style="height:${Math.max(3,item.visitors/max*100)}%"></i><i class="bar signup" title="${item.signups} sign-ups" style="height:${Math.max(3,item.signups/max*100)}%"></i></div><label>${new Date(item.day+'T12:00:00').toLocaleDateString('en-US',{weekday:'short'})}</label></div>`).join('');
  const funnel=data.analytics?.funnel||{visitors:0,signups:0,listings:0,conversations:0};
  const rate=value=>funnel.visitors?`${(value/funnel.visitors*100).toFixed(1)}%`:'0%';
  $('#funnel-metrics').innerHTML=[['Visitors',funnel.visitors,'Starting point'],['Sign-ups',funnel.signups,rate(funnel.signups)],['Published listings',funnel.listings,rate(funnel.listings)],['New conversations',funnel.conversations,rate(funnel.conversations)]].map(([label,value,note])=>`<article class="metric"><span>${label}</span><strong>${value}</strong><small>${note}</small></article>`).join('');
  $('#campaign-table').innerHTML=(data.analytics?.campaigns||[]).map(item=>`<tr><td><strong>${esc(item.source||'direct')}</strong></td><td>${esc(item.medium||'direct')}</td><td>${esc(item.campaign||'—')}</td><td>${item.visitors}</td><td>${item.signups}</td><td>${item.listings}</td><td>${item.conversations}</td></tr>`).join('')||`<tr><td colspan="7">${empty('No measurable campaign data yet.')}</td></tr>`;
  $('#pending-preview').innerHTML=data.pendingListings.slice(0,5).map(item=>`<div class="mini"><div><strong>${esc(item.title)}</strong><small>${esc(item.category)} · $${Number(item.askingPrice).toLocaleString('en-US')}</small></div>${actions(item.id,'pending','listing')}</div>`).join('')||empty('No pending listings.');
  $('#report-preview').innerHTML=data.reports.filter(item=>item.status==='open').slice(0,5).map(item=>`<div class="mini"><div><strong>${esc(item.targetLabel)}</strong><small>${esc(item.reason)}</small></div>${actions(item.id,item.status,'report')}</div>`).join('')||empty('No open reports.');
  $('#listing-table').innerHTML=data.recentListings.map(item=>`<tr><td><strong>${esc(item.title)}</strong><small>${esc(item.category)}</small></td><td>${esc(item.ownerName)}<small>${esc(item.ownerEmail||'No email')}</small></td><td>$${Number(item.askingPrice).toLocaleString('en-US')}</td><td><span class="badge ${['Active','Verified','Aktif','Doğrulanmış'].includes(item.status)?'approved':item.status}">${esc(statusLabel(item.status))}</span></td><td>${actions(item.id,item.status,'listing')}</td></tr>`).join('');
  $('#user-table').innerHTML=data.users.map(user=>`<tr><td><strong>${esc(user.name)}</strong><small>${esc(user.email||'Sample profile')}</small></td><td>${esc(user.role)}${user.isAdmin?' · Administrator':''}</td><td>${user.buyerConnections} connections<small>${user.sellerListingCredits} standard · ${user.sellerVipCredits} VIP listings</small></td><td>${date(user.lastSeenAt)}</td><td>${user.isAdmin?'—':actions(user.id,user.status,'user')}</td></tr>`).join('');
  $('#purchase-table').innerHTML=data.purchases.map(item=>`<tr><td>${esc(item.userName)}<small>${esc(item.userEmail||'')}</small></td><td>${esc(item.packageKey)}</td><td>${money(item.amountCents,item.currency)}</td><td><span class="badge ${item.status}">${esc(item.status)}</span></td><td>${date(item.createdAt)}</td></tr>`).join('')||`<tr><td colspan="5">${empty('No plan sales yet.')}</td></tr>`;
  $('#report-table').innerHTML=data.reports.map(item=>`<tr><td>${esc(item.reporterName)}<small>${esc(item.reporterEmail||'')}</small></td><td>${esc(item.targetLabel)}<small>${esc(item.targetType)}</small></td><td>${esc(item.reason)}</td><td><span class="badge ${item.status}">${esc(item.status)}</span></td><td>${actions(item.id,item.status,'report')}</td></tr>`).join('')||`<tr><td colspan="5">${empty('No reports.')}</td></tr>`;
}

async function load({silent=false}={}){
  if(loading)return;
  loading=true;
  if(!silent){$('#notice').className='notice';$('#notice').textContent='Loading data…';}
  try{data=await SearyaApi.adminOverview();render();$('#notice').classList.add('hidden');}
  catch(error){if(!silent){$('#notice').className='notice error';$('#notice').innerHTML=`Administrator sign-in required. <a href="/">Sign in on the home page</a>`;}}
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
