export const IMAGE_UPLOAD_MAX_BYTES = 15 * 1024 * 1024;
export const IMAGE_TARGET_BYTES = 1.8 * 1024 * 1024;
export const SUPPORTED_IMAGE_TYPES = Object.freeze(['image/png', 'image/jpeg', 'image/webp']);

export const CURRENCIES = Object.freeze({
  USD: { symbol: '$', label: 'USD — $' },
  EUR: { symbol: '€', label: 'EUR — €' },
  GBP: { symbol: '£', label: 'GBP — £' },
  CAD: { symbol: 'CA$', label: 'CAD — CA$' },
  AUD: { symbol: 'A$', label: 'AUD — A$' }
});

export function normalizeCurrency(value = 'USD') {
  const aliases = { '$': 'USD', '€': 'EUR', '£': 'GBP' };
  const code = aliases[value] || String(value || '').toUpperCase();
  return CURRENCIES[code] ? code : 'USD';
}

export function formatCurrency(value, currency = 'USD') {
  const code = normalizeCurrency(currency);
  const amount = Number(value);
  const safe = Number.isFinite(amount) ? amount : 0;
  const formatted = Math.abs(safe).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${safe < 0 ? '−' : ''}${CURRENCIES[code].symbol}${formatted}`;
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('The image could not be read. Please try another file.'));
    reader.readAsDataURL(file);
  });
}

function loadImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('This image appears to be corrupted. Please choose another file.'));
    image.src = dataUrl;
  });
}

function canvasDataUrl(canvas, type, quality) {
  try { return canvas.toDataURL(type, quality); } catch { return ''; }
}

export async function processImageFile(file, options = {}) {
  const maxInputBytes = options.maxInputBytes || IMAGE_UPLOAD_MAX_BYTES;
  const targetBytes = options.targetBytes || IMAGE_TARGET_BYTES;
  const maxDimension = options.maxDimension || 1800;
  if (!file) throw new Error('Choose an image first.');
  if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) throw new Error('Choose a PNG, JPG or WebP image.');
  if (!file.size) throw new Error('This image is empty or could not be read.');
  if (file.size > maxInputBytes) throw new Error('Choose an image no larger than 15 MB.');

  const originalDataUrl = await readFileAsDataUrl(file);
  const image = await loadImage(originalDataUrl);
  if (!image.naturalWidth || !image.naturalHeight || image.naturalWidth * image.naturalHeight > 100_000_000) {
    throw new Error('This image has unsupported dimensions. Please choose another file.');
  }
  if (file.size <= targetBytes && Math.max(image.naturalWidth, image.naturalHeight) <= maxDimension) {
    return { dataUrl: originalDataUrl, optimized: false, originalBytes: file.size, outputBytes: file.size, width: image.naturalWidth, height: image.naturalHeight };
  }

  const outputType = file.type === 'image/jpeg' ? 'image/jpeg' : file.type === 'image/webp' ? 'image/webp' : 'image/png';
  let scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
  let best = '';
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext('2d', { alpha: outputType !== 'image/jpeg' });
    if (!context) throw new Error('Your browser could not process this image.');
    if (outputType === 'image/jpeg') { context.fillStyle = '#ffffff'; context.fillRect(0, 0, canvas.width, canvas.height); }
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const quality = outputType === 'image/png' ? undefined : Math.max(0.62, 0.9 - attempt * 0.045);
    best = canvasDataUrl(canvas, outputType, quality);
    const outputBytes = Math.ceil((best.length - best.indexOf(',') - 1) * 0.75);
    if (best && outputBytes <= targetBytes) {
      return { dataUrl: best, optimized: true, originalBytes: file.size, outputBytes, width: canvas.width, height: canvas.height };
    }
    scale *= outputType === 'image/png' ? 0.76 : 0.84;
  }
  if (!best) throw new Error('Your browser could not optimize this image.');
  const outputBytes = Math.ceil((best.length - best.indexOf(',') - 1) * 0.75);
  if (outputBytes > 2.5 * 1024 * 1024) throw new Error('This image could not be reduced safely. Please choose another image.');
  return { dataUrl: best, optimized: true, originalBytes: file.size, outputBytes, width: 0, height: 0 };
}
