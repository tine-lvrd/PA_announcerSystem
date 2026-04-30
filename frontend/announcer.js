const synth = window.speechSynthesis;

const voiceSelect = document.getElementById('voices');
const rateInput   = document.getElementById('rate');
const pitchInput  = document.getElementById('pitch');
const rateVal     = document.getElementById('rate-val');
const pitchVal    = document.getElementById('pitch-val');

/* ─── Audio assets ────────────────────────────
   Folder structure:
     announcer.html
     announcer.css
     announcer.js
     assets/
       chime.mp3
       reverse.mp3
─────────────────────────────────────────────── */
const chimeAudio   = new Audio('assets/chime.mp3');
const reverseAudio = new Audio('assets/reverse-chime.mp3');

chimeAudio.load();
reverseAudio.load();

/* ─── Philippine Vehicle Database ─────────── */
const VEHICLE_BRANDS = {
  car: [
    'Toyota Vios', 'Toyota Innova', 'Toyota Fortuner', 'Toyota Wigo', 'Toyota Rush', 'Toyota Avanza', 'Toyota Hilux', 'Toyota Corolla',
    'Honda City', 'Honda Civic', 'Honda CR-V', 'Honda BR-V', 'Honda Brio', 'Honda Accord',
    'Mitsubishi Mirage', 'Mitsubishi Montero Sport', 'Mitsubishi Xpander', 'Mitsubishi Adventure', 'Mitsubishi L300', 'Mitsubishi Strada',
    'Nissan Navara', 'Nissan Terra', 'Nissan Almera', 'Nissan Patrol',
    'Hyundai Accent', 'Hyundai Tucson', 'Hyundai Stargazer', 'Hyundai Kona', 'Hyundai Reina',
    'Suzuki Swift', 'Suzuki Ertiga', 'Suzuki Jimny', 'Suzuki Celerio', 'Suzuki Dzire', 'Suzuki APV',
    'Ford Ranger', 'Ford Everest', 'Ford Territory', 'Ford Expedition',
    'Mazda 3', 'Mazda CX-5', 'Mazda CX-9', 'Mazda 2', 'Mazda CX-3',
    'Isuzu D-Max', 'Isuzu mu-X', 'Isuzu Traviz',
    'Kia Picanto', 'Kia Sportage', 'Kia Seltos', 'Kia Carnival',
    'Chevrolet Trailblazer', 'Chevrolet Colorado'
  ],
  suv: [
    'Toyota Fortuner', 'Toyota Land Cruiser', 'Toyota RAV4', 'Toyota Alphard',
    'Mitsubishi Montero Sport', 'Mitsubishi Pajero',
    'Ford Everest', 'Ford Explorer', 'Ford Expedition',
    'Nissan Terra', 'Nissan Patrol',
    'Honda CR-V', 'Honda Pilot',
    'Mazda CX-5', 'Mazda CX-9',
    'Isuzu mu-X',
    'Hyundai Tucson', 'Hyundai Santa Fe', 'Hyundai Palisade',
    'Kia Sportage', 'Kia Sorento', 'Kia Carnival'
  ],
  motorcycle: [
    'Honda Click', 'Honda Beat', 'Honda TMX', 'Honda Wave', 'Honda ADV', 'Honda PCX', 'Honda XRM',
    'Yamaha Mio', 'Yamaha NMAX', 'Yamaha Sniper', 'Yamaha Aerox', 'Yamaha XSR', 'Yamaha Sight',
    'Suzuki Raider', 'Suzuki Skydrive', 'Suzuki Smash', 'Suzuki Burgman',
    'Kawasaki Ninja', 'Kawasaki Rouser', 'Kawasaki Versys',
    'Rusi Motorcycle'
  ],
  tricycle: [
    'Honda TMX Tricycle',
    'Yamaha Tricycle',
    'Rusi Tricycle',
    'Standard Tricycle',
    'Motorized Tricycle'
  ],
  truck: [
    'Isuzu Elf', 'Isuzu Forward', 'Isuzu Giga',
    'Mitsubishi Fuso', 'Mitsubishi Canter', 'Mitsubishi L300 Van',
    'Hino Truck',
    'Toyota Hilux', 'Toyota Innova Cargo',
    'Foton Truck',
    'JAC Truck'
  ]
};

