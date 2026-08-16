const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const TOOL_PATHS = {
  '/qr-code-generator': 'qr',
  '/time-card-calculator': 'time',
  '/work-hours-calculator': 'time',
  '/invoice-generator': 'document',
  '/quote-generator': 'document',
  '/receipt-maker': 'document',
  '/digital-business-card': 'card',
  '/digital-business-card-maker': 'card',
  '/qr-business-card': 'card',
  '/virtual-business-card': 'card'
};
const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
let qrObjectUrl = '';
let cardQrObjectUrl = '';
let cardPhotoObjectUrl = '';
let cardQrTimer = null;
let lastTimeResult = null;
let toastTimer = null;

function escapeHtml(value='') {
  return String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
}

function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
}

function track(eventName, metadata={}) {
  fetch('/api/analytics/event', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body:JSON.stringify({ eventName, metadata }), keepalive:true
  }).catch(() => {});
}

function routeTool() {
  const key = TOOL_PATHS[location.pathname.replace(/\/$/,'')];
  if (!key) return;
  $('#home-hero').hidden = true;
  $('#tools').hidden = true;
  $('#how-it-works').hidden = true;
  $('#pricing').hidden = true;
  $('#tool-workspace').hidden = false;
  $$('[data-tool-panel]').forEach(panel => panel.classList.toggle('active', panel.dataset.toolPanel === key));
  if (key === 'document') {
    const wanted = location.pathname.includes('quote') ? 'quote' : location.pathname.includes('receipt') ? 'receipt' : 'invoice';
    $('#doc-type').value = wanted;
    syncDocumentType();
  }
  track('tool_opened', { tool:key, path:location.pathname });
}

async function generateQr(event) {
  event?.preventDefault();
  const content = $('#qr-content').value.trim();
  if (!content) return showToast('Enter a URL or some text first.');
  const url = `/api/tools/qr?text=${encodeURIComponent(content)}&dark=${encodeURIComponent($('#qr-dark').value)}&light=${encodeURIComponent($('#qr-light').value)}`;
  const button = $('#qr-form button[type=submit]');
  button.disabled = true;
  button.textContent = 'Generating…';
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error((await response.json().catch(()=>null))?.error?.message || 'QR code could not be generated.');
    const blob = await response.blob();
    if (qrObjectUrl) URL.revokeObjectURL(qrObjectUrl);
    qrObjectUrl = URL.createObjectURL(blob);
    $('#qr-image').src = qrObjectUrl;
    $('#qr-image').hidden = false;
    $('#qr-placeholder').hidden = true;
    $('#qr-actions').hidden = false;
    track('tool_completed',{tool:'qr'});
  } catch (error) { showToast(error.message); }
  finally { button.disabled = false; button.innerHTML = '<i class="ph-bold ph-sparkle"></i> Generate QR code'; }
}

function downloadQr() {
  if (!qrObjectUrl) return;
  const anchor = document.createElement('a');
  anchor.href = qrObjectUrl;
  anchor.download = 'searya-qr-code.svg';
  anchor.click();
  track('tool_exported',{tool:'qr',format:'svg'});
}

function buildTimeRows() {
  $('#time-rows').innerHTML = DAYS.map((day,index) => `<tr data-day="${day}"><td>${day.slice(0,3)}</td><td><input aria-label="${day} clock in" class="clock-in" type="time" value="${index<5?'09:00':''}"></td><td><input aria-label="${day} clock out" class="clock-out" type="time" value="${index<5?'17:00':''}"></td><td><input aria-label="${day} break minutes" class="break-min" type="number" min="0" max="1440" value="${index<5?'30':'0'}"></td><td class="day-total">0h 00m</td></tr>`).join('');
}

function minutesFromTime(value) {
  if (!/^\d{2}:\d{2}$/.test(value)) return null;
  const [hours,minutes] = value.split(':').map(Number);
  return hours*60+minutes;
}

function formatMinutes(value) {
  const safe = Math.max(0,Math.round(value));
  return `${Math.floor(safe/60)}h ${String(safe%60).padStart(2,'0')}m`;
}

