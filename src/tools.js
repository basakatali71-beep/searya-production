import { SearyaApi } from './api.js';
import { calculateSalesTax, calculateJobCost, calculateHourlyRate, calculateBreakEven } from './tool-calculations.js';
import { formatCurrency, normalizeCurrency, processImageFile } from './tool-utils.js?v=20260820-2';

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
  '/virtual-business-card': 'card',
  '/email-signature-generator': 'signature',
  '/expense-tracker': 'expenses',
  '/profit-margin-calculator': 'margin',
  '/sales-tax-calculator': 'salesTax',
  '/estimate-generator': 'estimate',
  '/job-cost-calculator': 'jobCost',
  '/hourly-rate-calculator': 'hourlyRate',
  '/break-even-calculator': 'breakEven'
};
const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
let qrObjectUrl = '';
let cardQrObjectUrl = '';
let cardPhotoObjectUrl = '';
let cardPhotoData = '';
let cardLogoData = '';
let qrLogoData = '';
let signaturePhotoData = '';
let signatureLogoData = '';
let documentLogoData = '';
let businessProfilePhotoData = '';
let businessProfileLogoData = '';
let cardQrTimer = null;
let lastTimeResult = null;
let toastTimer = null;
let currentUser = null;
let currentBusinessProfile = null;
let workspaceContacts = [];
let workspaceCatalogItems = [];
let presenceTimer = null;
const presenceSessionId = crypto.randomUUID();

function escapeHtml(value='') {
  return String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
}

function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 4200);
}

function track(eventName, metadata={}) {
  fetch('/api/analytics/event', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body:JSON.stringify({ eventName, metadata }), keepalive:true
  }).catch(() => {});
}

async function fileToDataUrl(file, options={}) { return (await processImageFile(file, options)).dataUrl; }

function addLogoToQrSvg(svgText, logoData) {
  if (!logoData) return svgText;
  const logo=`<rect x="294" y="294" width="180" height="180" rx="34" fill="#fff"/><image href="${logoData.replaceAll('&','&amp;').replaceAll('"','&quot;')}" x="318" y="318" width="132" height="132" preserveAspectRatio="xMidYMid meet"/>`;
  return svgText.replace('</svg>',`${logo}</svg>`);
}

function routeTool() {
  const pathname=location.pathname.replace(/\/$/,'')||'/';
  if(pathname==='/tools'){
    $('#home-hero').hidden=true;$('#how-it-works').hidden=true;$('#pricing').hidden=true;$('#tool-workspace').hidden=true;$('#tools').hidden=false;
    return;
  }
  if(pathname==='/pricing'){
    $('#home-hero').hidden=true;$('#how-it-works').hidden=true;$('#tools').hidden=true;$('#tool-workspace').hidden=true;$('#pricing').hidden=false;
    return;
  }
  const basePath = Object.keys(TOOL_PATHS).find(path => pathname === path || pathname.startsWith(`${path}/`));
  const key = TOOL_PATHS[basePath];
  if (!key) return;
  $('#home-hero').hidden = true;
  $('#tools').hidden = true;
  $('#how-it-works').hidden = true;
  $('#pricing').hidden = true;
  $('#tool-workspace').hidden = false;
  $$('[data-tool-panel]').forEach(panel => panel.classList.toggle('active', panel.dataset.toolPanel === key));
  $('#save-tool-top').hidden = !['qr','time','document','card','signature','expenses','margin','estimate'].includes(key);
  if (key === 'document') {
    const wanted = location.pathname.includes('quote') ? 'quote' : location.pathname.includes('receipt') ? 'receipt' : 'invoice';
    $('#doc-type').value = wanted;
    if (pathname.startsWith('/invoice-generator/')) updateDocumentPreview();
    else syncDocumentType();
  }
  track('tool_opened', { tool:key, path:location.pathname });
}

async function generateQr(event) {
  event?.preventDefault();
  const content = $('#qr-content').value.trim();
  if (!content) return showToast('Enter a URL or some text first.');
  const url = `/api/tools/qr?text=${encodeURIComponent(content)}&dark=${encodeURIComponent($('#qr-dark').value)}&light=${encodeURIComponent($('#qr-light').value)}${qrLogoData?'&logo=1':''}`;
  const button = $('#qr-form button[type=submit]');
  button.disabled = true;
  button.textContent = 'Generating…';
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error((await response.json().catch(()=>null))?.error?.message || 'QR code could not be generated.');
    let blob = await response.blob();
    if (qrLogoData) blob = new Blob([addLogoToQrSvg(await blob.text(),qrLogoData)],{type:'image/svg+xml'});
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
  $('#time-rows').innerHTML = DAYS.map((day,index) => `<tr data-day="${day}"><td>${day.slice(0,3)}</td><td><input aria-label="${day} clock in" class="clock-in time-entry" type="text" inputmode="text" placeholder="9:00 AM" value="${index<5?'9:00 AM':''}"></td><td><input aria-label="${day} clock out" class="clock-out time-entry" type="text" inputmode="text" placeholder="5:00 PM" value="${index<5?'5:00 PM':''}"></td><td><input aria-label="${day} break minutes" class="break-min" type="number" min="0" max="1440" value="${index<5?'30':'0'}"></td><td class="day-total">0h 00m</td></tr>`).join('');
  $$('#time-rows input').forEach(input=>input.addEventListener('input',()=>calculateTime({silent:true})));
  $$('#time-rows .time-entry').forEach(input=>input.addEventListener('blur',()=>{if(minutesFromTime(input.value)!==null)input.value=displayTime(input.value);calculateTime({silent:true});}));
}

function minutesFromTime(value) {
  const text=String(value||'').trim().toUpperCase();
  const twelve=text.match(/^(1[0-2]|0?[1-9])(?::([0-5]\d))?\s*(AM|PM)$/);
  if(twelve){let hours=Number(twelve[1])%12;if(twelve[3]==='PM')hours+=12;return hours*60+Number(twelve[2]||0);}
  const legacy=text.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
  return legacy?Number(legacy[1])*60+Number(legacy[2]):null;
}

function displayTime(value){const minutes=minutesFromTime(value);if(minutes===null)return String(value||'');const hours24=Math.floor(minutes/60)%24,minutePart=minutes%60,period=hours24>=12?'PM':'AM',hours12=hours24%12||12;return `${hours12}:${String(minutePart).padStart(2,'0')} ${period}`;}

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
  $('#decimal-hours').textContent = `${(totalMinutes/60).toFixed(2)} hours`;
  $('#gross-pay').textContent = new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(pay);
  lastTimeResult = {entries,regularMinutes,overtimeMinutes,totalMinutes,hourlyRate,multiplier,overtimeAfter:overtimeThreshold/60,pay};
  if (!silent) { showToast('Workweek calculated.'); track('tool_completed',{tool:'time_card',hours:(totalMinutes/60).toFixed(2)}); }
}

function fillTimeExample() {
  const examples = [['8:30 AM','5:15 PM',45],['8:40 AM','5:30 PM',30],['8:25 AM','6:00 PM',45],['9:00 AM','5:30 PM',30],['8:15 AM','4:45 PM',30],['','',0],['','',0]];
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
  row.querySelector('.remove-line').addEventListener('click',()=>{ if ($$('#line-items .line-item').length>1) row.remove(); updateDocumentPreview(); });
  row.querySelectorAll('input').forEach(input=>input.addEventListener('input',updateDocumentPreview));
  $('#line-items').append(row); updateDocumentPreview();
}

function syncDocumentType() {
  const type=$('#doc-type').value;
  const names={invoice:'Free Invoice & Business Document Generator',quote:'Free Quote Generator',receipt:'Free Receipt Maker'};
  if(!location.pathname.startsWith('/invoice-generator/'))$('#document-title').textContent=names[type];
  const prefixes={invoice:'INV',quote:'QUO',receipt:'REC'};
  if (!$('#doc-number').value || /^(INV|QUO|REC)-/.test($('#doc-number').value)) $('#doc-number').value=`${prefixes[type]}-1001`;
  updateDocumentPreview();
}

function documentValues() {
  const currency=$('#currency').value;
  const items=$$('#line-items .line-item').map(row=>({description:row.querySelector('.item-description').value.trim()||'Item',quantity:Math.max(0,Number(row.querySelector('.item-quantity').value)||0),rate:Math.max(0,Number(row.querySelector('.item-rate').value)||0)}));
  const subtotal=items.reduce((sum,item)=>sum+item.quantity*item.rate,0);
  const discountRate=Math.min(100,Math.max(0,Number($('#discount').value)||0));
  const taxRate=Math.min(100,Math.max(0,Number($('#tax').value)||0));
  const discount=subtotal*discountRate/100;
  const tax=(subtotal-discount)*taxRate/100;
  return {type:$('#doc-type').value,number:$('#doc-number').value.trim(),template:$('#document-template').value,business:$('#business-name').value.trim(),businessEmail:$('#business-email').value.trim(),businessAddress:$('#business-address').value.trim(),businessPhone:$('#business-phone').value.trim(),businessWebsite:$('#business-website').value.trim(),client:$('#client-name').value.trim(),clientCompany:$('#client-company').value.trim(),clientEmail:$('#client-email').value.trim(),clientPhone:$('#client-phone').value.trim(),clientAddress:$('#client-address').value.trim(),issueDate:$('#issue-date').value,dueDate:$('#due-date').value,currency:normalizeCurrency(currency),items,subtotal,discountRate,discount,taxRate,tax,total:subtotal-discount+tax,paymentTerms:$('#payment-terms').value.trim(),notes:$('#doc-notes').value.trim(),logo:documentLogoData};
}