const CUSTOM_BRANDS_KEY = 'pa_custom_brands';
const ELEVENLABS_API_KEY = 'pa_elevenlabs_key';
const ELEVENLABS_USAGE_KEY = 'pa_elevenlabs_usage';
const ELEVENLABS_MONTH_KEY = 'pa_elevenlabs_month';

/* ─── Voice Engine State ──────────────────── */
let currentEngine = 'windows'; // 'windows' or 'elevenlabs'
let currentAudio = null; // For ElevenLabs audio playback

/* ─── ElevenLabs Usage Tracking ───────────── */
const ELEVENLABS_FREE_LIMIT = 10000; // Free tier limit

/* ─── Mode Management ─────────────────────── */
let currentMode = 'ready'; // 'ready', 'parking', 'custom'

function setMode(mode) {
  currentMode = mode;
  const badge = document.getElementById('modeBadge');
  const text = document.getElementById('modeText');
  
  badge.className = 'pa-mode-badge mode-' + mode;
  
  if (mode === 'parking') {
    text.textContent = 'Parking Mode';
  } else if (mode === 'custom') {
    text.textContent = 'Custom Mode';
  } else {
    text.textContent = 'Ready';
  }
}

/* ─── Slider readouts ─────────────────────── */
rateInput.addEventListener('input', () => {
  rateVal.textContent = parseFloat(rateInput.value).toFixed(1) + '×';
});

pitchInput.addEventListener('input', () => {
  pitchVal.textContent = parseFloat(pitchInput.value).toFixed(1);
});

/* ─── Load voices (Filipino/Tagalog only) ─── */
function loadVoices() {
  const voices = synth.getVoices();
  voiceSelect.innerHTML = '';
  
  // Filter for Filipino/Tagalog voices only
  const filipinoVoices = voices.filter(v => {
    const lang = v.lang.toLowerCase();
    const name = v.name.toLowerCase();
    return lang.includes('fil') || 
           lang.includes('tl') || 
           lang.includes('ph') ||
           name.includes('blessica') ||
           name.includes('filipino') ||
           name.includes('tagalog');
  });
  
  if (filipinoVoices.length === 0) {
    // No Filipino voices found - show warning
    const option = document.createElement('option');
    option.value = '';
    option.textContent = 'No Filipino voices installed';
    voiceSelect.appendChild(option);
    
    // Show all voices as fallback
    voices.forEach(v => {
      const option = document.createElement('option');
      option.value = v.name;
      option.textContent = `${v.name} (${v.lang})`;
      voiceSelect.appendChild(option);
    });
  } else {
    // Show only Filipino voices
    filipinoVoices.forEach((v, index) => {
      const option = document.createElement('option');
      option.value = v.name;
      option.textContent = `${v.name} (${v.lang})`;
      
      // Set first Filipino voice as default (usually Blessica)
      if (index === 0) {
        option.selected = true;
      }
      
      voiceSelect.appendChild(option);
    });
  }
}

function initVoices() {
  if (synth.getVoices().length) {
    loadVoices();
  } else {
    setTimeout(initVoices, 100);
  }
}

initVoices();

if (speechSynthesis.onvoiceschanged !== undefined) {
  speechSynthesis.onvoiceschanged = loadVoices;
}

/* ─── Toggle "Other" input ────────────────── */
function toggleOther(selectId, inputId) {
  const select = document.getElementById(selectId);
  const input  = document.getElementById(inputId);
  if (select.value === 'other') {
    input.style.display = 'block';
    input.focus();
  } else {
    input.style.display = 'none';
    input.value = '';
  }
}