function calculateTime({silent=false}={}) {
  const entries = $$('tr[data-day]').map(row => {
    const startValue = row.querySelector('.clock-in').value;
    const endValue = row.querySelector('.clock-out').value;
    const start = minutesFromTime(startValue);
    let end = minutesFromTime(endValue);
    const breakMinutes = Math.max(0,Number(row.querySelector('.break-min').value)||0);
    let minutes = 0;
    if (start !== null && end !== null) {
      if (end < start) end += 24*60;
      minutes = Math.max(0,end-start-breakMinutes);
    }
    row.querySelector('.day-total').textContent = formatMinutes(minutes);
    return {day:row.dataset.day,start:startValue,end:endValue,breakMinutes,minutes};
  });
  const totalMinutes = entries.reduce((sum,item)=>sum+item.minutes,0);
  const overtimeThreshold = Math.max(0,Number($('#overtime-after').value)||40)*60;
  const overtimeMinutes = Math.max(0,totalMinutes-overtimeThreshold);
  const regularMinutes = totalMinutes-overtimeMinutes;
  const hourlyRate = Math.max(0,Number($('#hourly-rate').value)||0);
  const multiplier = Math.max(1,Number($('#overtime-rate').value)||1.5);
  const pay = regularMinutes/60*hourlyRate + overtimeMinutes/60*hourlyRate*multiplier;
  $('#regular-hours').textContent = formatMinutes(regularMinutes);
  $('#overtime-hours').textContent = formatMinutes(overtimeMinutes);
  $('#total-hours').textContent = formatMinutes(totalMinutes);
  $('#gross-pay').textContent = new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(pay);
  lastTimeResult = {entries,regularMinutes,overtimeMinutes,totalMinutes,hourlyRate,multiplier,pay};
  if (!silent) { showToast('Workweek calculated.'); track('tool_completed',{tool:'time_card',hours:(totalMinutes/60).toFixed(2)}); }
}

function fillTimeExample() {
  const examples = [['08:30','17:15',45],['08:40','17:30',30],['08:25','18:00',45],['09:00','17:30',30],['08:15','16:45',30],['','',0],['','',0]];
  $$('tr[data-day]').forEach((row,index) => {
    row.querySelector('.clock-in').value=examples[index][0]; row.querySelector('.clock-out').value=examples[index][1]; row.querySelector('.break-min').value=examples[index][2];
  });
  calculateTime({silent:true});
}

function resetTime() {
  buildTimeRows();
  $('#hourly-rate').value='20'; $('#overtime-after').value='40'; $('#overtime-rate').value='1.5';
  calculateTime({silent:true});
}

function downloadTimesheet() {
  calculateTime({silent:true});
  const rows = [['Day','Clock in','Clock out','Break minutes','Hours'],...lastTimeResult.entries.map(item=>[item.day,item.start,item.end,item.breakMinutes,(item.minutes/60).toFixed(2)]),[],['Regular hours',(lastTimeResult.regularMinutes/60).toFixed(2)],['Overtime hours',(lastTimeResult.overtimeMinutes/60).toFixed(2)],['Estimated gross pay',lastTimeResult.pay.toFixed(2)]];
  const csv = rows.map(row=>row.map(cell=>`"${String(cell??'').replaceAll('"','""')}"`).join(',')).join('\n');
  const anchor=document.createElement('a'); anchor.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'})); anchor.download='searya-timesheet.csv'; anchor.click(); URL.revokeObjectURL(anchor.href);
  track('tool_exported',{tool:'time_card',format:'csv'});
}

function addLineItem(description='',quantity=1,rate=0) {
  const row=document.createElement('div'); row.className='line-item';
  row.innerHTML=`<input class="item-description" aria-label="Item description" placeholder="Service or product" maxlength="120" value="${escapeHtml(description)}"><input class="item-quantity" aria-label="Quantity" type="number" min="0" step="0.01" value="${quantity}"><input class="item-rate" aria-label="Rate" type="number" min="0" step="0.01" value="${rate}"><button class="remove-line" type="button" aria-label="Remove line"><i class="ph-bold ph-trash"></i></button>`;
  row.querySelector('.remove-line').addEventListener('click',()=>{ if ($$('.line-item').length>1) row.remove(); updateDocumentPreview(); });
  row.querySelectorAll('input').forEach(input=>input.addEventListener('input',updateDocumentPreview));
  $('#line-items').append(row); updateDocumentPreview();
}

function syncDocumentType() {
  const type=$('#doc-type').value;
  const names={invoice:'Invoice Generator',quote:'Quote Generator',receipt:'Receipt Maker'};
  $('#document-title').textContent=names[type];
  const prefixes={invoice:'INV',quote:'QUO',receipt:'REC'};
  if (!$('#doc-number').value || /^(INV|QUO|REC)-/.test($('#doc-number').value)) $('#doc-number').value=`${prefixes[type]}-1001`;
  updateDocumentPreview();
}