function money(value,currency='USD') { return formatCurrency(value,currency); }
function readableDate(value) { if(!value)return '—'; const date=new Date(`${value}T12:00:00`); return new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',year:'numeric'}).format(date); }

function updateDocumentPreview() {
  if (!$('#document-preview')) return;
  const doc=documentValues();
  $('#document-preview').className=`document-preview template-${doc.template}`;
  const typeLabel={invoice:'Invoice',quote:'Quote',receipt:'Receipt'}[doc.type];
  const dateLabel=doc.type==='receipt'?'Payment date':'Issue date';
  $('#document-preview').innerHTML=`<div class="doc-head"><div>${doc.logo?`<img class="document-logo" src="${doc.logo}" alt="Business logo">`:''}<h2>${typeLabel}</h2><p>${escapeHtml(doc.business||'Your business')}</p><p>${escapeHtml(doc.businessAddress)}</p><p>${escapeHtml([doc.businessEmail,doc.businessPhone].filter(Boolean).join(' · '))}</p><p>${escapeHtml(doc.businessWebsite)}</p></div><div class="doc-number"><strong># ${escapeHtml(doc.number||'1001')}</strong><p>${dateLabel}: ${readableDate(doc.issueDate)}</p>${doc.type==='receipt'?'':`<p>${doc.type==='quote'?'Valid until':'Due date'}: ${readableDate(doc.dueDate)}</p>`}</div></div><div class="doc-parties"><div><strong>From</strong><p>${escapeHtml(doc.business||'Your business')}</p><p>${escapeHtml(doc.businessAddress)}</p></div><div><strong>${doc.type==='receipt'?'Received from':'Bill to'}</strong><p>${escapeHtml(doc.client||'Client name')}</p><p>${escapeHtml(doc.clientCompany)}</p><p>${escapeHtml(doc.clientAddress)}</p><p>${escapeHtml([doc.clientEmail,doc.clientPhone].filter(Boolean).join(' · '))}</p></div></div><table class="doc-table"><thead><tr><th>Description</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead><tbody>${doc.items.map(item=>`<tr><td>${escapeHtml(item.description)}</td><td>${item.quantity}</td><td>${money(item.rate,doc.currency)}</td><td>${money(item.quantity*item.rate,doc.currency)}</td></tr>`).join('')}</tbody></table><div class="doc-totals"><div class="doc-total-row"><span>Subtotal</span><span>${money(doc.subtotal,doc.currency)}</span></div>${doc.discountRate?`<div class="doc-total-row"><span>Discount (${doc.discountRate}%)</span><span>−${money(doc.discount,doc.currency)}</span></div>`:''}${doc.taxRate?`<div class="doc-total-row"><span>Tax (${doc.taxRate}%)</span><span>${money(doc.tax,doc.currency)}</span></div>`:''}<div class="doc-total-row grand"><span>Total</span><span>${money(doc.total,doc.currency)}</span></div></div>${doc.paymentTerms?`<div class="doc-notes"><strong>Payment terms</strong><p>${escapeHtml(doc.paymentTerms)}</p></div>`:''}${doc.notes?`<div class="doc-notes"><strong>Notes</strong><p>${escapeHtml(doc.notes)}</p></div>`:''}`;
}

function initializeDocument() {
  const today=new Date(); const due=new Date(today); due.setDate(today.getDate()+14);
  const iso=date=>date.toISOString().slice(0,10);
  $('#issue-date').value=iso(today); $('#due-date').value=iso(due);
  addLineItem('Professional services',1,250);
  $('#document-form').addEventListener('input',updateDocumentPreview);
  $('#doc-type').addEventListener('change',syncDocumentType);
  $('#add-line').addEventListener('click',()=>addLineItem('',1,0));
  $('#apply-profile-document')?.addEventListener('click',()=>applyBusinessProfile('document'));
  $('#document-contact-select')?.addEventListener('change',event=>applyContact(workspaceContacts.find(contact=>contact.id===event.target.value),'document'));
  $('#save-document-contact')?.addEventListener('click',()=>saveContactFrom('document'));
  $('#save-first-document-item')?.addEventListener('click',()=>saveCatalogFrom('document'));
  $('#add-catalog-to-document')?.addEventListener('click',()=>{const item=workspaceCatalogItems.find(entry=>entry.id===$('#document-catalog-select').value);if(!item)return showToast('Choose a saved service first.');addLineItem(item.description||item.name,1,item.defaultRate);$('#currency').value=item.currency;updateDocumentPreview();});
  $('#document-logo').addEventListener('change',async event=>{try{documentLogoData=await fileToDataUrl(event.target.files?.[0],{maxDimension:1200});$('#remove-document-logo').hidden=false;updateDocumentPreview();}catch(error){event.target.value='';showToast(error.message);}});
  $('#remove-document-logo').addEventListener('click',()=>{documentLogoData='';$('#document-logo').value='';$('#remove-document-logo').hidden=true;updateDocumentPreview();});
  $('#print-document').addEventListener('click',()=>{ updateDocumentPreview(); track('tool_exported',{tool:$('#doc-type').value,format:'pdf_print'}); window.print(); });
  updateDocumentPreview();
}

function businessCardValues() {
  return {
    name: $('#card-name').value.trim(), role: $('#card-role').value.trim(), company: $('#card-company').value.trim(),
    email: $('#card-email').value.trim(), phone: $('#card-phone').value.trim(), website: $('#card-website').value.trim(),
    linkedin: $('#card-linkedin').value.trim(), instagram: $('#card-instagram').value.trim(), location: $('#card-location').value.trim(),
    bio: $('#card-bio').value.trim(), services: $('#card-services').value.trim(), color: $('#card-color').value, theme: $('#card-theme').value,
    ctaType: $('#card-cta-type').value, ctaLink: $('#card-cta-link').value.trim(), photo: cardPhotoData, logo: cardLogoData
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
    const response=await fetch(`/api/tools/qr?text=${encodeURIComponent(makeVcard())}&dark=%23172033&light=%23ffffff${cardLogoData?'&logo=1':''}`);
    if (!response.ok) throw new Error('QR code could not be generated.');
    let blob=await response.blob();
    if(cardLogoData)blob=new Blob([addLogoToQrSvg(await blob.text(),cardLogoData)],{type:'image/svg+xml'});
    if (cardQrObjectUrl) URL.revokeObjectURL(cardQrObjectUrl);
    cardQrObjectUrl=URL.createObjectURL(blob); image.src=cardQrObjectUrl;
  } catch { image.removeAttribute('src'); }
}

function updateBusinessCard() {
  const card=businessCardValues();
  const initials=(card.name||'My Card').split(/\s+/).slice(0,2).map(word=>word[0]?.toUpperCase()||'').join('');
  const roleLine=[card.role,card.company].filter(Boolean).join(' · ') || 'Your professional headline';
  const services=card.services.split(',').map(item=>item.trim()).filter(Boolean).slice(0,3);
  const avatar=cardPhotoData?`<img src="${cardPhotoData}" alt="">`:escapeHtml(initials);
  const logo=cardLogoData?`<img class="profile-brand-logo" src="${cardLogoData}" alt="${escapeHtml(card.company||'Company')} logo">`:`<span class="profile-mark"><i class="ph-bold ph-sparkle"></i></span>`;
  const professionLabels={realtor:'Property advisor',consultant:'Strategy & growth',healthcare:'Patient care',legal:'Trusted counsel',creative:'Selected work',trades:'Licensed service',fitness:'Performance coaching',hospitality:'Guest experience',tech:'Products & technology'};
  const ctaLabels={book:'Book a meeting',call:'Call now',email:'Send email',website:'Visit website'};
  const socials=[card.website&&'<span class="profile-social"><i class="ph-bold ph-globe"></i></span>',card.linkedin&&'<span class="profile-social"><i class="ph-bold ph-linkedin-logo"></i></span>',card.instagram&&'<span class="profile-social"><i class="ph-bold ph-instagram-logo"></i></span>'].filter(Boolean).join('');
  const preview=$('#business-card-preview');
  preview.className=`business-card-preview theme-${card.theme}`;
  preview.style.setProperty('--card-accent',card.color);
  preview.innerHTML=`<div class="profile-cover"><span>${escapeHtml(professionLabels[card.theme]||'Professional profile')}</span></div><div class="profile-body"><div class="profile-topline"><div class="profile-avatar">${avatar}</div>${logo}</div><div class="profile-name-row"><div><h2>${escapeHtml(card.name||'Your name')}</h2><p class="profile-role">${escapeHtml(roleLine)}</p>${card.location?`<span class="profile-location"><i class="ph-bold ph-map-pin"></i>${escapeHtml(card.location)}</span>`:''}</div></div><p class="profile-bio">${escapeHtml(card.bio||'Add a short introduction so people know how you can help.')}</p><div class="profile-primary-cta"><i class="ph-bold ${card.ctaType==='call'?'ph-phone':card.ctaType==='email'?'ph-envelope':card.ctaType==='website'?'ph-globe':'ph-calendar-check'}"></i>${escapeHtml(ctaLabels[card.ctaType]||'Connect')}</div><div class="profile-actions"><span class="profile-action primary"><i class="ph-bold ph-user-plus"></i>Save contact</span><span class="profile-action"><i class="ph-bold ph-chat-circle-dots"></i>Message</span><span class="profile-action"><i class="ph-bold ph-share-network"></i>Share</span></div>${services.length?`<section class="profile-section"><div class="profile-section-title"><strong>How I can help</strong><span>${services.length} services</span></div><div class="profile-services">${services.map((service,index)=>`<div class="profile-service"><i class="ph-bold ${['ph-check-circle','ph-star','ph-lightning'][index]||'ph-sparkle'}"></i>${escapeHtml(service)}</div>`).join('')}</div></section>`:''}<section class="profile-section"><div class="profile-section-title"><strong>Connect</strong><span>Find me online</span></div><div class="profile-socials">${socials||'<span class="profile-social"><i class="ph-bold ph-plus"></i></span>'}</div></section><div class="profile-footer"><i class="ph-bold ph-sparkle"></i>Made with <b>Searya</b></div></div>`;
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

async function handleCardImage(event,type='photo') {
  const file=event.target.files?.[0]; if (!file) return;
  try {
    const data=await fileToDataUrl(file,{maxDimension:type==='logo'?1200:1600});
    if(type==='photo') cardPhotoData=data; else cardLogoData=data;
    updateBusinessCard();
  } catch(error) { event.target.value=''; showToast(error.message); }
}

function initializeBusinessCard() {
  const form=$('#business-card-form'); if (!form) return;
  try {
    const saved=JSON.parse(localStorage.getItem('searya_business_card')||'null');
    const fields={name:'card-name',role:'card-role',company:'card-company',email:'card-email',phone:'card-phone',website:'card-website',linkedin:'card-linkedin',instagram:'card-instagram',location:'card-location',bio:'card-bio',services:'card-services',color:'card-color',theme:'card-theme',ctaType:'card-cta-type',ctaLink:'card-cta-link'};
    if (saved) Object.entries(fields).forEach(([key,id])=>{ if (typeof saved[key]==='string') $(`#${id}`).value=saved[key]; });
    if(saved?.photo)cardPhotoData=saved.photo;
    if(saved?.logo)cardLogoData=saved.logo;
  } catch {}
  form.addEventListener('input',updateBusinessCard);
  $('#card-photo').addEventListener('change',event=>handleCardImage(event,'photo'));
  $('#card-logo').addEventListener('change',event=>handleCardImage(event,'logo'));
  $('#download-vcard').addEventListener('click',downloadVcard);
  $('#share-card').addEventListener('click',shareBusinessCard);
  $('#download-card-qr').addEventListener('click',downloadCardQr);
  updateBusinessCard();
}

function signatureValues() {
  return {name:$('#signature-name').value.trim(),role:$('#signature-role').value.trim(),company:$('#signature-company').value.trim(),email:$('#signature-email').value.trim(),phone:$('#signature-phone').value.trim(),website:$('#signature-website').value.trim(),address:$('#signature-address').value.trim(),color:$('#signature-color').value,textColor:$('#signature-text-color').value,textSize:$('#signature-text-size').value,photoShape:$('#signature-photo-shape').value,template:$('[name="signature-template"]:checked')?.value||'classic',linkedin:$('#signature-linkedin').value.trim(),instagram:$('#signature-instagram').value.trim(),x:$('#signature-x').value.trim(),facebook:$('#signature-facebook').value.trim(),ctaEnabled:$('#signature-cta-enabled').checked,ctaPreset:$('#signature-cta-preset').value,ctaUrl:$('#signature-cta-url').value.trim(),ctaText:$('#signature-cta-text').value.trim(),photo:signaturePhotoData,logo:signatureLogoData};
}

function validWebUrl(value){try{const url=new URL(value);return ['http:','https:'].includes(url.protocol)?url.href:'';}catch{return '';}}

function signatureMarkup(values=signatureValues()) {
  const sizes={small:{name:15,body:10},medium:{name:17,body:11},large:{name:19,body:12}},size=sizes[values.textSize]||sizes.medium;
  const radii={circle:'50%',rounded:'12px',square:'0'},radius=radii[values.photoShape]||radii.circle;
  const photo=values.photo?`<img src="${values.photo}" width="72" height="72" style="display:block;width:72px;height:72px;border-radius:${radius};object-fit:cover" alt="">`:'';
  const logo=values.logo?`<img src="${values.logo}" width="110" style="display:block;max-width:110px;max-height:30px;width:auto;height:auto;margin-top:9px;object-fit:contain" alt="${escapeHtml(values.company)}">`:'';
  const contact=[values.email?`<a style="color:${values.color};text-decoration:none" href="mailto:${escapeHtml(values.email)}">${escapeHtml(values.email)}</a>`:'',values.phone?`<a style="color:${values.color};text-decoration:none" href="tel:${escapeHtml(values.phone.replace(/\s+/g,''))}">${escapeHtml(values.phone)}</a>`:''].filter(Boolean).join(' &nbsp;·&nbsp; ');
  const website=validWebUrl(values.website),socials=[['in',values.linkedin],['◎',values.instagram],['X',values.x],['f',values.facebook]].map(([label,url])=>[label,validWebUrl(url)]).filter(([,url])=>url);
  const socialMarkup=socials.length?`<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin-top:8px"><tr>${socials.map(([label,url])=>`<td style="padding-right:6px"><a href="${escapeHtml(url)}" style="display:inline-block;width:22px;height:22px;line-height:22px;text-align:center;border-radius:5px;background:${values.color};color:#ffffff;text-decoration:none;font:bold 11px Arial,sans-serif">${label}</a></td>`).join('')}</tr></table>`:'';
  const ctaLabels={book:'Book a meeting',website:'Visit website',quote:'Get a quote',custom:values.ctaText},ctaUrl=values.ctaEnabled?validWebUrl(values.ctaUrl):'',ctaLabel=ctaLabels[values.ctaPreset]||'';
  const cta=ctaUrl&&ctaLabel?`<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin-top:10px"><tr><td bgcolor="${values.color}" style="border-radius:5px"><a href="${escapeHtml(ctaUrl)}" style="display:inline-block;padding:8px 12px;color:#ffffff;text-decoration:none;font:bold ${size.body}px Arial,sans-serif">${escapeHtml(ctaLabel)}</a></td></tr></table>`:'';
  const details=`<strong style="font-size:${size.name}px;line-height:1.3;color:${values.textColor}">${escapeHtml(values.name||'Your Name')}</strong><div style="font-size:${size.body+1}px;color:#667085;line-height:1.5;padding:2px 0 7px">${escapeHtml([values.role,values.company].filter(Boolean).join(' · '))}</div><div style="font-size:${size.body}px;line-height:1.75;color:${values.textColor}">${contact}${website?`${contact?'<br>':''}<a style="color:${values.color};text-decoration:none" href="${escapeHtml(website)}">${escapeHtml(values.website.replace(/^https?:\/\//,''))}</a>`:''}${values.address?`<br><span>${escapeHtml(values.address)}</span>`:''}</div>${socialMarkup}${cta}${logo}`;
  if(values.template==='compact')return `<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="font-family:Arial,sans-serif;color:${values.textColor};max-width:540px"><tr>${photo?`<td style="padding-right:12px;vertical-align:top">${photo.replaceAll('72px','58px').replaceAll('width="72"','width="58"').replaceAll('height="72"','height="58"')}</td>`:''}<td style="vertical-align:top">${details}</td></tr></table>`;
  if(values.template==='modern')return `<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="font-family:Arial,sans-serif;color:${values.textColor};max-width:540px"><tr>${photo?`<td style="padding-right:16px;vertical-align:top">${photo}</td>`:''}<td style="vertical-align:top;padding-left:14px;border-left:1px solid #d9dde5">${details}</td></tr><tr><td colspan="2" style="height:3px;background:${values.color};font-size:0;line-height:0">&nbsp;</td></tr></table>`;
  return `<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="font-family:Arial,sans-serif;color:${values.textColor};max-width:540px"><tr>${photo?`<td style="padding-right:16px;vertical-align:top">${photo}</td>`:''}<td style="border-left:3px solid ${values.color};padding-left:16px;vertical-align:top">${details}</td></tr></table>`;
}

function updateSignature() { if($('#signature-preview')) $('#signature-preview').innerHTML=signatureMarkup(); }

async function initializeSignature() {
  if(!$('#signature-form'))return;
  $('#signature-form').addEventListener('input',updateSignature);
  $('#signature-form').addEventListener('change',()=>{$('#signature-cta-fields').hidden=!$('#signature-cta-enabled').checked;$('#signature-custom-label').hidden=$('#signature-cta-preset').value!=='custom';updateSignature();});
  $('#signature-photo').addEventListener('change',async event=>{try{signaturePhotoData=await fileToDataUrl(event.target.files?.[0],{maxDimension:1200,targetBytes:900*1024});updateSignature();}catch(error){event.target.value='';showToast(error.message);}});
  $('#signature-logo').addEventListener('change',async event=>{try{signatureLogoData=await fileToDataUrl(event.target.files?.[0],{maxDimension:1200,targetBytes:900*1024});updateSignature();}catch(error){event.target.value='';showToast(error.message);}});
  $('#copy-signature').addEventListener('click',async()=>{
    const html=signatureMarkup();
    try {
      if(window.ClipboardItem) await navigator.clipboard.write([new ClipboardItem({'text/html':new Blob([html],{type:'text/html'}),'text/plain':new Blob([`${signatureValues().name}\n${signatureValues().role}\n${signatureValues().email}`],{type:'text/plain'})})]);
      else await navigator.clipboard.writeText(html);
      showToast('Email signature copied.');track('tool_completed',{tool:'email_signature'});track('tool_exported',{tool:'email_signature',format:'html'});
    } catch { showToast('Copy is unavailable. Select the preview and copy it manually.'); }
  });
  updateSignature();
}

function addExpenseRow(data={}) {
  const row=document.createElement('tr');
  row.innerHTML=`<td><input class="expense-date" type="date" value="${escapeHtml(data.date||new Date().toISOString().slice(0,10))}" aria-label="Expense date"></td><td><select class="expense-category" aria-label="Expense category">${['Software','Marketing','Travel','Office','Contractors','Meals','Other'].map(value=>`<option${data.category===value?' selected':''}>${value}</option>`).join('')}</select></td><td><input class="expense-description" maxlength="100" placeholder="What was this for?" value="${escapeHtml(data.description||'')}"></td><td><input class="expense-amount" type="number" min="0" step="0.01" value="${Number(data.amount||0)}" aria-label="Expense amount"></td><td><button class="remove-expense" type="button" aria-label="Remove expense"><i class="ph-bold ph-trash"></i></button></td>`;
  row.querySelectorAll('input,select').forEach(input=>input.addEventListener('input',updateExpenses));
  row.querySelector('.remove-expense').addEventListener('click',()=>{row.remove();updateExpenses();});
  $('#expense-rows').append(row);updateExpenses();
}

function expenseValues(){return $$('.expense-table tbody tr').map(row=>({date:row.querySelector('.expense-date').value,category:row.querySelector('.expense-category').value,description:row.querySelector('.expense-description').value.trim(),amount:Math.max(0,Number(row.querySelector('.expense-amount').value)||0)}));}
function updateExpenses(){
  if(!$('#expense-total'))return;
  const month=$('#expense-month-filter')?.value||'';const items=expenseValues().filter(item=>!month||item.date.startsWith(month));const total=items.reduce((sum,item)=>sum+item.amount,0);const categories={};items.forEach(item=>categories[item.category]=(categories[item.category]||0)+item.amount);const sorted=Object.entries(categories).sort((a,b)=>b[1]-a[1]),top=sorted[0];
  $('#expense-total').textContent=money(total,'$');$('#expense-top-category').textContent=top?.[0]||'—';$('#expense-count').textContent=items.length;$('#expense-average').textContent=money(items.length?total/items.length:0,'$');$('#expense-category-breakdown').innerHTML=sorted.map(([name,amount])=>`<div><span>${escapeHtml(name)}</span><i style="width:${total?Math.max(4,amount/total*100):0}%"></i><span>${money(amount,'USD')}</span></div>`).join('');
}
function initializeExpenses(){
  if(!$('#expense-rows'))return;$('#expense-month-filter').value=new Date().toISOString().slice(0,7);$('#expense-month-filter').addEventListener('change',updateExpenses);addExpenseRow({category:'Software',description:'Business software',amount:29});addExpenseRow({category:'Marketing',description:'Advertising',amount:75});
  $('#add-expense').addEventListener('click',()=>addExpenseRow());
  $('#clear-expenses').addEventListener('click',()=>{$('#expense-rows').innerHTML='';addExpenseRow();});
  $('#download-expenses').addEventListener('click',()=>{const rows=[['Date','Category','Description','Amount'],...expenseValues().map(item=>[item.date,item.category,item.description,item.amount.toFixed(2)])];const csv=rows.map(row=>row.map(cell=>`"${String(cell).replaceAll('"','""')}"`).join(',')).join('\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));const anchor=document.createElement('a');anchor.href=url;anchor.download='searya-business-expenses.csv';anchor.click();URL.revokeObjectURL(url);track('tool_completed',{tool:'expense_tracker'});track('tool_exported',{tool:'expense_tracker',format:'csv'});});
}

function calculateMargin(event){event?.preventDefault();const currency=$('#margin-currency').value,cost=Math.max(0,Number($('#margin-cost').value)||0),price=Math.max(0,Number($('#margin-price').value)||0),target=Math.min(99.9,Math.max(0,Number($('#target-margin').value)||0)),profit=price-cost,margin=price?profit/price*100:0,markup=cost?profit/cost*100:0,targetPrice=target<100?cost/(1-target/100):0;$('#margin-profit').textContent=money(profit,currency);$('#margin-percent').textContent=`${margin.toFixed(1)}%`;$('#markup-percent').textContent=`${markup.toFixed(1)}%`;$('#target-price').textContent=money(targetPrice,currency);$('#margin-insight').textContent=profit<0?'Your selling price is below cost. Raise the price or reduce the cost.':`Each sale keeps ${money(profit,currency)} after direct cost, before overhead and tax.`;if(event)track('tool_completed',{tool:'profit_margin'});}
function initializeMargin(){if(!$('#margin-form'))return;$('#margin-form').addEventListener('submit',calculateMargin);$('#margin-form').addEventListener('input',()=>calculateMargin());calculateMargin();}

function showCalculation(result,errorId,render){const error=$(errorId);error.textContent=result.ok?'':result.error;if(result.ok)render(result);}
function initializeSalesTax(){const form=$('#sales-tax-form');if(!form)return;const update=event=>{event?.preventDefault();showCalculation(calculateSalesTax({amount:$('#sales-tax-amount').value,rate:$('#sales-tax-rate').value,reverse:$('#sales-tax-mode').value==='reverse'}),'#sales-tax-error',result=>{$('#sales-tax-subtotal').textContent=money(result.subtotal,"$");$('#sales-tax-value').textContent=money(result.tax,"$");$('#sales-tax-total').textContent=money(result.total,"$");});if(event?.type==='submit')track('tool_completed',{tool:'sales_tax'});};form.addEventListener('submit',update);form.addEventListener('input',update);update();}

function initializeJobCost(){const form=$('#job-cost-form');if(!form)return;const values=()=>({materials:$('#job-materials').value,laborHours:$('#job-hours').value,hourlyRate:$('#job-rate').value,additional:$('#job-additional').value,overheadRate:$('#job-overhead').value,markupRate:$('#job-markup').value});const update=event=>{event?.preventDefault();const currency=$('#job-currency').value;showCalculation(calculateJobCost(values()),'#job-cost-error',result=>{$('#job-cost-results').innerHTML=`<div><span>Labor cost</span><strong>${money(result.labor,currency)}</strong></div><div><span>Direct cost</span><strong>${money(result.directCost,currency)}</strong></div><div><span>Overhead</span><strong>${money(result.overhead,currency)}</strong></div><div><span>Total job cost</span><strong>${money(result.totalCost,currency)}</strong></div><div><span>Gross profit</span><strong>${money(result.grossProfit,currency)}</strong></div><div><span>Gross margin</span><strong>${result.grossMargin.toFixed(1)}%</strong></div><div class="result-total"><span>Suggested customer price</span><strong>${money(result.suggestedPrice,currency)}</strong></div>`;});if(event?.type==='submit')track('tool_completed',{tool:'job_cost'});};form.addEventListener('submit',update);form.addEventListener('input',update);$('#convert-job-cost-to-estimate')?.addEventListener('click',()=>{const result=calculateJobCost(values()),currency=$('#job-currency').value;if(!result.ok)return showToast('Enter valid job cost values first.');$('#estimate-currency').value=currency;$('#estimate-items').innerHTML='';if(result.materials>0)addEstimateItem('Materials & supplies',1,result.materials);if(result.labor>0)addEstimateItem(`Labor (${$('#job-hours').value}h @ ${money($('#job-rate').value,currency)}/h)`,1,result.labor);if(result.additional>0)addEstimateItem('Additional direct costs',1,result.additional);if(result.overhead>0)addEstimateItem(`Overhead (${$('#job-overhead').value}%)`,1,result.overhead);if(result.grossProfit>0)addEstimateItem(`Markup (${$('#job-markup').value}%)`,1,result.grossProfit);updateEstimate();history.pushState({},'','/estimate-generator');routeTool();window.scrollTo({top:0,behavior:'smooth'});showToast('Job cost figures transferred to Estimate Generator.');});update();}

function initializeHourlyRate(){const form=$('#hourly-rate-form');if(!form)return;const update=event=>{event?.preventDefault();showCalculation(calculateHourlyRate({desiredIncome:$('#rate-income').value,annualExpenses:$('#rate-expenses').value,taxRate:$('#rate-tax').value,weeks:$('#rate-weeks').value,hoursPerWeek:$('#rate-hours').value,billablePercent:$('#rate-billable').value}),'#hourly-rate-error',result=>{$('#rate-base').textContent=money(result.baseRate,"$");$('#hourly-rate-results').innerHTML=`<div><span>Required annual revenue</span><strong>${money(result.requiredRevenue,"$")}</strong></div><div><span>Annual billable hours</span><strong>${result.billableHours.toFixed(0)}</strong></div><div><span>Rate + 10% buffer</span><strong>${money(result.buffer10,"$")}</strong></div><div class="result-total"><span>Rate + 20% buffer</span><strong>${money(result.buffer20,"$")}</strong></div>`;});if(event?.type==='submit')track('tool_completed',{tool:'hourly_rate'});};form.addEventListener('submit',update);form.addEventListener('input',update);update();}

function initializeBreakEven(){const form=$('#break-even-form');if(!form)return;const update=event=>{event?.preventDefault();const currency=$('#break-currency').value,result=calculateBreakEven({fixedCosts:$('#break-fixed').value,variableCost:$('#break-variable').value,sellingPrice:$('#break-price').value,targetProfit:$('#break-target-profit').value});showCalculation(result,'#break-even-error',value=>{$('#break-units').textContent=value.wholeUnits.toLocaleString('en-US');$('#break-even-results').innerHTML=`<div><span>Contribution per unit</span><strong>${money(value.contribution,currency)}</strong></div><div><span>Contribution margin</span><strong>${value.contributionMargin.toFixed(1)}%</strong></div><div><span>Exact break-even units</span><strong>${value.exactUnits.toFixed(2)}</strong></div><div><span>Break-even revenue</span><strong>${money(value.breakEvenRevenue,currency)}</strong></div>${value.targetProfit>0?`<div><span>Units for target profit</span><strong>${value.targetWholeUnits.toLocaleString('en-US')}</strong></div><div class="result-total"><span>Revenue for target profit</span><strong>${money(value.targetRevenue,currency)}</strong></div>`:`<div class="result-total"><span>Break-even revenue</span><strong>${money(value.breakEvenRevenue,currency)}</strong></div>`}`;});if(!result.ok){$('#break-units').textContent='—';$('#break-even-results').innerHTML='';}if(event?.type==='submit')track('tool_completed',{tool:'break_even'});};form.addEventListener('submit',update);form.addEventListener('input',update);update();}

let estimateLogoData='';
function addEstimateItem(description='Professional services',quantity=1,rate=0){const row=document.createElement('div');row.className='line-item';row.innerHTML=`<input class="estimate-description" maxlength="120" value="${escapeHtml(description)}" aria-label="Description"><input class="estimate-quantity" type="number" min="0" step="0.01" value="${quantity}" aria-label="Quantity"><input class="estimate-rate" type="number" min="0" step="0.01" value="${rate}" aria-label="Rate"><button class="remove-line" type="button" aria-label="Remove"><i class="ph-bold ph-trash"></i></button>`;row.querySelector('.remove-line').addEventListener('click',()=>{row.remove();updateEstimate();});row.addEventListener('input',updateEstimate);$('#estimate-items').append(row);updateEstimate();}
function estimateValues(){const items=$$('#estimate-items .line-item').map(row=>({description:row.querySelector('.estimate-description').value,quantity:Math.max(0,Number(row.querySelector('.estimate-quantity').value)||0),rate:Math.max(0,Number(row.querySelector('.estimate-rate').value)||0)})),subtotal=items.reduce((sum,item)=>sum+item.quantity*item.rate,0),discountRate=Math.min(100,Math.max(0,Number($('#estimate-discount').value)||0)),taxRate=Math.min(100,Math.max(0,Number($('#estimate-tax').value)||0)),discount=subtotal*discountRate/100,tax=(subtotal-discount)*taxRate/100,total=subtotal-discount+tax,depositEnabled=$('#estimate-deposit-enabled').checked,depositPercent=depositEnabled?Math.min(100,Math.max(0,Number($('#estimate-deposit-percent').value)||0)):0;return{items,subtotal,discountRate,discount,taxRate,tax,total,currency:$('#estimate-currency').value,depositEnabled,depositPercent,depositAmount:total*depositPercent/100,business:$('#estimate-business').value,businessEmail:$('#estimate-business-email').value,businessAddress:$('#estimate-business-address').value,businessPhone:$('#estimate-business-phone').value,businessWebsite:$('#estimate-business-website').value,customer:$('#estimate-customer').value,customerCompany:$('#estimate-customer-company').value,customerAddress:$('#estimate-customer-address').value,customerEmail:$('#estimate-customer-email').value,customerPhone:$('#estimate-customer-phone').value,number:$('#estimate-number').value,date:$('#estimate-date').value,valid:$('#estimate-valid').value,notes:$('#estimate-notes').value,terms:$('#estimate-terms').value};}
function updateEstimate(){if(!$('#estimate-preview'))return;const value=estimateValues();$('#estimate-deposit-label').hidden=!value.depositEnabled;$('#estimate-preview').innerHTML=`<div class="doc-head"><div>${estimateLogoData?`<img class="document-logo" src="${estimateLogoData}" alt="Business logo">`:''}<h2>ESTIMATE</h2><strong>${escapeHtml(value.business||'Your business')}</strong><p>${escapeHtml(value.businessAddress)}</p><p>${escapeHtml([value.businessEmail,value.businessPhone].filter(Boolean).join(' · '))}</p><p>${escapeHtml(value.businessWebsite)}</p></div><div class="doc-number"><strong>${escapeHtml(value.number||'ESTIMATE')}</strong><p>Issued ${readableDate(value.date)}</p><p>Valid until ${readableDate(value.valid)}</p></div></div><div class="doc-parties"><div><span>PREPARED FOR</span><strong>${escapeHtml(value.customer||'Customer')}</strong><p>${escapeHtml(value.customerCompany)}</p><p>${escapeHtml(value.customerAddress)}</p><p>${escapeHtml([value.customerEmail,value.customerPhone].filter(Boolean).join(' · '))}</p></div></div><table class="doc-table"><thead><tr><th>Description</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead><tbody>${value.items.map(item=>`<tr><td>${escapeHtml(item.description||'Item')}</td><td>${item.quantity}</td><td>${money(item.rate,value.currency)}</td><td>${money(item.quantity*item.rate,value.currency)}</td></tr>`).join('')}</tbody></table><div class="doc-totals"><div><span>Subtotal</span><strong>${money(value.subtotal,value.currency)}</strong></div>${value.discountRate?`<div><span>Discount (${value.discountRate}%)</span><strong>−${money(value.discount,value.currency)}</strong></div>`:''}${value.taxRate?`<div><span>Tax (${value.taxRate}%)</span><strong>${money(value.tax,value.currency)}</strong></div>`:''}<div class="grand-total"><span>Estimated total</span><strong>${money(value.total,value.currency)}</strong></div>${value.depositEnabled&&value.depositPercent?`<div class="deposit-total"><span>Requested deposit (${value.depositPercent}%)</span><strong>${money(value.depositAmount,value.currency)}</strong></div>`:''}</div>${value.notes?`<div class="doc-notes"><strong>Notes</strong><p>${escapeHtml(value.notes)}</p></div>`:''}${value.terms?`<div class="doc-notes"><strong>Terms</strong><p>${escapeHtml(value.terms)}</p></div>`:''}`;}
function initializeEstimate(){
  if(!$('#estimate-form'))return;
  const today=new Date(),valid=new Date(today);valid.setDate(valid.getDate()+30);$('#estimate-date').value=today.toISOString().slice(0,10);$('#estimate-valid').value=valid.toISOString().slice(0,10);addEstimateItem('Professional services',1,500);
  $('#add-estimate-item').addEventListener('click',()=>addEstimateItem('',1,0));$('#estimate-form').addEventListener('input',updateEstimate);$('#estimate-form').addEventListener('change',updateEstimate);
  $('#apply-profile-estimate')?.addEventListener('click',()=>applyBusinessProfile('estimate'));
  $('#estimate-contact-select')?.addEventListener('change',event=>applyContact(workspaceContacts.find(contact=>contact.id===event.target.value),'estimate'));
  $('#save-estimate-contact')?.addEventListener('click',()=>saveContactFrom('estimate'));
  $('#save-first-estimate-item')?.addEventListener('click',()=>saveCatalogFrom('estimate'));
  $('#add-catalog-to-estimate')?.addEventListener('click',()=>{const item=workspaceCatalogItems.find(entry=>entry.id===$('#estimate-catalog-select').value);if(!item)return showToast('Choose a saved service first.');addEstimateItem(item.description||item.name,1,item.defaultRate);$('#estimate-currency').value=item.currency;updateEstimate();});
  $('#estimate-logo').addEventListener('change',async event=>{try{estimateLogoData=await fileToDataUrl(event.target.files?.[0],{maxDimension:1200});$('#remove-estimate-logo').hidden=false;updateEstimate();}catch(error){event.target.value='';showToast(error.message);}});$('#remove-estimate-logo').addEventListener('click',()=>{estimateLogoData='';$('#estimate-logo').value='';$('#remove-estimate-logo').hidden=true;updateEstimate();});$('#print-estimate').addEventListener('click',()=>{updateEstimate();track('tool_exported',{tool:'estimate',format:'pdf_print'});window.print();});
  $('#convert-estimate-to-invoice')?.addEventListener('click',()=>{const est=estimateValues();$('#doc-type').value='invoice';syncDocumentType();$('#currency').value=est.currency;documentLogoData=estimateLogoData;$('#remove-document-logo').hidden=!documentLogoData;const fields={'business-name':est.business,'business-email':est.businessEmail,'business-address':est.businessAddress,'business-phone':est.businessPhone,'business-website':est.businessWebsite,'client-name':est.customer,'client-company':est.customerCompany,'client-address':est.customerAddress,'client-email':est.customerEmail,'client-phone':est.customerPhone,'payment-terms':est.terms,'doc-notes':est.notes};Object.entries(fields).forEach(([id,value])=>{if(value)$(`#${id}`).value=value;});if(est.discount)$('#discount').value=$('#estimate-discount').value;if(est.tax)$('#tax').value=$('#estimate-tax').value;$('#line-items').innerHTML='';if(est.items.length){est.items.forEach(item=>addLineItem(item.description,item.quantity,item.rate));}else{addLineItem('Services',1,est.total);}updateDocumentPreview();history.pushState({},'','/invoice-generator');routeTool();window.scrollTo({top:0,behavior:'smooth'});showToast('Estimate transferred to Invoice Generator.');});updateEstimate();
}

function authTab(mode='login'){const isRegister=mode==='register';$$('[data-auth-tab]').forEach(button=>button.classList.toggle('active',button.dataset.authTab===mode));$('.auth-tabs').hidden=isRegister;$('#login-form').hidden=isRegister;$('#register-form').hidden=!isRegister;$('#auth-title').textContent=isRegister?'Create your free workspace':'Welcome back';$('#auth-message').textContent='';$('#auth-message').classList.remove('success');}
function openAuth(mode='login'){$('#auth-modal').hidden=false;authTab(mode);document.body.classList.add('modal-open');track('auth_started',{mode});}
function closeAuth(){$('#auth-modal').hidden=true;document.body.classList.remove('modal-open');}

async function refreshAccount(){
  try{currentUser=(await SearyaApi.me()).user;}catch{currentUser=null;}
  const button=$('#account-button');button.querySelector('span').textContent=currentUser?currentUser.name.split(' ')[0]:'Sign in';button.classList.toggle('signed-in',Boolean(currentUser));
  return currentUser;
}

async function openAccount(){
  if(!currentUser)return openAuth('login');
  track('account_opened');$('#account-drawer').hidden=false;document.body.classList.add('modal-open');$('#account-name').textContent=currentUser.name;
  setAccountTab('workspace');
  await loadSavedItems();
}
function closeAccount(){$('#account-drawer').hidden=true;document.body.classList.remove('modal-open');}

async function loadSavedItems(){
  if(!currentUser)return;
  try{
    const [dashboard,itemsPayload]=await Promise.all([SearyaApi.accountDashboard(),SearyaApi.toolItems(),loadWorkspaceLibraries()]);
    currentUser=dashboard.account;
    $('#account-summary').innerHTML=`<div><span>Plan</span><strong>${currentUser.plan==='pro'?'Pro':'Free'}</strong></div><div><span>Saved items</span><strong>${dashboard.savedCount}</strong></div><div><span>Business Profile</span><strong>${dashboard.businessProfile?.completionPercent||0}%</strong></div>`;
    const finance=dashboard.workspace||{};
    $('#workspace-finance-summary').innerHTML=`<div><span>This month invoiced</span><strong>${money(finance.invoiced||0,'USD')}</strong></div><div><span>This month expenses</span><strong>${money(finance.expenses||0,'USD')}</strong></div><div><span>Estimated difference</span><strong>${money(finance.estimatedProfit||0,'USD')}</strong></div>`;
    $('#account-upgrade').hidden=currentUser.plan==='pro';
    const items=itemsPayload.items||[];
    $('#saved-items').innerHTML=items.length?items.map(item=>`<article><button class="saved-open" type="button" data-saved-id="${item.id}"><i class="ph-bold ph-file"></i><span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.itemType.replaceAll('-',' '))} · ${new Date(item.updatedAt).toLocaleDateString('en-US')}</small></span></button><button class="saved-duplicate" type="button" data-duplicate-saved="${item.id}" aria-label="Duplicate"><i class="ph-bold ph-copy"></i></button><button class="saved-delete" type="button" data-delete-saved="${item.id}" aria-label="Delete"><i class="ph-bold ph-trash"></i></button></article>`).join(''):`<div class="empty-state"><i class="ph-bold ph-folder-open"></i><p>Save a card, document or calculator result to see it here.</p></div>`;
    window.searyaSavedItems=items;
  }catch(error){showToast(error.message);}
}

function renderWorkspaceLibraries(){
  const contactOptions='<option value="">Saved customer…</option>'+workspaceContacts.map(contact=>`<option value="${contact.id}">${escapeHtml(contact.name)}${contact.company?` — ${escapeHtml(contact.company)}`:''}</option>`).join('');
  ['#document-contact-select','#estimate-contact-select'].forEach(selector=>{if($(selector))$(selector).innerHTML=contactOptions;});
  const catalogOptions='<option value="">Saved service or product…</option>'+workspaceCatalogItems.map(item=>`<option value="${item.id}">${escapeHtml(item.name)} — ${money(item.defaultRate,item.currency)}</option>`).join('');
  ['#document-catalog-select','#estimate-catalog-select'].forEach(selector=>{if($(selector))$(selector).innerHTML=catalogOptions;});
  $('#workspace-customers').innerHTML=workspaceContacts.length?workspaceContacts.map(contact=>`<article><div><strong>${escapeHtml(contact.name)}</strong><small>${escapeHtml([contact.company,contact.email,contact.phone].filter(Boolean).join(' · '))}</small></div><button type="button" data-delete-contact="${contact.id}" aria-label="Delete customer"><i class="ph-bold ph-trash"></i></button></article>`).join(''):'<div class="empty-state"><p>Save a customer from an invoice or estimate.</p></div>';
  $('#workspace-catalog').innerHTML=workspaceCatalogItems.length?workspaceCatalogItems.map(item=>`<article><div><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.description)} · ${money(item.defaultRate,item.currency)}</small></div><button type="button" data-delete-catalog="${item.id}" aria-label="Delete service"><i class="ph-bold ph-trash"></i></button></article>`).join(''):'<div class="empty-state"><p>Save a common service from an invoice or estimate.</p></div>';
}

async function loadWorkspaceLibraries(){
  if(!currentUser)return;
  const [contactsPayload,catalogPayload]=await Promise.all([SearyaApi.contacts(),SearyaApi.catalogItems()]);
  workspaceContacts=contactsPayload.contacts||[];workspaceCatalogItems=catalogPayload.items||[];renderWorkspaceLibraries();
}

async function applyBusinessProfile(target='document',notify=true){
  if(!currentUser)return notify&&openAuth('register');
  if(!currentBusinessProfile)currentBusinessProfile=(await SearyaApi.businessProfile()).profile;
  const profile=currentBusinessProfile;if(!profile)return;
  const address=[profile.address,profile.city,profile.country].filter(Boolean).join(', ');
  if(target==='document'){
    const values={'business-name':profile.companyName||profile.fullName,'business-email':profile.email,'business-address':address,'business-phone':profile.phone,'business-website':profile.website,'currency':profile.defaultCurrency};
    Object.entries(values).forEach(([id,value])=>{if(value&&$(`#${id}`))$(`#${id}`).value=value;});documentLogoData=profile.logo||documentLogoData;$('#remove-document-logo').hidden=!documentLogoData;updateDocumentPreview();
  }else{
    const values={'estimate-business':profile.companyName||profile.fullName,'estimate-business-email':profile.email,'estimate-business-address':address,'estimate-business-phone':profile.phone,'estimate-business-website':profile.website,'estimate-currency':profile.defaultCurrency};
    Object.entries(values).forEach(([id,value])=>{if(value&&$(`#${id}`))$(`#${id}`).value=value;});estimateLogoData=profile.logo||estimateLogoData;$('#remove-estimate-logo').hidden=!estimateLogoData;updateEstimate();
  }
  if(notify)showToast('Business Profile applied.');
}

function applyContact(contact,target){if(!contact)return;if(target==='document'){const values={'client-name':contact.name,'client-company':contact.company,'client-email':contact.email,'client-phone':contact.phone,'client-address':contact.address};Object.entries(values).forEach(([id,value])=>$(`#${id}`).value=value||'');updateDocumentPreview();}else{const values={'estimate-customer':contact.name,'estimate-customer-company':contact.company,'estimate-customer-email':contact.email,'estimate-customer-phone':contact.phone,'estimate-customer-address':contact.address};Object.entries(values).forEach(([id,value])=>$(`#${id}`).value=value||'');updateEstimate();}}

async function saveContactFrom(target){if(!currentUser)return openAuth('register');const contact=target==='document'?{name:$('#client-name').value,company:$('#client-company').value,email:$('#client-email').value,phone:$('#client-phone').value,address:$('#client-address').value}:{name:$('#estimate-customer').value,company:$('#estimate-customer-company').value,email:$('#estimate-customer-email').value,phone:$('#estimate-customer-phone').value,address:$('#estimate-customer-address').value};try{await SearyaApi.saveContact(contact);await loadWorkspaceLibraries();showToast('Customer saved.');}catch(error){showToast(error.message);}}

async function saveCatalogFrom(target){if(!currentUser)return openAuth('register');const row=target==='document'?$('#line-items .line-item'):$('#estimate-items .line-item');if(!row)return showToast('Add a line item first.');const description=row.querySelector(target==='document'?'.item-description':'.estimate-description').value.trim(),rate=row.querySelector(target==='document'?'.item-rate':'.estimate-rate').value,currency=$(target==='document'?'#currency':'#estimate-currency').value;try{await SearyaApi.saveCatalogItem({name:description,description,defaultRate:rate,currency});await loadWorkspaceLibraries();showToast('Service saved.');}catch(error){showToast(error.message);}}

function setAccountTab(tab='workspace'){
  $$('[data-account-tab]').forEach(button=>{const active=button.dataset.accountTab===tab;button.classList.toggle('active',active);button.setAttribute('aria-selected',String(active));});
  $$('[data-account-panel]').forEach(panel=>panel.hidden=panel.dataset.accountPanel!==tab);
  if(tab==='profile')loadBusinessProfile();
  if(tab==='customers'||tab==='catalog')loadWorkspaceLibraries().catch(error=>showToast(error.message));
}

function renderBusinessProfileImages(){
  const status=$('#profile-image-status');
  status.innerHTML=`${businessProfilePhotoData?`<div><img src="${businessProfilePhotoData}" alt="Saved profile photo"><button type="button" data-clear-profile-image="photo">Remove photo</button></div>`:''}${businessProfileLogoData?`<div><img src="${businessProfileLogoData}" alt="Saved company logo"><button type="button" data-clear-profile-image="logo">Remove logo</button></div>`:''}`;
}

async function loadBusinessProfile(){
  const form=$('#business-profile-form');if(!form||!currentUser)return;
  const message=$('#business-profile-message');message.textContent='Loading profile…';message.classList.remove('success');
  try{
    const {profile}=await SearyaApi.businessProfile();currentBusinessProfile=profile;
    const fields=['fullName','companyName','email','phone','website','address','city','country','brandColor','secondaryColor','linkedin','instagram','x','youtube','whatsapp','bookingLink','businessDescription','defaultCurrency','taxInformation'];
    fields.forEach(name=>{if(form.elements[name])form.elements[name].value=profile[name]??'';});
    businessProfilePhotoData=profile.profilePhoto||'';businessProfileLogoData=profile.logo||'';renderBusinessProfileImages();message.textContent=profile.exists?`Profile ${profile.completionPercent}% complete.`:'Add your details, then save your shared profile.';
  }catch(error){message.textContent=error.message;}
}

async function saveBusinessProfile(event){
  event.preventDefault();const form=event.currentTarget,button=event.submitter,message=$('#business-profile-message');button.disabled=true;message.classList.remove('success');
  try{
    const names=['fullName','companyName','email','phone','website','address','city','country','brandColor','secondaryColor','linkedin','instagram','x','youtube','whatsapp','bookingLink','businessDescription','defaultCurrency','taxInformation'];
    const data=Object.fromEntries(names.map(name=>[name,form.elements[name].value]));
    const result=await SearyaApi.saveBusinessProfile({...data,profilePhoto:businessProfilePhotoData,logo:businessProfileLogoData});currentBusinessProfile=result.profile;
    message.textContent=`Business Profile saved — ${result.profile.completionPercent}% complete.`;message.classList.add('success');showToast('Business Profile saved.');await loadSavedItems();
  }catch(error){message.textContent=error.message;}finally{button.disabled=false;}
}

function currentToolKey(){const pathname=location.pathname.replace(/\/$/,'');const basePath=Object.keys(TOOL_PATHS).find(path=>pathname===path||pathname.startsWith(`${path}/`));return TOOL_PATHS[basePath]||'';}
function toolSnapshot(){
  const key=currentToolKey();
  if(key==='card')return{itemType:'digital-card',title:`${businessCardValues().name||'Digital'} business card`,data:businessCardValues()};
  if(key==='qr')return{itemType:'qr-code',title:`QR — ${$('#qr-content').value.trim().slice(0,45)||'Untitled'}`,data:{content:$('#qr-content').value,dark:$('#qr-dark').value,light:$('#qr-light').value,logo:qrLogoData}};
  if(key==='document'){const doc=documentValues();return{itemType:doc.type,title:`${doc.type[0].toUpperCase()+doc.type.slice(1)} ${doc.number||''}`.trim(),data:doc};}
  if(key==='estimate'){const estimate=estimateValues();return{itemType:'estimate',title:`Estimate ${estimate.number||''}`.trim(),data:{...estimate,logo:estimateLogoData}};}
  if(key==='time')return{itemType:'timesheet',title:`Timesheet — ${new Date().toLocaleDateString('en-US')}`,data:lastTimeResult||{}};
  if(key==='signature')return{itemType:'email-signature',title:`${signatureValues().name||'Email'} signature`,data:signatureValues()};
  if(key==='expenses')return{itemType:'expense-tracker',title:`Expenses — ${new Date().toLocaleDateString('en-US')}`,data:{items:expenseValues()}};
  if(key==='margin')return{itemType:'profit-margin',title:'Profit margin calculation',data:{cost:$('#margin-cost').value,price:$('#margin-price').value,target:$('#target-margin').value,currency:$('#margin-currency').value}};
  return null;
}

async function saveCurrentTool(){if(!currentUser)return openAuth('register');const snapshot=toolSnapshot();if(!snapshot)return showToast('Open a tool before saving.');try{await SearyaApi.saveToolItem(snapshot);showToast('Saved to your workspace.');track('tool_saved',{tool:snapshot.itemType});if(!$('#account-drawer').hidden)await loadSavedItems();}catch(error){showToast(error.message);}}

async function startCheckout(packageKey){
  if(!currentUser){openAuth('register');return;}
  track('checkout_started',{plan:packageKey});
  try{const result=await SearyaApi.checkout(packageKey);if(result.checkoutUrl)location.href=result.checkoutUrl;else{await refreshAccount();showToast('Your Pro plan is active.');}}catch(error){track('checkout_failed',{plan:packageKey,code:error.code});showToast(error.code==='FREE_LAUNCH_ACTIVE'||error.code==='PAYMENT_NOT_CONFIGURED'?'Secure payments are being connected. Please try again soon.':error.message);}
}

function initializeAuth(){
  $$('[data-auth-open]').forEach(button=>button.addEventListener('click',()=>openAuth(button.dataset.authOpen)));
  $$('[data-modal-close]').forEach(button=>button.addEventListener('click',closeAuth));$$('[data-auth-tab]').forEach(button=>button.addEventListener('click',()=>authTab(button.dataset.authTab)));
  $('#auth-back-login')?.addEventListener('click',()=>authTab('login'));
  $('#account-button').addEventListener('click',openAccount);$$('[data-account-close]').forEach(button=>button.addEventListener('click',closeAccount));$$('[data-account-tab]').forEach(button=>button.addEventListener('click',()=>setAccountTab(button.dataset.accountTab)));$('#save-current-item').addEventListener('click',saveCurrentTool);$('#save-tool-top')?.addEventListener('click',saveCurrentTool);$('#logout-button').addEventListener('click',async()=>{await SearyaApi.logout();currentUser=null;closeAccount();await refreshAccount();showToast('Signed out.');});
  $('#business-profile-form')?.addEventListener('submit',saveBusinessProfile);
  $('#business-profile-form [name="profilePhotoFile"]')?.addEventListener('change',async event=>{try{businessProfilePhotoData=await fileToDataUrl(event.target.files?.[0],{maxDimension:1400});renderBusinessProfileImages();}catch(error){event.target.value='';showToast(error.message);}});
  $('#business-profile-form [name="logoFile"]')?.addEventListener('change',async event=>{try{businessProfileLogoData=await fileToDataUrl(event.target.files?.[0],{maxDimension:1200});renderBusinessProfileImages();}catch(error){event.target.value='';showToast(error.message);}});
  $('#login-form').addEventListener('submit',async event=>{event.preventDefault();const button=event.submitter;button.disabled=true;try{const values=Object.fromEntries(new FormData(event.currentTarget));const result=await SearyaApi.login(values);currentUser=result.user;closeAuth();await refreshAccount();showToast(`Signed in successfully. Welcome back${currentUser?.name?`, ${currentUser.name.split(' ')[0]}`:''}!`);track('auth_completed',{mode:'login'});}catch(error){$('#auth-message').textContent=error.message;track('auth_failed',{mode:'login',code:error.code});}finally{button.disabled=false;}});
  $('#forgot-password')?.addEventListener('click',async()=>{const email=$('#login-form input[name="email"]').value.trim();if(!email){$('#auth-message').textContent='Enter your email above first.';return;}try{await SearyaApi.forgotPassword(email);$('#auth-message').textContent='If an account exists, a secure reset link is on its way.';track('auth_help_requested',{mode:'password_reset'});}catch(error){$('#auth-message').textContent=error.message;}});
  $('#register-form').addEventListener('submit',async event=>{event.preventDefault();const button=event.submitter;button.disabled=true;try{const values=Object.fromEntries(new FormData(event.currentTarget));const result=await SearyaApi.register({...values,role:'both'});if(result.verificationRequired){authTab('login');const message=$('#auth-message');message.textContent='Account created successfully. Check your inbox, verify your email, then sign in.';message.classList.add('success');showToast('Account created successfully. Please verify your email.');}else{currentUser=result.user;closeAuth();await refreshAccount();showToast('Account created successfully. Your workspace is ready.');}track('auth_completed',{mode:'register'});}catch(error){$('#auth-message').classList.remove('success');$('#auth-message').textContent=error.message;track('auth_failed',{mode:'register',code:error.code});}finally{button.disabled=false;}});
  document.addEventListener('click',async event=>{const clearImage=event.target.closest('[data-clear-profile-image]');if(clearImage){if(clearImage.dataset.clearProfileImage==='photo')businessProfilePhotoData='';else businessProfileLogoData='';renderBusinessProfileImages();return;}const checkout=event.target.closest('[data-checkout]');if(checkout){checkout.disabled=true;await startCheckout(checkout.dataset.checkout);checkout.disabled=false;return;}const contactDelete=event.target.closest('[data-delete-contact]');if(contactDelete){await SearyaApi.deleteContact(contactDelete.dataset.deleteContact);await loadWorkspaceLibraries();return;}const catalogDelete=event.target.closest('[data-delete-catalog]');if(catalogDelete){await SearyaApi.deleteCatalogItem(catalogDelete.dataset.deleteCatalog);await loadWorkspaceLibraries();return;}const duplicate=event.target.closest('[data-duplicate-saved]');if(duplicate){const item=(window.searyaSavedItems||[]).find(entry=>entry.id===duplicate.dataset.duplicateSaved);if(item){await SearyaApi.saveToolItem({itemType:item.itemType,title:`${item.title} copy`,data:item.data});await loadSavedItems();showToast('Saved item duplicated.');}return;}const remove=event.target.closest('[data-delete-saved]');if(remove){await SearyaApi.deleteToolItem(remove.dataset.deleteSaved);await loadSavedItems();return;}const open=event.target.closest('[data-saved-id]');if(open){const item=(window.searyaSavedItems||[]).find(entry=>entry.id===open.dataset.savedId);if(item){sessionStorage.setItem('searya_restore_item',JSON.stringify(item));const routes={'digital-card':'/digital-business-card','qr-code':'/qr-code-generator',invoice:'/invoice-generator',quote:'/quote-generator',receipt:'/receipt-maker',estimate:'/estimate-generator',timesheet:'/time-card-calculator','email-signature':'/email-signature-generator','expense-tracker':'/expense-tracker','profit-margin':'/profit-margin-calculator'};location.href=routes[item.itemType]||'/';}}});
}

function applyRestoredItem(){
  let item;try{item=JSON.parse(sessionStorage.getItem('searya_restore_item')||'null');sessionStorage.removeItem('searya_restore_item');}catch{}if(!item?.data)return;const data=item.data;const key=currentToolKey();
  if(key==='card'){const fields={name:'card-name',role:'card-role',company:'card-company',email:'card-email',phone:'card-phone',website:'card-website',linkedin:'card-linkedin',instagram:'card-instagram',location:'card-location',bio:'card-bio',services:'card-services',color:'card-color',theme:'card-theme',ctaType:'card-cta-type',ctaLink:'card-cta-link'};Object.entries(fields).forEach(([prop,id])=>{if(data[prop]!=null)$(`#${id}`).value=data[prop];});cardPhotoData=data.photo||'';cardLogoData=data.logo||'';updateBusinessCard();}
  if(key==='qr'){$('#qr-content').value=data.content||'';$('#qr-dark').value=data.dark||'#111827';$('#qr-light').value=data.light||'#ffffff';qrLogoData=data.logo||'';}
  if(key==='document'){
    const fields={type:'doc-type',number:'doc-number',template:'document-template',business:'business-name',businessEmail:'business-email',businessAddress:'business-address',businessPhone:'business-phone',businessWebsite:'business-website',client:'client-name',clientCompany:'client-company',clientEmail:'client-email',clientPhone:'client-phone',clientAddress:'client-address',issueDate:'issue-date',dueDate:'due-date',currency:'currency',discountRate:'discount',taxRate:'tax',paymentTerms:'payment-terms',notes:'doc-notes'};
    Object.entries(fields).forEach(([prop,id])=>{if(data[prop]!=null)$(`#${id}`).value=data[prop];});
    documentLogoData=data.logo||'';$('#remove-document-logo').hidden=!documentLogoData;
    $('#line-items').innerHTML='';(Array.isArray(data.items)&&data.items.length?data.items:[{description:'Professional services',quantity:1,rate:0}]).forEach(row=>addLineItem(row.description,row.quantity,row.rate));syncDocumentType();updateDocumentPreview();
  }
  if(key==='time'&&Array.isArray(data.entries)){
    const entries=new Map(data.entries.map(entry=>[entry.day,entry]));
    $$('tr[data-day]').forEach(row=>{const entry=entries.get(row.dataset.day);if(!entry)return;row.querySelector('.clock-in').value=entry.start?displayTime(entry.start):'';row.querySelector('.clock-out').value=entry.end?displayTime(entry.end):'';row.querySelector('.break-min').value=entry.breakMinutes||0;});
    $('#hourly-rate').value=data.hourlyRate??20;$('#overtime-rate').value=data.multiplier??1.5;$('#overtime-after').value=data.overtimeAfter??40;calculateTime({silent:true});
  }
  if(key==='signature'){const fields={name:'signature-name',role:'signature-role',company:'signature-company',email:'signature-email',phone:'signature-phone',website:'signature-website',address:'signature-address',color:'signature-color',textColor:'signature-text-color',textSize:'signature-text-size',photoShape:'signature-photo-shape',linkedin:'signature-linkedin',instagram:'signature-instagram',x:'signature-x',facebook:'signature-facebook',ctaPreset:'signature-cta-preset',ctaUrl:'signature-cta-url',ctaText:'signature-cta-text'};Object.entries(fields).forEach(([prop,id])=>{if(data[prop]!=null)$(`#${id}`).value=data[prop];});if(data.template)$(`[name="signature-template"][value="${data.template}"]`).checked=true;$('#signature-cta-enabled').checked=Boolean(data.ctaEnabled);$('#signature-cta-fields').hidden=!data.ctaEnabled;$('#signature-custom-label').hidden=data.ctaPreset!=='custom';signaturePhotoData=data.photo||'';signatureLogoData=data.logo||'';updateSignature();}
  if(key==='expenses'&&Array.isArray(data.items)){$('#expense-rows').innerHTML='';data.items.forEach(addExpenseRow);}
  if(key==='margin'){$('#margin-cost').value=data.cost||0;$('#margin-price').value=data.price||0;$('#target-margin').value=data.target||0;if(data.currency)$('#margin-currency').value=data.currency;calculateMargin();}
  if(key==='estimate'){
    const fields={business:'estimate-business',businessEmail:'estimate-business-email',businessAddress:'estimate-business-address',businessPhone:'estimate-business-phone',businessWebsite:'estimate-business-website',customer:'estimate-customer',customerCompany:'estimate-customer-company',customerAddress:'estimate-customer-address',customerEmail:'estimate-customer-email',customerPhone:'estimate-customer-phone',number:'estimate-number',date:'estimate-date',valid:'estimate-valid',currency:'estimate-currency',discountRate:'estimate-discount',taxRate:'estimate-tax',notes:'estimate-notes',terms:'estimate-terms'};
    Object.entries(fields).forEach(([prop,id])=>{if(data[prop]!=null)$(`#${id}`).value=data[prop];});estimateLogoData=data.logo||'';$('#remove-estimate-logo').hidden=!estimateLogoData;$('#estimate-items').innerHTML='';(Array.isArray(data.items)&&data.items.length?data.items:[{description:'Professional services',quantity:1,rate:0}]).forEach(row=>addEstimateItem(row.description,row.quantity,row.rate));$('#estimate-deposit-enabled').checked=Boolean(data.depositEnabled);$('#estimate-deposit-percent').value=data.depositPercent||30;updateEstimate();
  }
  showToast('Saved item restored.');
}

async function initializeTelemetry(){
  try{await SearyaApi.trackPageView(`${location.pathname}${location.search}`,document.referrer);await SearyaApi.trackPresence(presenceSessionId,'enter',location.pathname,innerWidth<640?'mobile':innerWidth<1000?'tablet':'desktop');presenceTimer=setInterval(()=>SearyaApi.trackPresence(presenceSessionId,'heartbeat',location.pathname,innerWidth<640?'mobile':innerWidth<1000?'tablet':'desktop').catch(()=>{}),30000);addEventListener('pagehide',()=>{clearInterval(presenceTimer);navigator.sendBeacon?.('/api/analytics/presence',new Blob([JSON.stringify({sessionId:presenceSessionId,action:'leave',path:location.pathname,device:innerWidth<640?'mobile':'desktop'})],{type:'application/json'}));});}catch{}
}

async function initialize() {
  await initializeTelemetry();
  routeTool();
  $('#qr-form')?.addEventListener('submit',generateQr);
  $('#download-qr')?.addEventListener('click',downloadQr);
  $('#copy-qr')?.addEventListener('click',async()=>{ try{await navigator.clipboard.writeText($('#qr-content').value.trim());showToast('QR content copied.');}catch{showToast('Copy is not available in this browser.');} });
  buildTimeRows(); calculateTime({silent:true});
  ['#hourly-rate','#overtime-after','#overtime-rate'].forEach(selector=>$(selector)?.addEventListener('input',()=>calculateTime({silent:true})));
  $('#calculate-time')?.addEventListener('click',()=>calculateTime());
  $('#fill-example')?.addEventListener('click',fillTimeExample);
  $('#reset-time')?.addEventListener('click',resetTime);
  $('#download-timesheet')?.addEventListener('click',downloadTimesheet);
  initializeDocument();
  initializeBusinessCard();
  initializeSignature();initializeExpenses();initializeMargin();initializeSalesTax();initializeEstimate();initializeJobCost();initializeHourlyRate();initializeBreakEven();initializeAuth();
  $('#qr-logo')?.addEventListener('change',async event=>{try{qrLogoData=await fileToDataUrl(event.target.files?.[0],{maxDimension:900,targetBytes:900*1024});const preview=$('#qr-logo-preview');preview.querySelector('img').src=qrLogoData;preview.hidden=false;showToast('Logo added. Generate the QR code to preview it.');}catch(error){event.target.value='';showToast(error.message);}});
  await refreshAccount();
  if(currentUser){
    await loadWorkspaceLibraries().catch(()=>{});
    const key=currentToolKey();
    if(key==='document')await applyBusinessProfile('document',false).catch(()=>{});
    if(key==='estimate')await applyBusinessProfile('estimate',false).catch(()=>{});
  }
  applyRestoredItem();
  if(new URLSearchParams(location.search).get('verified')==='1')showToast('Email verified. Your account is ready.');
  if(new URLSearchParams(location.search).get('payment')==='success'){await refreshAccount();showToast('Payment confirmed. Welcome to Searya Pro.');}
  $$('a[href^="/"]').forEach(link=>link.addEventListener('click',()=>track('navigation_clicked',{href:link.getAttribute('href')})));
}

initialize();