/* ─── Update Brand Options Based on Vehicle Type ─── */
function updateBrandOptions() {
  const vehicleType = document.getElementById('vehicleType').value;
  const brandSelect = document.getElementById('carModel');
  const otherInput = document.getElementById('carModelOther');
  
  // Reset
  brandSelect.innerHTML = '';
  otherInput.style.display = 'none';
  otherInput.value = '';
  
  if (!vehicleType) {
    brandSelect.disabled = true;
    brandSelect.innerHTML = '<option value="">Select vehicle type first</option>';
    return;
  }
  
  brandSelect.disabled = false;
  brandSelect.innerHTML = '<option value="">Select brand/model</option>';
  
  // Add custom brands first
  const customBrands = getCustomBrands(vehicleType);
  if (customBrands.length > 0) {
    const customGroup = document.createElement('optgroup');
    customGroup.label = '★ Your Custom Vehicles';
    customBrands.forEach(brand => {
      const option = document.createElement('option');
      option.value = brand;
      option.textContent = brand;
      customGroup.appendChild(option);
    });
    brandSelect.appendChild(customGroup);
  }
  
  // Add standard brands
  const standardGroup = document.createElement('optgroup');
  standardGroup.label = vehicleType.charAt(0).toUpperCase() + vehicleType.slice(1) + 's';
  
  VEHICLE_BRANDS[vehicleType].forEach(brand => {
    const option = document.createElement('option');
    option.value = brand;
    option.textContent = brand;
    standardGroup.appendChild(option);
  });
  
  brandSelect.appendChild(standardGroup);
  
  // Add "Other" option
  const otherOption = document.createElement('option');
  otherOption.value = 'other';
  otherOption.textContent = 'Other…';
  brandSelect.appendChild(otherOption);
}

/* ─── Custom Brands Management ────────────── */
function getCustomBrands(vehicleType) {
  try {
    const stored = localStorage.getItem(CUSTOM_BRANDS_KEY);
    const allCustom = stored ? JSON.parse(stored) : {};
    return allCustom[vehicleType] || [];
  } catch {
    return [];
  }
}