function documentValues() {
  const currency=$('#currency').value;
  const items=$$('.line-item').map(row=>({description:row.querySelector('.item-description').value.trim()||'Item',quantity:Math.max(0,Number(row.querySelector('.item-quantity').value)||0),rate:Math.max(0,Number(row.querySelector('.item-rate').value)||0)}));
  const subtotal=items.reduce((sum,item)=>sum+item.quantity*item.rate,0);
  const discountRate=Math.min(100,Math.max(0,Number($('#discount').value)||0));
  const taxRate=Math.min(100,Math.max(0,Number($('#tax').value)||0));
  const discount=subtotal*discountRate/100;
  const tax=(subtotal-discount)*taxRate/100;
  return {type:$('#doc-type').value,number:$('#doc-number').value.trim(),business:$('#business-name').value.trim(),businessEmail:$('#business-email').value.trim(),client:$('#client-name').value.trim(),clientEmail:$('#client-email').value.trim(),issueDate:$('#issue-date').value,dueDate:$('#due-date').value,currency,items,subtotal,discountRate,discount,taxRate,tax,total:subtotal-discount+tax,notes:$('#doc-notes').value.trim()};
}

function money(value,symbol) { return `${symbol}${Number(value||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}`; }
function readableDate(value) { if(!value)return '—'; const date=new Date(`${value}T12:00:00`); return new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',year:'numeric'}).format(date); }

function updateDocumentPreview() {
  if (!$('#document-preview')) return;
  const doc=documentValues();
  const typeLabel={invoice:'Invoice',quote:'Quote',receipt:'Receipt'}[doc.type];
  const dateLabel=doc.type==='receipt'?'Payment date':'Issue date';
  $('#document-preview').innerHTML=`<div class="doc-head"><div><h2>${typeLabel}</h2><p>${escapeHtml(doc.business||'Your business')}</p><p>${escapeHtml(doc.businessEmail)}</p></div><div class="doc-number"><strong># ${escapeHtml(doc.number||'1001')}</strong><p>${dateLabel}: ${readableDate(doc.issueDate)}</p>${doc.type==='receipt'?'':`<p>${doc.type==='quote'?'Valid until':'Due date'}: ${readableDate(doc.dueDate)}</p>`}</div></div><div class="doc-parties"><div><strong>From</strong><p>${escapeHtml(doc.business||'Your business')}</p><p>${escapeHtml(doc.businessEmail)}</p></div><div><strong>${doc.type==='receipt'?'Received from':'Bill to'}</strong><p>${escapeHtml(doc.client||'Client name')}</p><p>${escapeHtml(doc.clientEmail)}</p></div></div><table class="doc-table"><thead><tr><th>Description</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead><tbody>${doc.items.map(item=>`<tr><td>${escapeHtml(item.description)}</td><td>${item.quantity}</td><td>${money(item.rate,doc.currency)}</td><td>${money(item.quantity*item.rate,doc.currency)}</td></tr>`).join('')}</tbody></table><div class="doc-totals"><div class="doc-total-row"><span>Subtotal</span><span>${money(doc.subtotal,doc.currency)}</span></div>${doc.discountRate?`<div class="doc-total-row"><span>Discount (${doc.discountRate}%)</span><span>−${money(doc.discount,doc.currency)}</span></div>`:''}${doc.taxRate?`<div class="doc-total-row"><span>Tax (${doc.taxRate}%)</span><span>${money(doc.tax,doc.currency)}</span></div>`:''}<div class="doc-total-row grand"><span>Total</span><span>${money(doc.total,doc.currency)}</span></div></div>${doc.notes?`<div class="doc-notes"><strong>Notes</strong><p>${escapeHtml(doc.notes)}</p></div>`:''}`;
}

function initializeDocument() {
  const today=new Date(); const due=new Date(today); due.setDate(today.getDate()+14);
  const iso=date=>date.toISOString().slice(0,10);
  $('#issue-date').value=iso(today); $('#due-date').value=iso(due);
  addLineItem('Professional services',1,250);
  $('#document-form').addEventListener('input',updateDocumentPreview);
  $('#doc-type').addEventListener('change',syncDocumentType);
  $('#add-line').addEventListener('click',()=>addLineItem('',1,0));
  $('#print-document').addEventListener('click',()=>{ updateDocumentPreview(); track('tool_exported',{tool:$('#doc-type').value,format:'pdf_print'}); window.print(); });
  updateDocumentPreview();
}

function businessCardValues() {
  return {
    name: $('#card-name').value.trim(), role: $('#card-role').value.trim(), company: $('#card-company').value.trim(),
    email: $('#card-email').value.trim(), phone: $('#card-phone').value.trim(), website: $('#card-website').value.trim(),
    linkedin: $('#card-linkedin').value.trim(), instagram: $('#card-instagram').value.trim(), location: $('#card-location').value.trim(),
    bio: $('#card-bio').value.trim(), services: $('#card-services').value.trim(), color: $('#card-color').value, theme: $('#card-theme').value
  };
}

function vcardEscape(value='') {
  return String(value).replaceAll('\\','\\\\').replaceAll('\n','\\n').replaceAll(';','\\;').replaceAll(',','\\,');
}

function makeVcard(card=businessCardValues()) {
  const lines=['BEGIN:VCARD','VERSION:3.0',`FN:${vcardEscape(card.name||'My business card')}`];
  if (card.role || card.company) lines.push(`TITLE:${vcardEscape(card.role)}`,`ORG:${vcardEscape(card.company)}`);
  if (card.email) lines.push(`EMAIL;TYPE=INTERNET:${vcardEscape(card.email)}`);
  if (card.phone) lines.push(`TEL;TYPE=CELL:${vcardEscape(card.phone)}`);
  if (card.website) lines.push(`URL:${vcardEscape(card.website)}`);
  if (card.linkedin) lines.push(`X-SOCIALPROFILE;TYPE=linkedin:${vcardEscape(card.linkedin)}`);
  if (card.instagram) lines.push(`X-SOCIALPROFILE;TYPE=instagram:${vcardEscape(card.instagram)}`);
  if (card.location) lines.push(`LABEL;TYPE=WORK:${vcardEscape(card.location)}`);
  if (card.bio) lines.push(`NOTE:${vcardEscape(card.bio)}`);
  lines.push('END:VCARD');
  return lines.filter(line => !line.endsWith(':')).join('\r\n');
}

async function refreshCardQr() {
  const image=$('#card-qr-image');
  if (!image) return;
  try {
    const response=await fetch(`/api/tools/qr?text=${encodeURIComponent(makeVcard())}&dark=%23172033&light=%23ffffff`);
    if (!response.ok) throw new Error('QR code could not be generated.');
    const blob=await response.blob();
    if (cardQrObjectUrl) URL.revokeObjectURL(cardQrObjectUrl);
    cardQrObjectUrl=URL.createObjectURL(blob); image.src=cardQrObjectUrl;
  } catch { image.removeAttribute('src'); }
}

function updateBusinessCard() {
  const card=businessCardValues();
  const initials=(card.name||'My Card').split(/\s+/).slice(0,2).map(word=>word[0]?.toUpperCase()||'').join('');
  const roleLine=[card.role,card.company].filter(Boolean).join(' · ') || 'Your professional headline';
  const services=card.services.split(',').map(item=>item.trim()).filter(Boolean).slice(0,3);
  const avatar=cardPhotoObjectUrl?`<img src="${cardPhotoObjectUrl}" alt="">`:escapeHtml(initials);
  const socials=[card.website&&'<span class="profile-social"><i class="ph-bold ph-globe"></i></span>',card.linkedin&&'<span class="profile-social"><i class="ph-bold ph-linkedin-logo"></i></span>',card.instagram&&'<span class="profile-social"><i class="ph-bold ph-instagram-logo"></i></span>'].filter(Boolean).join('');
  const preview=$('#business-card-preview');
  preview.className=`business-card-preview theme-${card.theme}`;
  preview.style.setProperty('--card-accent',card.color);
  preview.innerHTML=`<div class="profile-cover"></div><div class="profile-body"><div class="profile-avatar">${avatar}</div><div class="profile-name-row"><div><h2>${escapeHtml(card.name||'Your name')}</h2><p class="profile-role">${escapeHtml(roleLine)}</p>${card.location?`<span class="profile-location"><i class="ph-bold ph-map-pin"></i>${escapeHtml(card.location)}</span>`:''}</div><span class="profile-mark"><i class="ph-bold ph-sparkle"></i></span></div><p class="profile-bio">${escapeHtml(card.bio||'Add a short introduction so people know how you can help.')}</p><div class="profile-actions"><span class="profile-action primary"><i class="ph-bold ph-user-plus"></i>Save contact</span><span class="profile-action"><i class="ph-bold ph-chat-circle-dots"></i>Message</span><span class="profile-action"><i class="ph-bold ph-share-network"></i>Share</span></div>${services.length?`<section class="profile-section"><div class="profile-section-title"><strong>What I do</strong><span>${services.length} services</span></div><div class="profile-services">${services.map((service,index)=>`<div class="profile-service"><i class="ph-bold ${['ph-pen-nib','ph-layout','ph-chats-circle'][index]||'ph-sparkle'}"></i>${escapeHtml(service)}</div>`).join('')}</div></section>`:''}<section class="profile-section"><div class="profile-section-title"><strong>Connect</strong><span>Find me online</span></div><div class="profile-socials">${socials||'<span class="profile-social"><i class="ph-bold ph-plus"></i></span>'}</div></section><div class="profile-footer"><i class="ph-bold ph-sparkle"></i>Made with <b>Searya</b></div></div>`;
  try { localStorage.setItem('searya_business_card',JSON.stringify(card)); } catch {}
  clearTimeout(cardQrTimer); cardQrTimer=setTimeout(refreshCardQr,500);
}

function downloadVcard() {
  const card=businessCardValues();
  const anchor=document.createElement('a');
  anchor.href=URL.createObjectURL(new Blob([makeVcard(card)],{type:'text/vcard;charset=utf-8'}));
  anchor.download=`${(card.name||'searya-contact').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'searya-contact'}.vcf`;
  anchor.click(); URL.revokeObjectURL(anchor.href); track('tool_exported',{tool:'digital_business_card',format:'vcard'});
}

function downloadCardQr() {
  if (!cardQrObjectUrl) return showToast('Your contact QR code is still being prepared.');
  const anchor=document.createElement('a'); anchor.href=cardQrObjectUrl; anchor.download='searya-business-card-qr.svg'; anchor.click();
  track('tool_exported',{tool:'digital_business_card',format:'qr_svg'});
}

async function shareBusinessCard() {
  const card=businessCardValues();
  const text=[card.name,[card.role,card.company].filter(Boolean).join(' at '),card.phone,card.email,card.website].filter(Boolean).join('\n');
  try {
    if (navigator.share) await navigator.share({title:`${card.name||'My'} digital business card`,text});
    else { await navigator.clipboard.writeText(text); showToast('Contact details copied.'); }
    track('tool_exported',{tool:'digital_business_card',format:'share'});
  } catch (error) { if (error?.name!=='AbortError') showToast('Sharing is not available in this browser.'); }
}

function handleCardPhoto(event) {
  const file=event.target.files?.[0]; if (!file) return;
  if (!/^image\/(png|jpeg|webp)$/.test(file.type) || file.size>3*1024*1024) { event.target.value=''; return showToast('Choose a PNG, JPG or WebP image under 3 MB.'); }
  if (cardPhotoObjectUrl) URL.revokeObjectURL(cardPhotoObjectUrl);
  cardPhotoObjectUrl=URL.createObjectURL(file); updateBusinessCard();
}

function initializeBusinessCard() {
  const form=$('#business-card-form'); if (!form) return;
  try {
    const saved=JSON.parse(localStorage.getItem('searya_business_card')||'null');
    const fields={name:'card-name',role:'card-role',company:'card-company',email:'card-email',phone:'card-phone',website:'card-website',linkedin:'card-linkedin',instagram:'card-instagram',location:'card-location',bio:'card-bio',services:'card-services',color:'card-color',theme:'card-theme'};
    if (saved) Object.entries(fields).forEach(([key,id])=>{ if (typeof saved[key]==='string') $(`#${id}`).value=saved[key]; });
  } catch {}
  form.addEventListener('input',updateBusinessCard);
  $('#card-photo').addEventListener('change',handleCardPhoto);
  $('#download-vcard').addEventListener('click',downloadVcard);
  $('#share-card').addEventListener('click',shareBusinessCard);
  $('#download-card-qr').addEventListener('click',downloadCardQr);
  updateBusinessCard();
}

function initialize() {
  routeTool();
  $('#qr-form')?.addEventListener('submit',generateQr);
  $('#download-qr')?.addEventListener('click',downloadQr);
  $('#copy-qr')?.addEventListener('click',async()=>{ try{await navigator.clipboard.writeText($('#qr-content').value.trim());showToast('QR content copied.');}catch{showToast('Copy is not available in this browser.');} });
  buildTimeRows(); calculateTime({silent:true});
  $('#calculate-time')?.addEventListener('click',()=>calculateTime());
  $('#fill-example')?.addEventListener('click',fillTimeExample);
  $('#reset-time')?.addEventListener('click',resetTime);
  $('#download-timesheet')?.addEventListener('click',downloadTimesheet);
  initializeDocument();
  initializeBusinessCard();
  $$('a[href^="/"]').forEach(link=>link.addEventListener('click',()=>track('navigation_clicked',{href:link.getAttribute('href')})));
}

initialize();