function getAllCustomBrands() {
  try {
    const stored = localStorage.getItem(CUSTOM_BRANDS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function saveCustomBrand(vehicleType, brandName) {
  if (!brandName || !vehicleType) return;
  
  // Trim and validate
  brandName = brandName.trim();
  
  if (brandName.length < 3) {
    alert('Brand name too short. Please enter at least 3 characters.');
    return false;
  }
  
  try {
    const stored = localStorage.getItem(CUSTOM_BRANDS_KEY);
    const allCustom = stored ? JSON.parse(stored) : {};
    
    if (!allCustom[vehicleType]) {
      allCustom[vehicleType] = [];
    }
    
    // Check if already exists (case-insensitive)
    const exists = allCustom[vehicleType].some(b => b.toLowerCase() === brandName.toLowerCase());
    
    if (!exists) {
      allCustom[vehicleType].unshift(brandName); // Add to beginning
      
      // Keep only last 10 custom brands per type
      if (allCustom[vehicleType].length > 10) {
        allCustom[vehicleType] = allCustom[vehicleType].slice(0, 10);
      }
      
      localStorage.setItem(CUSTOM_BRANDS_KEY, JSON.stringify(allCustom));
      renderCustomBrands();
      return true;
    }
    return true;
  } catch (err) {
    console.warn('Could not save custom brand:', err);
    return false;
  }
}

function deleteCustomBrand(vehicleType, brandName) {
  try {
    const allCustom = getAllCustomBrands();
    
    if (allCustom[vehicleType]) {
      allCustom[vehicleType] = allCustom[vehicleType].filter(b => b !== brandName);
      
      // Remove empty arrays
      if (allCustom[vehicleType].length === 0) {
        delete allCustom[vehicleType];
      }
    }
    
    localStorage.setItem(CUSTOM_BRANDS_KEY, JSON.stringify(allCustom));
    renderCustomBrands();
    
    // Refresh brand dropdown if that type is selected
    const currentType = document.getElementById('vehicleType').value;
    if (currentType === vehicleType) {
      updateBrandOptions();
    }
  } catch (err) {
    console.warn('Could not delete custom brand:', err);
  }
}

function clearAllCustomBrands() {
  if (confirm('Are you sure you want to delete all custom brands? This cannot be undone.')) {
    localStorage.removeItem(CUSTOM_BRANDS_KEY);
    renderCustomBrands();
    
    // Refresh brand dropdown
    const currentType = document.getElementById('vehicleType').value;
    if (currentType) {
      updateBrandOptions();
    }
  }
}

function renderCustomBrands() {
  const allCustom = getAllCustomBrands();
  const container = document.getElementById('customBrandsContainer');
  const empty = document.getElementById('customBrandsEmpty');
  const clearBtn = document.getElementById('clearCustomBrandsBtn');
  
  // Remove existing items
  container.querySelectorAll('.pa-custom-brand-section').forEach(el => el.remove());
  
  const hasCustomBrands = Object.keys(allCustom).length > 0;
  
  if (!hasCustomBrands) {
    empty.style.display = 'block';
    clearBtn.style.display = 'none';
    return;
  }
  
  empty.style.display = 'none';
  clearBtn.style.display = 'inline-flex';
  
  // Render by vehicle type
  const typeLabels = {
    car: 'Cars',
    suv: 'SUVs / Vans',
    motorcycle: 'Motorcycles',
    tricycle: 'Tricycles',
    truck: 'Trucks'
  };
  
  Object.keys(allCustom).forEach(type => {
    if (allCustom[type].length === 0) return;
    
    const section = document.createElement('div');
    section.className = 'pa-custom-brand-section';
    
    const header = document.createElement('div');
    header.className = 'pa-custom-brand-header';
    header.textContent = typeLabels[type] || type;
    section.appendChild(header);
    
    const list = document.createElement('div');
    list.className = 'pa-custom-brand-list';
    
    allCustom[type].forEach(brand => {
      const item = document.createElement('div');
      item.className = 'pa-custom-brand-item';
      item.innerHTML = `
        <span class="pa-custom-brand-name">${escapeHtml(brand)}</span>
        <button class="pa-btn pa-btn-danger pa-btn-sm" onclick="deleteCustomBrand('${type}', '${escapeHtml(brand)}')">
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
            <path d="M2 3h8M5 3V2h2v1M4 3l.5 7h3L8 3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Delete
        </button>
      `;
      list.appendChild(item);
    });
    
    section.appendChild(list);
    container.appendChild(section);
  });
}

/* ─── Plate Number Formatter ──────────────── */
function formatPlateNumber(input) {
  let value = input.value.toUpperCase();
  // Remove any characters that aren't letters, numbers, or spaces
  value = value.replace(/[^A-Z0-9\s]/g, '');
  input.value = value;
}

/* ─── Number to Word Mapping ──────────────── */
const NUMBER_TO_WORD = {
  '0': 'zero',
  '1': 'one',
  '2': 'two',
  '3': 'three',
  '4': 'four',
  '5': 'five',
  '6': 'six',
  '7': 'seven',
  '8': 'eight',
  '9': 'nine'
};

/* ─── Format Plate Number for Speech ──────── */
function formatPlateForSpeech(plateNumber) {
  if (!plateNumber || plateNumber.trim() === '') {
    return 'XXXX';
  }
  
  // Remove all spaces and special characters
  const cleaned = plateNumber.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  
  if (cleaned === '') {
    return 'XXXX';
  }
  
  // Split into individual characters
  // Convert numbers to words, keep letters as-is
  // Example: "ABC123" becomes "A, B, C, one, two, three"
  const characters = cleaned.split('').map(char => {
    if (NUMBER_TO_WORD[char]) {
      return NUMBER_TO_WORD[char];
    }
    return char;
  });
  
  const spelled = characters.join(', ');
  
  return spelled;
}

/* ─── Get value (handles "Other") ────────── */
function getVal(selectId, inputId, fallback) {
  const select = document.getElementById(selectId);
  if (select.value === 'other') {
    const customValue = document.getElementById(inputId).value.trim();
    
    // Save custom brand if it's the model field
    if (selectId === 'carModel' && customValue) {
      const vehicleType = document.getElementById('vehicleType').value;
      if (vehicleType) {
        saveCustomBrand(vehicleType, customValue);
      }
    }
    
    return customValue || fallback;
  }
  return select.value || fallback;
}

/* ─── Generate text ───────────────────────── */
function generateText() {
  const vehicleType = document.getElementById('vehicleType').value;
  const model  = getVal('carModel', 'carModelOther', 'sasakyan');
  const color  = getVal('carColor', 'carColorOther', '');
  const plate  = document.getElementById('plateNumber').value.trim();
  const prefix = document.getElementById('prefix').value;
  const body   = document.getElementById('body').value;
  const suffix = document.getElementById('suffix').value;

  // Format plate number for clear speech (numbers to words)
  const plateForSpeech = formatPlateForSpeech(plate);

  // Add pauses around vehicle model for clarity
  // Format: "color, model, na may plate number"
  const colorPart = color ? `${color}, ` : '';
  const text = `${prefix} ${body} na ${colorPart}${model}, na may plate number na ${plateForSpeech}, ${suffix}`;

  document.getElementById('previewText').innerText = text;
  document.getElementById('finalText').value = text;
  
  // Set mode to parking
  setMode('parking');
}

/* ─── Apply custom text ───────────────────── */
function applyCustomText() {
  const text = document.getElementById('finalText').value;
  document.getElementById('previewText').innerText = text || 'No text entered.';
}

/* ─── Reset audio ─────────────────────────── */
function resetAudio() {
  chimeAudio.pause();
  chimeAudio.currentTime = 0;
  reverseAudio.pause();
  reverseAudio.currentTime = 0;
  
  // Stop ElevenLabs audio if playing
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }
}

/* ─── Stop everything ─────────────────────── */
function stopSpeech() {
  synth.cancel();
  resetAudio();
  
  // Restore ElevenLabs button if needed
  const speakBtn = document.querySelector('#elevenlabsActions .pa-btn-primary');
  if (speakBtn && currentEngine === 'elevenlabs') {
    speakBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><polygon points="3,1 11,6 3,11" fill="currentColor"/></svg> Speak';
    speakBtn.disabled = false;
  }
}

/* ─── Speak: chime → TTS → reverse ───────── */
async function speak() {
  const text = document.getElementById('finalText').value.trim();

  if (!text) {
    alert('No text to speak.');
    return;
  }

  // Stop any current playback
  synth.cancel();
  resetAudio();

  // Use ElevenLabs or Windows TTS based on selected engine
  if (currentEngine === 'elevenlabs') {
    const success = await speakWithElevenlabs(text);
    if (!success) {
      // Fallback to Windows TTS
      speakWithWindowsTTS(text);
    }
  } else {
    speakWithWindowsTTS(text);
  }
}

/* ─── Windows TTS Speech ──────────────────── */
function speakWithWindowsTTS(text) {
  const voices   = synth.getVoices();
  const selected = voices.find(v => v.name === voiceSelect.value);

  const utter = new SpeechSynthesisUtterance(text);
  utter.voice = selected || null;
  utter.rate  = parseFloat(rateInput.value);
  utter.pitch = parseFloat(pitchInput.value);

  utter.onend = () => {
    reverseAudio.currentTime = 0;
    reverseAudio.play().catch(err => console.warn('reverse.mp3 error:', err));
  };

  chimeAudio.play()
    .then(() => {
      chimeAudio.onended = () => synth.speak(utter);
    })
    .catch(err => {
      console.warn('chime.mp3 error:', err);
      synth.speak(utter);
    });
}

/* ═══════════════════════════════════════════
   SAVED ANNOUNCEMENTS
   Stored in localStorage as JSON array:
   [ { id, title, text }, ... ]
═══════════════════════════════════════════ */

const STORAGE_KEY = 'pa_announcements';

function getAnnouncements() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function setAnnouncements(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

/* ─── Save new announcement ───────────────── */
function saveAnnouncement() {
  const title = document.getElementById('newAnnouncementTitle').value.trim();
  const text  = document.getElementById('newAnnouncementText').value.trim();

  if (!title || !text) {
    alert('Please fill in both the title and announcement text.');
    return;
  }

  const list = getAnnouncements();
  list.push({ id: Date.now(), title, text });
  setAnnouncements(list);

  document.getElementById('newAnnouncementTitle').value = '';
  document.getElementById('newAnnouncementText').value  = '';

  renderList();
}

/* ─── Load into speaker ───────────────────── */
function loadAnnouncement(id) {
  const list = getAnnouncements();
  const item = list.find(a => a.id === id);
  if (!item) return;

  document.getElementById('finalText').value        = item.text;
  document.getElementById('previewText').innerText  = item.text;
  
  // Set mode to custom
  setMode('custom');

  /* Scroll up so user sees it loaded */
  document.getElementById('previewText').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

/* ─── Delete saved announcement ───────────── */
function deleteAnnouncement(id) {
  let list = getAnnouncements();
  list = list.filter(a => a.id !== id);
  setAnnouncements(list);
  renderList();
}

/* ─── Render the saved list ───────────────── */
function renderList() {
  const list    = getAnnouncements();
  const container = document.getElementById('savedList');
  const empty   = document.getElementById('savedEmpty');

  /* Remove existing rows (keep the empty message node) */
  container.querySelectorAll('.pa-saved-item').forEach(el => el.remove());

  if (list.length === 0) {
    empty.style.display = 'block';
    return;
  }

  empty.style.display = 'none';

  list.forEach(item => {
    const row = document.createElement('div');
    row.className = 'pa-saved-item';
    row.innerHTML = `
      <div class="pa-saved-info">
        <span class="pa-saved-title">${escapeHtml(item.title)}</span>
        <span class="pa-saved-text">${escapeHtml(item.text)}</span>
      </div>
      <div class="pa-saved-actions">
        <button class="pa-btn pa-btn-secondary pa-btn-sm" onclick="loadAnnouncement(${item.id})">
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
            <path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Load
        </button>
        <button class="pa-btn pa-btn-danger pa-btn-sm" onclick="deleteAnnouncement(${item.id})">
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
            <path d="M2 3h8M5 3V2h2v1M4 3l.5 7h3L8 3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Delete
        </button>
      </div>
    `;
    container.appendChild(row);
  });
}

/* ─── HTML escape helper ──────────────────── */
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ─── Clock ───────────────────────────────── */
function updateTime() {
  const now = new Date();
  document.getElementById('live-time').textContent = now.toLocaleTimeString();
  document.getElementById('live-date').textContent = now.toLocaleDateString('en-PH', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

setInterval(updateTime, 1000);
updateTime();

/* ═══════════════════════════════════════════
   ELEVENLABS INTEGRATION
═══════════════════════════════════════════ */

/* ─── Usage Tracking Functions ────────────── */
function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function getUsageData() {
  try {
    const storedMonth = localStorage.getItem(ELEVENLABS_MONTH_KEY);
    const currentMonth = getCurrentMonth();
    
    // Reset if new month
    if (storedMonth !== currentMonth) {
      localStorage.setItem(ELEVENLABS_MONTH_KEY, currentMonth);
      localStorage.setItem(ELEVENLABS_USAGE_KEY, '0');
      return { used: 0, month: currentMonth };
    }
    
    const used = parseInt(localStorage.getItem(ELEVENLABS_USAGE_KEY) || '0');
    return { used, month: currentMonth };
  } catch {
    return { used: 0, month: getCurrentMonth() };
  }
}

function addUsage(characters) {
  try {
    const { used } = getUsageData();
    const newUsed = used + characters;
    localStorage.setItem(ELEVENLABS_USAGE_KEY, String(newUsed));
    localStorage.setItem(ELEVENLABS_MONTH_KEY, getCurrentMonth());
    updateUsageDisplay();
  } catch (err) {
    console.warn('Could not update usage:', err);
  }
}

function updateUsageDisplay() {
  const { used } = getUsageData();
  const remaining = ELEVENLABS_FREE_LIMIT - used;
  const percentage = Math.round((used / ELEVENLABS_FREE_LIMIT) * 100);
  
  const usageInfo = document.getElementById('usageInfo');
  if (!usageInfo) return;
  
  // Determine status
  let statusClass = 'usage-ok';
  let statusIcon = '✅';
  let statusText = 'Good';
  
  if (percentage >= 90) {
    statusClass = 'usage-critical';
    statusIcon = '🚨';
    statusText = 'Critical';
  } else if (percentage >= 75) {
    statusClass = 'usage-warning';
    statusIcon = '⚠️';
    statusText = 'Warning';
  }
  
  // Build HTML
  usageInfo.className = `pa-usage-info ${statusClass}`;
  usageInfo.innerHTML = `
    <div class="usage-header">
      <small><strong>Usage This Month</strong></small>
      <small class="usage-status">${statusIcon} ${statusText}</small>
    </div>
    <div class="usage-bar">
      <div class="usage-bar-fill" style="width: ${Math.min(percentage, 100)}%"></div>
    </div>
    <div class="usage-stats">
      <small><strong>${used.toLocaleString()}</strong> / ${ELEVENLABS_FREE_LIMIT.toLocaleString()} chars (${percentage}%)</small>
      <small class="usage-remaining">${remaining.toLocaleString()} remaining</small>
    </div>
  `;
}

/* ─── Switch Voice Engine ─────────────────── */
function switchEngine(engine) {
  currentEngine = engine;
  
  // Update button states
  document.getElementById('engineWindows').classList.toggle('active', engine === 'windows');
  document.getElementById('engineElevenlabs').classList.toggle('active', engine === 'elevenlabs');
  
  // Show/hide settings
  document.getElementById('windowsSettings').style.display = engine === 'windows' ? 'block' : 'none';
  document.getElementById('elevenlabsSettings').style.display = engine === 'elevenlabs' ? 'block' : 'none';
  document.getElementById('elevenlabsActions').style.display = engine === 'elevenlabs' ? 'block' : 'none';
}

/* ─── Save/Load ElevenLabs API Key ────────── */
function saveElevenlabsApiKey() {
  const apiKey = document.getElementById('elevenlabsApiKey').value.trim();
  if (apiKey) {
    localStorage.setItem(ELEVENLABS_API_KEY, apiKey);
  }
}

function loadElevenlabsApiKey() {
  const apiKey = localStorage.getItem(ELEVENLABS_API_KEY);
  if (apiKey) {
    document.getElementById('elevenlabsApiKey').value = apiKey;
  }
}

// Auto-save API key on input
document.addEventListener('DOMContentLoaded', () => {
  const apiKeyInput = document.getElementById('elevenlabsApiKey');
  if (apiKeyInput) {
    apiKeyInput.addEventListener('change', saveElevenlabsApiKey);
  }
});

/* ─── ElevenLabs Text-to-Speech ───────────── */
async function speakWithElevenlabs(text) {
  const apiKey = document.getElementById('elevenlabsApiKey').value.trim();
  
  if (!apiKey) {
    alert('Please enter your ElevenLabs API key first.');
    return false;
  }
  
  // Check if user has enough quota
  const { used } = getUsageData();
  const textLength = text.length;
  const remaining = ELEVENLABS_FREE_LIMIT - used;
  
  if (textLength > remaining) {
    alert(`Not enough quota!\n\nThis announcement needs ${textLength} characters.\nYou only have ${remaining} characters remaining this month.\n\nYour quota will reset next month.`);
    return false;
  }
  
  const voiceId = document.getElementById('elevenlabsVoice').value;
  
  try {
    // Show loading state
    const speakBtn = document.querySelector('#elevenlabsActions .pa-btn-primary');
    const originalText = speakBtn.innerHTML;
    speakBtn.innerHTML = '<span>Generating...</span>';
    speakBtn.disabled = true;
    
    // Call ElevenLabs API with slower, more natural speech settings
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.6,
          similarity_boost: 0.8,
          style: 0.0,
          use_speaker_boost: true
        }
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail?.message || 'Failed to generate speech');
    }
    
    // Track usage AFTER successful generation
    addUsage(textLength);
    
    // Get audio blob
    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    
    // Create audio element with much slower playback rate for clear, relaxed speech
    currentAudio = new Audio(audioUrl);
    currentAudio.playbackRate = 0.80; // Slow down to 75% speed - calm and professional pace
    
    // Play sequence: chime → speech → reverse chime
    chimeAudio.play()
      .then(() => {
        chimeAudio.onended = () => {
          currentAudio.play();
          currentAudio.onended = () => {
            reverseAudio.play().catch(err => console.warn('reverse chime error:', err));
            // Restore button
            speakBtn.innerHTML = originalText;
            speakBtn.disabled = false;
          };
        };
      })
      .catch(err => {
        console.warn('chime error:', err);
        currentAudio.play();
        currentAudio.onended = () => {
          reverseAudio.play().catch(err => console.warn('reverse chime error:', err));
          speakBtn.innerHTML = originalText;
          speakBtn.disabled = false;
        };
      });
    
    return true;
    
  } catch (error) {
    console.error('ElevenLabs error:', error);
    alert('Error: ' + error.message + '\n\nFalling back to Windows TTS.');
    
    // Restore button
    const speakBtn = document.querySelector('#elevenlabsActions .pa-btn-primary');
    if (speakBtn) {
      speakBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><polygon points="3,1 11,6 3,11" fill="currentColor"/></svg> Speak';
      speakBtn.disabled = false;
    }
    
    return false;
  }
}

/* ─── Init ────────────────────────────────── */
renderList();
renderCustomBrands();
setMode('ready');
loadElevenlabsApiKey();
updateUsageDisplay();