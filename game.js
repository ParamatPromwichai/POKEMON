// ============================================================================
// POKÉ-PIXEL RPG ENGINE (40 Pokémon + 3-to-5 Stage Evolutions + 5 Rarity Tiers
// + Full 8-Bit Audio Synthesizer + PWA Auto-Save)
// ============================================================================

const SAVE_STORAGE_KEY = 'POKE_PIXEL_RPG_SAVE_V4';
let deferredPwaPrompt = null;

// ============================================================================
// FULL 8-BIT CHIPTUNE SOUND & BGM SYNTHESIZER (Web Audio API)
// ============================================================================
const SFX = {
  ctx: null,
  noiseBuf: null,
  sfxEnabled: true,
  bgmEnabled: true,
  bgmMode: 'overworld',
  bgmTimer: null,
  bgmStep: 0,

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        const sr = this.ctx.sampleRate;
        this.noiseBuf = this.ctx.createBuffer(1, sr, sr);
        const out = this.noiseBuf.getChannelData(0);
        for (let i = 0; i < sr; i++) out[i] = Math.random() * 2 - 1;
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  },

  beep(freq, type = 'square', dur = 0.1, delay = 0, vol = 0.09) {
    if (!this.sfxEnabled) return;
    this.init();
    if (!this.ctx) return;
    const t = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + dur);
  },

  slide(startFreq, endFreq, type = 'square', dur = 0.18, delay = 0, vol = 0.1) {
    if (!this.sfxEnabled) return;
    this.init();
    if (!this.ctx) return;
    const t = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(startFreq, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), t + dur);
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + dur);
  },

  noise(dur = 0.12, delay = 0, vol = 0.1, filterFreq = 1200, filterType = 'bandpass') {
    if (!this.sfxEnabled) return;
    this.init();
    if (!this.ctx || !this.noiseBuf) return;
    const t = this.ctx.currentTime + delay;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;

    const filter = this.ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.setValueAtTime(filterFreq, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    src.start(t);
    src.stop(t + dur);
  },

  uiClick() {
    this.beep(780, 'square', 0.045, 0, 0.06);
  },
  grassStep() {
    this.noise(0.055, 0, 0.04, 2400, 'highpass');
  },
  coinChime() {
    this.beep(987.77, 'square', 0.07, 0, 0.09);
    this.beep(1318.51, 'square', 0.22, 0.07, 0.1);
  },
  runAway() {
    [500, 420, 350, 280].forEach((f, i) => this.slide(f, f * 1.3, 'triangle', 0.06, i * 0.055, 0.09));
  },
  shinySparkle() {
    const notes = [1046.5, 1318.5, 1568, 2093, 1568, 2093];
    notes.forEach((f, i) => this.beep(f, 'sine', 0.1, i * 0.065, 0.12));
  },

  // --- Special Rarity Encounter Sound Effects! ---
  playRarityAlert(rarity) {
    if (!this.sfxEnabled) return;
    if (rarity === 'mythic') {
      // Cosmic Mythic 5-Star Siren + Chime!
      [523.25, 659.25, 783.99, 1046.5, 1318.5, 1567.98, 2093].forEach((f, i) => {
        this.beep(f, 'sawtooth', 0.12, i * 0.065, 0.13);
      });
      this.noise(0.3, 0.1, 0.08, 2800, 'highpass');
    } else if (rarity === 'legendary') {
      // Heroic Legendary 4-Star Fanfare!
      [440, 554.37, 659.25, 880, 659.25, 880].forEach((f, i) => {
        this.beep(f, 'square', 0.11, i * 0.07, 0.12);
      });
    } else if (rarity === 'epic') {
      // Epic 3-Star Alert
      [392, 587.33, 783.99].forEach((f, i) => {
        this.beep(f, 'triangle', 0.1, i * 0.07, 0.11);
      });
    }
  },

  // --- Evolution Cutscene Audio Effects! ---
  evolutionStart() {
    [392, 493.88, 587.33, 783.99].forEach((f, i) => {
      this.beep(f, 'square', 0.12, i * 0.09, 0.11);
    });
  },
  evolutionPulse(stepIdx, isMegaStage = false) {
    const pitchBoost = 1 + Math.floor(stepIdx / 3) * (isMegaStage ? 0.11 : 0.08);
    const f1 = (stepIdx % 2 === 0 ? 392 : 523.25) * pitchBoost;
    const f2 = (stepIdx % 2 === 0 ? 493.88 : 659.25) * pitchBoost;
    this.beep(f1, isMegaStage ? 'sawtooth' : 'square', 0.11, 0, 0.1);
    this.beep(f2, 'triangle', 0.11, 0.09, 0.1);
  },
  evolutionComplete(isMegaStage = false) {
    const notes = isMegaStage
      ? [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5, 1318.51, 1567.98]
      : [523.25, 587.33, 659.25, 783.99, 659.25, 783.99, 1046.5];
    notes.forEach((f, i) => {
      this.beep(f, 'square', i === notes.length - 1 ? 0.45 : 0.11, i * 0.11, 0.13);
    });
    this.noise(0.28, notes.length * 0.1, 0.1, 2500, 'highpass');
  },

  // --- Unique 8-Bit Electronic Cry for all 40 Pokemon! ---
  playPokemonCry(pokeId) {
    if (!this.sfxEnabled) return;
    const id = Number(pokeId) || 1;
    const p = POKEMON_DB.find(x => x.id === id) || POKEMON_DB[0];

    if (p.rarity === 'mythic' || p.stage >= 4) {
      // Mythic / Stage 4-5 Divine Roar + Harmonic Echo!
      const root = 140 + (id * 17) % 130;
      this.slide(root * 2.2, root * 0.65, 'sawtooth', 0.25, 0, 0.14);
      this.noise(0.28, 0.04, 0.12, 1100, 'bandpass');
      this.slide(root * 1.6, root * 2.8, 'square', 0.26, 0.18, 0.12);
    } else if (p.rarity === 'legendary' || p.stage === 3) {
      // Mighty Stage 3 / Legendary Roar
      const root = 170 + (id * 13) % 140;
      this.slide(root * 1.8, root * 0.7, 'sawtooth', 0.2, 0, 0.12);
      this.noise(0.2, 0.05, 0.1, 900, 'lowpass');
      this.slide(root * 1.3, root * 0.6, 'square', 0.22, 0.18, 0.11);
    } else if (p.type === 'electric') {
      const base = p.stage === 1 ? 820 : 640;
      this.slide(base, base * 1.45, 'square', 0.09, 0, 0.1);
      this.slide(base * 1.3, base * 0.75, 'square', 0.13, 0.1, 0.1);
    } else if (p.type === 'fairy' || p.type === 'psychic') {
      const root = 520 + (id * 23) % 240;
      [root, root * 1.25, root * 1.12, root * 1.5].forEach((f, i) => {
        this.beep(f, 'sine', 0.1, i * 0.075, 0.11);
      });
    } else {
      const root = 310 + (id * 29) % 240;
      this.slide(root, root * 1.35, 'triangle', 0.1, 0, 0.11);
      this.slide(root * 1.2, root * 0.85, 'square', 0.13, 0.11, 0.1);
    }
  },

  playMoveSFX(vfxType) {
    if (!this.sfxEnabled) return;
    switch (vfxType) {
      case 'electric':
        [920, 1380, 680, 1520, 840, 1680].forEach((f, i) => {
          this.beep(f, 'sawtooth', 0.05, i * 0.045, 0.11);
        });
        this.noise(0.22, 0.05, 0.09, 2800, 'bandpass');
        break;
      case 'fire':
        this.slide(280, 120, 'sawtooth', 0.32, 0, 0.11);
        this.noise(0.35, 0, 0.14, 700, 'lowpass');
        this.noise(0.25, 0.1, 0.1, 1400, 'bandpass');
        break;
      case 'water':
        [380, 520, 440, 660, 580, 780].forEach((f, i) => {
          this.slide(f, f + 180, 'sine', 0.06, i * 0.045, 0.12);
        });
        this.noise(0.2, 0.12, 0.08, 1800, 'bandpass');
        break;
      case 'leaf':
        this.noise(0.08, 0, 0.12, 3200, 'highpass');
        this.slide(900, 350, 'triangle', 0.09, 0, 0.1);
        this.noise(0.08, 0.12, 0.12, 3500, 'highpass');
        this.slide(1050, 400, 'triangle', 0.09, 0.12, 0.1);
        break;
      case 'powder':
      case 'music':
        [523.25, 659.25, 783.99, 659.25, 523.25].forEach((f, i) => {
          this.beep(f, 'sine', 0.14, i * 0.08, 0.11);
        });
        break;
      case 'psychic':
        [620, 880, 540, 960, 480, 1080].forEach((f, i) => {
          this.slide(f, f * 0.8, 'sine', 0.07, i * 0.05, 0.11);
        });
        break;
      case 'shadow':
        this.slide(320, 110, 'sawtooth', 0.28, 0, 0.12);
        this.beep(196, 'square', 0.25, 0.06, 0.1);
        break;
      case 'dragon':
        this.slide(420, 140, 'sawtooth', 0.32, 0, 0.13);
        this.noise(0.3, 0.04, 0.12, 950, 'bandpass');
        break;
      case 'sparkle':
        [784, 987, 1174, 1568].forEach((f, i) => this.beep(f, 'triangle', 0.09, i * 0.055, 0.11));
        break;
      case 'slash':
      case 'impact':
      default:
        this.slide(240, 65, 'square', 0.14, 0, 0.14);
        this.noise(0.14, 0, 0.14, 900, 'lowpass');
        break;
    }
  },

  battleStart() {
    [330, 392, 659, 523, 587, 784].forEach((f, i) => this.beep(f, 'square', 0.08, i * 0.055, 0.1));
  },

  hit(effective = 1) {
    if (effective > 1) {
      this.slide(580, 120, 'sawtooth', 0.18, 0, 0.15);
      this.noise(0.18, 0, 0.15, 1100, 'bandpass');
      this.beep(880, 'square', 0.1, 0.08, 0.12);
    } else if (effective < 1) {
      this.slide(180, 90, 'triangle', 0.12, 0, 0.09);
    } else {
      this.slide(280, 95, 'square', 0.13, 0, 0.12);
      this.noise(0.1, 0, 0.11, 1000, 'lowpass');
    }
  },

  faint() {
    this.slide(440, 110, 'sawtooth', 0.38, 0, 0.12);
    this.noise(0.2, 0.18, 0.08, 600, 'lowpass');
  },

  healCenter() {
    const notes = [493.88, 493.88, 493.88, 415.30, 659.25];
    const delays = [0, 0.16, 0.32, 0.48, 0.70];
    notes.forEach((f, i) => this.beep(f, 'triangle', 0.16, delays[i], 0.15));
  },

  throwBall() {
    this.slide(300, 780, 'sine', 0.14, 0, 0.11);
    this.beep(920, 'square', 0.08, 0.14, 0.09);
  },

  ballSuckIn() {
    this.slide(980, 320, 'sawtooth', 0.22, 0, 0.09);
  },

  ballShake() {
    this.beep(240, 'triangle', 0.07, 0, 0.12);
    this.beep(320, 'triangle', 0.07, 0.07, 0.12);
  },

  ballBreakOut() {
    this.noise(0.15, 0, 0.13, 1600, 'bandpass');
    this.slide(480, 180, 'sawtooth', 0.18, 0.04, 0.11);
  },

  catchFanfare() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, i) => this.beep(n, 'square', 0.14, i * 0.11, 0.12));
    this.beep(1046.5, 'square', 0.09, 0.48, 0.12);
    this.beep(1174.66, 'square', 0.09, 0.58, 0.12);
    this.beep(1318.51, 'square', 0.35, 0.68, 0.14);
  },

  levelUp() {
    [440, 554.37, 659.25, 880, 1108.73].forEach((n, i) => this.beep(n, 'triangle', 0.13, i * 0.08, 0.14));
  },

  startBGM(mode = 'overworld') {
    this.bgmMode = mode;
    this.bgmStep = 0;
    if (this.bgmTimer) clearInterval(this.bgmTimer);
    if (!this.bgmEnabled) return;

    const melodies = {
      overworld: {
        tempo: 240,
        notes: [
          523.25, 659.25, 783.99, 659.25, 587.33, 698.46, 587.33, 493.88,
          523.25, 659.25, 783.99, 880.00, 783.99, 659.25, 587.33, 0
        ]
      },
      wild: {
        tempo: 155,
        notes: [
          330, 392, 440, 330, 392, 493.88, 440, 392,
          349.23, 440, 523.25, 440, 392, 330, 293.66, 392
        ]
      },
      gym: {
        tempo: 140,
        notes: [
          440, 440, 523.25, 587.33, 659.25, 587.33, 523.25, 493.88,
          440, 523.25, 659.25, 783.99, 880, 783.99, 659.25, 587.33
        ]
      }
    };

    const currentTrack = melodies[mode] || melodies.overworld;
    this.bgmTimer = setInterval(() => {
      if (!this.bgmEnabled || !this.ctx || this.ctx.state !== 'running') return;
      const f = currentTrack.notes[this.bgmStep % currentTrack.notes.length];
      this.bgmStep++;
      if (f > 0) {
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = mode === 'overworld' ? 'triangle' : 'square';
        osc.frequency.setValueAtTime(f, t);
        g.gain.setValueAtTime(mode === 'overworld' ? 0.032 : 0.025, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + (currentTrack.tempo / 1000) * 0.85);
        osc.connect(g);
        g.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + (currentTrack.tempo / 1000) * 0.9);
      }
    }, currentTrack.tempo);
  },

  toggleBGM() {
    this.init();
    this.bgmEnabled = !this.bgmEnabled;
    if (this.bgmEnabled) {
      this.startBGM(this.bgmMode);
    } else if (this.bgmTimer) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
    return this.bgmEnabled;
  },

  toggleSFX() {
    this.init();
    this.sfxEnabled = !this.sfxEnabled;
    if (this.sfxEnabled) this.uiClick();
    return this.sfxEnabled;
  }
};

// ============================================================================
// WEIGHTED RARITY SPAWNER (ตัวแรร์ยิ่งหายาก!)
// ============================================================================
function pickWildPokemonByRarity() {
  // First roll rarity tier by weight (Common 55%, Rare 26%, Epic 12%, Legendary 5%, Mythic 2%)
  const tiers = Object.values(RARITY_TIERS);
  const totalWeight = tiers.reduce((sum, t) => sum + t.spawnWeight, 0);
  let r = Math.random() * totalWeight;
  let chosenRarity = 'common';
  for (const t of tiers) {
    r -= t.spawnWeight;
    if (r <= 0) {
      chosenRarity = t.id;
      break;
    }
  }
  const pool = POKEMON_DB.filter(p => p.rarity === chosenRarity);
  if (pool.length === 0) return POKEMON_DB[0];
  return pool[Math.floor(Math.random() * pool.length)];
}

// --- Create a Pokemon Instance with RPG Stats ---
function createPokemonInstance(template, level = 5, isShiny = false) {
  const mult = 1 + (level - 1) * 0.14;
  const maxHp = Math.floor(template.baseHp * mult);
  return {
    uid: Date.now() + Math.random(),
    id: template.id,
    code: template.code,
    name: template.name,
    type: template.type,
    rarity: template.rarity,
    stage: template.stage,
    maxStage: template.maxStage,
    level,
    exp: 0,
    nextExp: level * 35,
    maxHp,
    hp: maxHp,
    atk: Math.floor(template.baseAtk * mult),
    def: Math.floor(template.baseDef * mult),
    spd: Math.floor(template.baseSpd * mult),
    moves: [...template.moves],
    isShiny,
    status: null
  };
}

// --- Global Game State ---
const Game = {
  coins: 450,
  badges: 0,
  party: [],
  pcBox: [],
  pokedex: {},
  bag: {
    pokeball:   { name: 'โปเกบอล (Poké Ball)', count: 12, rate: 1.0, price: 25, kind: 'ball' },
    greatball:  { name: 'เกรทบอล (Great Ball)', count: 4,  rate: 1.5, price: 60, kind: 'ball' },
    ultraball:  { name: 'อัลตร้าบอล (Ultra Ball)', count: 2, rate: 2.1, price: 110, kind: 'ball' },
    masterball: { name: 'มาสเตอร์บอล (Master)', count: 1, rate: 99.0, price: 300, kind: 'ball' },
    potion:     { name: 'ยารักษา (Potion +35HP)', count: 5, heal: 35, price: 30, kind: 'heal' },
    superpotion:{ name: 'ซูเปอร์โพชั่น (+90HP)', count: 2, heal: 90, price: 70, kind: 'heal' }
  },
  battle: {
    active: false,
    isTrainer: false,
    trainerName: '',
    trainerQueue: [],
    enemy: null,
    playerIdx: 0,
    turnBusy: false,
    menuMode: 'fight'
  },
  dexShinyPreview: false,
  dexRarityFilter: 'all',
  evolvingNow: false
};

// ============================================================================
// PERSISTENT SAVE / LOAD SYSTEM (Auto-migrates old saves to 40-Pokemon DB)
// ============================================================================
function saveGameData() {
  try {
    const payload = {
      version: 4,
      savedAt: Date.now(),
      coins: Game.coins,
      badges: Game.badges,
      party: Game.party,
      pcBox: Game.pcBox,
      pokedex: Game.pokedex,
      bagCounts: Object.fromEntries(
        Object.entries(Game.bag).map(([k, v]) => [k, v.count])
      ),
      playerPos: { x: Overworld.player.x, y: Overworld.player.y }
    };
    localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(payload));

    const badge = document.getElementById('saveStatusBadge');
    if (badge) {
      badge.textContent = '💾 เซฟข้อมูลอัตโนมัติแล้ว';
      badge.style.borderColor = '#80ed99';
    }
  } catch (err) {
    console.warn('Save failed:', err);
  }
}

function loadGameData() {
  try {
    const raw =
      localStorage.getItem(SAVE_STORAGE_KEY) ||
      localStorage.getItem('POKE_PIXEL_RPG_SAVE_V3') ||
      localStorage.getItem('POKE_PIXEL_RPG_SAVE_V2');
    if (!raw) return false;
    const data = JSON.parse(raw);
    if (!data || !Array.isArray(data.party) || data.party.length === 0) return false;

    const syncPoke = p => {
      const tmpl = POKEMON_DB.find(t => t.code === p.code) || POKEMON_DB.find(t => t.id === p.id) || POKEMON_DB[0];
      p.id = tmpl.id;
      p.code = tmpl.code;
      p.name = tmpl.name;
      p.type = tmpl.type;
      p.rarity = tmpl.rarity;
      p.stage = tmpl.stage;
      p.maxStage = tmpl.maxStage;
      p.moves = [...tmpl.moves];
      return p;
    };

    Game.coins = typeof data.coins === 'number' ? data.coins : 450;
    Game.badges = typeof data.badges === 'number' ? data.badges : 0;
    Game.party = data.party.map(syncPoke);
    Game.pcBox = Array.isArray(data.pcBox) ? data.pcBox.map(syncPoke) : [];
    Game.pokedex = {};
    [...Game.party, ...Game.pcBox].forEach(p => {
      if (!Game.pokedex[p.id]) Game.pokedex[p.id] = { count: 0, shiny: false };
      Game.pokedex[p.id].count++;
      if (p.isShiny) Game.pokedex[p.id].shiny = true;
    });

    if (data.bagCounts) {
      Object.keys(Game.bag).forEach(k => {
        if (typeof data.bagCounts[k] === 'number') {
          Game.bag[k].count = data.bagCounts[k];
        }
      });
    }
    if (data.playerPos && typeof data.playerPos.x === 'number') {
      Overworld.player.x = data.playerPos.x;
      Overworld.player.y = data.playerPos.y;
    }
    return true;
  } catch (err) {
    console.warn('Load failed:', err);
    return false;
  }
}

function resetGameSave() {
  SFX.uiClick();
  if (!confirm('ต้องการลบข้อมูลเซฟทั้งหมดแล้วเริ่มเกมใหม่ตั้งแต่ต้นใช่ไหม?')) return;
  localStorage.removeItem(SAVE_STORAGE_KEY);
  localStorage.removeItem('POKE_PIXEL_RPG_SAVE_V3');
  localStorage.removeItem('POKE_PIXEL_RPG_SAVE_V2');
  window.location.reload();
}

function initPWA() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
  if (navigator.storage && navigator.storage.persist) {
    navigator.storage.persist().catch(() => {});
  }

  const installBtn = document.getElementById('btnInstallPwa');
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredPwaPrompt = e;
    if (installBtn) installBtn.style.display = 'inline-block';
  });

  if (installBtn) {
    installBtn.addEventListener('click', async () => {
      SFX.uiClick();
      if (deferredPwaPrompt) {
        deferredPwaPrompt.prompt();
        await deferredPwaPrompt.userChoice;
        deferredPwaPrompt = null;
        installBtn.style.display = 'none';
      } else {
        alert('📲 วิธีติดตั้งเป็นแอป (PWA):\n• มือถือ Android/Chrome: กดเมนู ⋮ มุมขวาบน เลือก "ติดตั้งแอป" หรือ "เพิ่มลงในหน้าจอหลัก"\n• มือถือ iPhone (Safari): กดปุ่มแชร์ (Share) ด้านล่าง เลือก "เพิ่มไปยังหน้าจอโฮม (Add to Home Screen)"\n\nข้อมูลโปเกมอนทั้ง 40 ตัว การวิวัฒนาการ 5 ร่าง และไอเทมทั้งหมดจะถูกเซฟไว้ในเครื่องอัตโนมัติ ไม่หายแน่นอน!');
      }
    });
  }
}

// ============================================================================
// MULTI-STAGE EVOLUTION SYSTEM (Supports 3, 4, and 5 Stages!)
// ============================================================================
function getEvolutionTemplateFor(pokeInst) {
  const tmpl = POKEMON_DB.find(t => t.id === pokeInst.id);
  if (!tmpl || !tmpl.evolvesTo) return null;
  return tmpl;
}

function canPokemonEvolveNow(pokeInst) {
  const tmpl = getEvolutionTemplateFor(pokeInst);
  if (!tmpl) return false;
  return pokeInst.level >= (tmpl.evolveLevel || 7);
}

function requestEvolvePartyMember(partyIdx, forcedTargetId = null) {
  if (Game.evolvingNow) return;
  const poke = Game.party[partyIdx];
  if (!poke) return;
  const tmpl = getEvolutionTemplateFor(poke);
  if (!tmpl) {
    SFX.hit(0.5);
    alert(`${poke.name} อยู่ในร่างสมบูรณ์สูงสุด (ร่างที่ ${poke.stage}/${poke.maxStage}) แล้ว!`);
    return;
  }

  // Multi-branch evolution (Eevee #36 -> Vaporeon #37, Jolteon #38, Flareon #39)
  if (Array.isArray(tmpl.evolvesTo) && !forcedTargetId) {
    SFX.uiClick();
    const modal = document.getElementById('pixelModal');
    const box = document.getElementById('pixelModalContent');
    box.innerHTML = `
      <h2 style="color:#ffd166;margin-bottom:8px;">✨ เลือกสายวิวัฒนาการของ ${poke.name.split(' ')[0]}!</h2>
      <p style="font-size:0.84rem;color:#c0cbdc;margin-bottom:12px;">เมื่อวิวัฒนาการเป็นร่างที่ 2 แล้ว ยังพัฒนาต่อสู่ร่างที่ 3 (เซเลสเทียลอีวุย ★★★★★) ได้อีก!</p>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:14px;">
        ${tmpl.evolvesTo.map(targetId => {
          const targetTmpl = POKEMON_DB.find(x => x.id === targetId);
          const tInfo = TYPE_INFO[targetTmpl.type];
          return `
            <div class="dex-card" onclick="requestEvolvePartyMember(${partyIdx}, ${targetId})">
              ${getPokemonPixelImgHTML(targetTmpl.code, poke.isShiny, 4)}
              <div style="font-weight:700;font-size:0.8rem;margin-top:6px;">${targetTmpl.name.split(' ')[0]}</div>
              <span style="background:${tInfo.color};font-size:0.68rem;padding:1px 5px;margin-top:3px;">${tInfo.label}</span>
            </div>
          `;
        }).join('')}
      </div>
      <button class="px-btn" onclick="document.getElementById('pixelModal').classList.remove('open')">ยกเลิก</button>
    `;
    modal.classList.add('open');
    return;
  }

  const nextId = forcedTargetId || (Array.isArray(tmpl.evolvesTo) ? tmpl.evolvesTo[0] : tmpl.evolvesTo);
  const nextTmpl = POKEMON_DB.find(t => t.id === nextId);
  if (!nextTmpl) return;

  playEvolutionCutscene(poke, nextTmpl);
}

function playEvolutionCutscene(pokeInst, nextTemplate) {
  Game.evolvingNow = true;
  const oldName = pokeInst.name.split(' ')[0];
  const oldCode = pokeInst.code;
  const newCode = nextTemplate.code;
  const isShiny = pokeInst.isShiny;
  const isMegaOrMythic = nextTemplate.stage >= 4 || nextTemplate.rarity === 'mythic';
  const rInfo = RARITY_TIERS[nextTemplate.rarity] || RARITY_TIERS.common;

  const modal = document.getElementById('pixelModal');
  const box = document.getElementById('pixelModalContent');
  modal.classList.add('open');

  SFX.evolutionStart();

  box.innerHTML = `
    <div style="font-size:0.8rem;color:${rInfo.border};font-weight:700;margin-bottom:4px;">
      กำลังวิวัฒนาการสู่ ร่างที่ ${nextTemplate.stage}/${nextTemplate.maxStage} (${rInfo.short})
    </div>
    <h2 style="color:#ffd166;margin-bottom:8px;">✨ เอ๊ะ!? ${oldName} กำลังจะวิวัฒนาการ!!</h2>
    <div id="evoStageBox" class="evo-stage-box" style="border-color:${rInfo.border};">
      <div id="evoSpriteSwap">${getPokemonPixelImgHTML(oldCode, isShiny, 7, 'evo-sprite-silhouette')}</div>
    </div>
    <p id="evoDialogTxt" style="font-size:0.95rem;color:#fff;font-weight:700;margin-bottom:12px;">
      พลังงานธาตุกำลังหลอมรวมเข้าสู่ร่างใหม่...
    </p>
  `;

  let step = 0;
  const totalSteps = 12;
  const swapEl = document.getElementById('evoSpriteSwap');

  const evoInterval = setInterval(() => {
    step++;
    SFX.evolutionPulse(step, isMegaOrMythic);
    const showNew = step % 2 === 1;
    if (swapEl) {
      swapEl.innerHTML = getPokemonPixelImgHTML(
        showNew ? newCode : oldCode,
        isShiny,
        7,
        'evo-sprite-silhouette'
      );
    }

    if (step >= totalSteps) {
      clearInterval(evoInterval);
      completeEvolutionTransform(pokeInst, nextTemplate);
    }
  }, 230);
}

function completeEvolutionTransform(pokeInst, nextTemplate) {
  const oldName = pokeInst.name.split(' ')[0];
  const isMegaOrMythic = nextTemplate.stage >= 4 || nextTemplate.rarity === 'mythic';
  const rInfo = RARITY_TIERS[nextTemplate.rarity] || RARITY_TIERS.common;

  pokeInst.id = nextTemplate.id;
  pokeInst.code = nextTemplate.code;
  pokeInst.name = nextTemplate.name;
  pokeInst.type = nextTemplate.type;
  pokeInst.rarity = nextTemplate.rarity;
  pokeInst.stage = nextTemplate.stage;
  pokeInst.maxStage = nextTemplate.maxStage;
  pokeInst.moves = [...nextTemplate.moves];

  const mult = 1 + (pokeInst.level - 1) * 0.14;
  pokeInst.maxHp = Math.floor(nextTemplate.baseHp * mult);
  pokeInst.hp = pokeInst.maxHp;
  pokeInst.atk = Math.floor(nextTemplate.baseAtk * mult);
  pokeInst.def = Math.floor(nextTemplate.baseDef * mult);
  pokeInst.spd = Math.floor(nextTemplate.baseSpd * mult);

  if (!Game.pokedex[nextTemplate.id]) {
    Game.pokedex[nextTemplate.id] = { count: 0, shiny: false };
  }
  Game.pokedex[nextTemplate.id].count++;
  if (pokeInst.isShiny) Game.pokedex[nextTemplate.id].shiny = true;

  saveGameData();
  renderAllUI();
  if (Game.battle.active) {
    setupBattleSpritesAndHUD();
    renderBattleCommandSubMenu();
  }

  SFX.evolutionComplete(isMegaOrMythic);
  setTimeout(() => SFX.playPokemonCry(nextTemplate.id), 980);

  const nextEvoHint = nextTemplate.evolvesTo
    ? `<div style="color:#ffd166;font-size:0.82rem;margin-bottom:8px;">🔥 ยังวิวัฒนาการต่อเป็นร่างที่ ${nextTemplate.stage + 1}/${nextTemplate.maxStage} ได้อีกที่ Lv.${nextTemplate.evolveLevel}!</div>`
    : `<div style="color:#80ed99;font-size:0.82rem;margin-bottom:8px;">👑 บรรลุร่างสมบูรณ์สูงสุด (${nextTemplate.stage}/${nextTemplate.maxStage}) แล้ว!</div>`;

  const box = document.getElementById('pixelModalContent');
  box.innerHTML = `
    <span style="background:${rInfo.color};border:2px solid ${rInfo.border};padding:2px 8px;font-size:0.78rem;font-weight:700;">
      ${rInfo.name} • ร่างที่ ${nextTemplate.stage}/${nextTemplate.maxStage}
    </span>
    <h2 style="color:#80ed99;margin:8px 0;">🎊 วิวัฒนาการสำเร็จ!!</h2>
    <div class="evo-stage-box" style="border-color:${rInfo.border};">
      <div class="evo-complete-burst">${getPokemonPixelImgHTML(nextTemplate.code, pokeInst.isShiny, 7)}</div>
    </div>
    <h3 style="color:#ffd166;margin-bottom:6px;">
      ${oldName} ➔ 「${nextTemplate.name}」 ${pokeInst.isShiny ? '✨' : ''}
    </h3>
    ${nextEvoHint}
    <p style="font-size:0.84rem;color:#c0cbdc;margin-bottom:14px;">
      HP ${pokeInst.maxHp} • โจมตี ${pokeInst.atk} • ป้องกัน ${pokeInst.def} • ความเร็ว ${pokeInst.spd}
    </p>
    <button class="px-btn btn-green" onclick="finishEvolutionModal()">🌟 ยอดเยี่ยมเลย!</button>
  `;
}

window.finishEvolutionModal = function () {
  SFX.uiClick();
  Game.evolvingNow = false;
  document.getElementById('pixelModal').classList.remove('open');
};

function useRareCandyOnLead() {
  const lead = Game.party[0];
  if (!lead) return;
  if (Game.coins < 40) {
    SFX.hit(0.5);
    alert('🪙 เหรียญไม่พอ! (ต้องการ 40 เหรียญสำหรับแคนดี้ +1 เลเวล)');
    return;
  }
  Game.coins -= 40;
  lead.level++;
  lead.nextExp = lead.level * 35;
  const tmpl = POKEMON_DB.find(t => t.id === lead.id) || POKEMON_DB[0];
  const mult = 1 + (lead.level - 1) * 0.14;
  lead.maxHp = Math.floor(tmpl.baseHp * mult);
  lead.hp = lead.maxHp;
  lead.atk = Math.floor(tmpl.baseAtk * mult);
  lead.def = Math.floor(tmpl.baseDef * mult);
  lead.spd = Math.floor(tmpl.baseSpd * mult);

  SFX.levelUp();
  saveGameData();
  renderAllUI();
  if (Game.battle.active) updateBattleHUDs();

  if (canPokemonEvolveNow(lead)) {
    setTimeout(() => requestEvolvePartyMember(0), 450);
  }
}

function triggerManualEvolveLead() {
  const lead = Game.party[0];
  if (!lead) return;
  const tmpl = getEvolutionTemplateFor(lead);
  if (!tmpl) {
    SFX.hit(0.5);
    alert(`🐾 ${lead.name} อยู่ในร่างสูงสุด (${lead.stage}/${lead.maxStage}) แล้ว!`);
    return;
  }
  if (Game.coins < 80) {
    SFX.hit(0.5);
    alert('🪙 เหรียญไม่พอ! (ต้องการ 80 เหรียญสำหรับหินวิวัฒนาการทันที)');
    return;
  }
  Game.coins -= 80;
  if (lead.level < (tmpl.evolveLevel || 7)) {
    lead.level = tmpl.evolveLevel || 7;
  }
  saveGameData();
  renderAllUI();
  requestEvolvePartyMember(0);
}

// ============================================================================
// PIXEL OVERWORLD MAP STATE & LOOP
// ============================================================================
const Overworld = {
  canvas: null,
  ctx: null,
  width: 640,
  height: 432,
  player: { x: 320, y: 225, tx: null, ty: null, speed: 2.9, step: 0 },
  keys: {},
  holdDir: null,
  wildEntities: [],
  grassParticles: [],
  grassZones: [
    { x: 32,  y: 64,  w: 192, h: 128 },
    { x: 416, y: 64,  w: 192, h: 128 },
    { x: 32,  y: 256, w: 192, h: 144 },
    { x: 416, y: 256, w: 192, h: 144 }
  ],
  pokeCenter: { x: 248, y: 24, w: 144, h: 84 },
  gymLeader:  { x: 320, y: 356, name: 'ยิมลีดเดอร์ เรด (RED)' }
};

window.addEventListener('DOMContentLoaded', () => {
  initPWA();

  const loaded = loadGameData();
  if (!loaded) {
    // Starter Team: Charmeling (#1, 5-stage fire), Pichu (#6, 4-stage electric), Drago-Egg (#22, 5-stage dragon)
    const s1 = createPokemonInstance(POKEMON_DB.find(p => p.id === 1), 4, false);
    const s2 = createPokemonInstance(POKEMON_DB.find(p => p.id === 6), 5, false);
    const s3 = createPokemonInstance(POKEMON_DB.find(p => p.id === 22), 5, false);
    registerPokemonOwned(s1, false);
    registerPokemonOwned(s2, false);
    registerPokemonOwned(s3, false);
    saveGameData();
  }

  initOverworldCanvas();
  bindUIControls();

  const unlockAudio = () => {
    SFX.init();
    if (SFX.bgmEnabled && !SFX.bgmTimer) {
      SFX.startBGM(SFX.bgmMode);
    }
    window.removeEventListener('pointerdown', unlockAudio);
    window.removeEventListener('keydown', unlockAudio);
  };
  window.addEventListener('pointerdown', unlockAudio);
  window.addEventListener('keydown', unlockAudio);

  for (let i = 0; i < 4; i++) spawnOverworldWild();

  renderAllUI();
  requestAnimationFrame(mainLoop);
});

function registerPokemonOwned(pokeInst, autoSave = true) {
  if (Game.party.length < 6) {
    Game.party.push(pokeInst);
  } else {
    Game.pcBox.push(pokeInst);
  }
  if (!Game.pokedex[pokeInst.id]) {
    Game.pokedex[pokeInst.id] = { count: 0, shiny: false };
  }
  Game.pokedex[pokeInst.id].count++;
  if (pokeInst.isShiny) Game.pokedex[pokeInst.id].shiny = true;
  if (autoSave) saveGameData();
}

function initOverworldCanvas() {
  Overworld.canvas = document.getElementById('worldCanvas');
  Overworld.ctx = Overworld.canvas.getContext('2d');
  Overworld.ctx.imageSmoothingEnabled = false;

  window.addEventListener('keydown', e => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code)) {
      Overworld.keys[e.code] = true;
      Overworld.player.tx = null;
      Overworld.player.ty = null;
    }
  });
  window.addEventListener('keyup', e => {
    Overworld.keys[e.code] = false;
  });

  Overworld.canvas.addEventListener('pointerdown', e => {
    SFX.uiClick();
    const rect = Overworld.canvas.getBoundingClientRect();
    const sx = Overworld.width / rect.width;
    const sy = Overworld.height / rect.height;
    const cx = (e.clientX - rect.left) * sx;
    const cy = (e.clientY - rect.top) * sy;

    const pc = Overworld.pokeCenter;
    if (cx >= pc.x && cx <= pc.x + pc.w && cy >= pc.y && cy <= pc.y + pc.h + 15) {
      healPartyAtCenter();
      return;
    }

    if (Math.hypot(cx - Overworld.gymLeader.x, cy - Overworld.gymLeader.y) < 32) {
      startGymBattle();
      return;
    }

    for (let i = 0; i < Overworld.wildEntities.length; i++) {
      const w = Overworld.wildEntities[i];
      if (Math.hypot(cx - w.x, cy - w.y) < 30) {
        Overworld.wildEntities.splice(i, 1);
        startWildBattle(w.template, w.level, w.isShiny);
        return;
      }
    }

    Overworld.player.tx = Math.max(24, Math.min(Overworld.width - 24, cx));
    Overworld.player.ty = Math.max(36, Math.min(Overworld.height - 24, cy));
  });
}

function spawnOverworldWild() {
  if (Overworld.wildEntities.length >= 5) return;
  const z = Overworld.grassZones[Math.floor(Math.random() * Overworld.grassZones.length)];
  const template = pickWildPokemonByRarity();
  const avgLv = Game.party[0] ? Game.party[0].level : 5;
  const level = Math.max(3, avgLv + Math.floor(Math.random() * 4) - 2);
  const isShiny = Math.random() < 0.14;

  Overworld.wildEntities.push({
    template,
    level,
    isShiny,
    x: z.x + 24 + Math.random() * (z.w - 48),
    y: z.y + 24 + Math.random() * (z.h - 48),
    vx: (Math.random() - 0.5) * 0.5,
    vy: (Math.random() - 0.5) * 0.5,
    phase: Math.random() * 6
  });
}

function mainLoop(ts) {
  updateOverworld(ts);
  drawOverworld(ts);
  requestAnimationFrame(mainLoop);
}

function updateOverworld(ts) {
  const worldActive = document.getElementById('view-world').classList.contains('active');
  if (!worldActive || Game.evolvingNow) return;

  const p = Overworld.player;
  let dx = 0, dy = 0;
  if (Overworld.keys['ArrowUp'] || Overworld.keys['KeyW'] || Overworld.holdDir === 'up') dy -= 1;
  if (Overworld.keys['ArrowDown'] || Overworld.keys['KeyS'] || Overworld.holdDir === 'down') dy += 1;
  if (Overworld.keys['ArrowLeft'] || Overworld.keys['KeyA'] || Overworld.holdDir === 'left') dx -= 1;
  if (Overworld.keys['ArrowRight'] || Overworld.keys['KeyD'] || Overworld.holdDir === 'right') dx += 1;

  if (dx === 0 && dy === 0 && p.tx !== null && p.ty !== null) {
    const dist = Math.hypot(p.tx - p.x, p.ty - p.y);
    if (dist > 4) {
      dx = (p.tx - p.x) / dist;
      dy = (p.ty - p.y) / dist;
    } else {
      p.tx = null;
      p.ty = null;
    }
  }

  if (dx !== 0 || dy !== 0) {
    const len = Math.hypot(dx, dy);
    p.x = Math.max(20, Math.min(Overworld.width - 20, p.x + (dx / len) * p.speed));
    p.y = Math.max(36, Math.min(Overworld.height - 20, p.y + (dy / len) * p.speed));
    const prevStep = Math.floor(p.step);
    p.step += 0.18;

    const inGrass = Overworld.grassZones.some(
      z => p.x > z.x && p.x < z.x + z.w && p.y > z.y && p.y < z.y + z.h
    );
    if (inGrass) {
      if (Math.floor(p.step) !== prevStep && Math.random() < 0.5) {
        SFX.grassStep();
      }
      if (Math.random() < 0.25) {
        Overworld.grassParticles.push({
          x: p.x + (Math.random() - 0.5) * 16,
          y: p.y + 8,
          life: 15
        });
      }
      if (Math.random() < 0.007) {
        Overworld.keys = {};
        Overworld.holdDir = null;
        p.tx = null; p.ty = null;
        const t = pickWildPokemonByRarity();
        const lv = Math.max(3, (Game.party[0]?.level || 5) + Math.floor(Math.random() * 3) - 1);
        startWildBattle(t, lv, Math.random() < 0.14);
        return;
      }
    }
  }

  for (let i = Overworld.wildEntities.length - 1; i >= 0; i--) {
    const w = Overworld.wildEntities[i];
    w.x += w.vx;
    w.y += w.vy;
    if (w.x < 30 || w.x > Overworld.width - 30) w.vx *= -1;
    if (w.y < 50 || w.y > Overworld.height - 30) w.vy *= -1;

    if (Math.hypot(p.x - w.x, p.y - w.y) < 26) {
      Overworld.wildEntities.splice(i, 1);
      Overworld.keys = {};
      Overworld.holdDir = null;
      p.tx = null; p.ty = null;
      startWildBattle(w.template, w.level, w.isShiny);
      return;
    }
  }

  if (Math.random() < 0.01 && Overworld.wildEntities.length < 4) {
    spawnOverworldWild();
  }
}

function drawOverworld(ts) {
  const ctx = Overworld.ctx;
  if (!ctx) return;

  for (let y = 0; y < Overworld.height; y += 16) {
    for (let x = 0; x < Overworld.width; x += 16) {
      ctx.fillStyle = ((x / 16 + y / 16) % 2 === 0) ? '#57cc99' : '#4ec290';
      ctx.fillRect(x, y, 16, 16);
    }
  }

  ctx.fillStyle = '#e6ccb2';
  ctx.fillRect(288, 108, 64, 260);
  ctx.fillRect(160, 200, 320, 48);
  ctx.strokeStyle = '#b08968';
  ctx.lineWidth = 4;
  ctx.strokeRect(288, 108, 64, 260);

  Overworld.grassZones.forEach(z => {
    ctx.fillStyle = '#2b9348';
    ctx.fillRect(z.x, z.y, z.w, z.h);
    ctx.strokeStyle = '#007200';
    ctx.lineWidth = 4;
    ctx.strokeRect(z.x, z.y, z.w, z.h);

    for (let gy = z.y + 8; gy < z.y + z.h - 8; gy += 16) {
      for (let gx = z.x + 8; gx < z.x + z.w - 8; gx += 16) {
        ctx.fillStyle = '#55a630';
        ctx.fillRect(gx, gy + 4, 4, 8);
        ctx.fillRect(gx + 6, gy + 2, 4, 10);
        ctx.fillStyle = '#80ed99';
        ctx.fillRect(gx, gy + 2, 4, 3);
        ctx.fillRect(gx + 6, gy, 4, 3);
      }
    }
  });

  const pc = Overworld.pokeCenter;
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(pc.x + 6, pc.y + 8, pc.w, pc.h);
  ctx.fillStyle = '#f8f4e6';
  ctx.fillRect(pc.x, pc.y + 28, pc.w, pc.h - 28);
  ctx.strokeStyle = '#1a1c2c';
  ctx.lineWidth = 4;
  ctx.strokeRect(pc.x, pc.y + 28, pc.w, pc.h - 28);
  ctx.fillStyle = '#e63946';
  ctx.fillRect(pc.x - 4, pc.y, pc.w + 8, 32);
  ctx.strokeRect(pc.x - 4, pc.y, pc.w + 8, 32);
  ctx.fillStyle = '#0077b6';
  ctx.fillRect(pc.x + pc.w / 2 - 14, pc.y + pc.h - 28, 28, 28);
  ctx.strokeRect(pc.x + pc.w / 2 - 14, pc.y + pc.h - 28, 28, 28);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px "Chakra Petch", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('POKÉMON CENTER (แตะเพื่อฮีล)', pc.x + pc.w / 2, pc.y + 20);

  const gym = Overworld.gymLeader;
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(gym.x - 12, gym.y + 12, 24, 6);
  const gymSprite = getTrainerCanvasSprite(2);
  ctx.drawImage(gymSprite, gym.x - 16, gym.y - 14);
  ctx.fillStyle = '#181a28';
  ctx.fillRect(gym.x - 62, gym.y - 32, 124, 16);
  ctx.fillStyle = '#ffd166';
  ctx.font = 'bold 11px "Chakra Petch", sans-serif';
  ctx.fillText('⚔️ ยิมลีดเดอร์ (แตะท้าดวล)', gym.x, gym.y - 20);

  // Wandering Wild Pixel Pokemon (with Rarity Aura!)
  Overworld.wildEntities.forEach(w => {
    const hop = Math.floor(Math.sin(ts * 0.008 + w.phase) * 2) * 2;
    const rInfo = RARITY_TIERS[w.template.rarity] || RARITY_TIERS.common;

    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(w.x - 14, w.y + 14, 28, 6);

    // Aura box for Rare / Epic / Legendary / Mythic / Shiny
    if (w.isShiny || w.template.rarity !== 'common') {
      ctx.strokeStyle = w.isShiny ? '#ffea00' : rInfo.border;
      ctx.lineWidth = 2;
      ctx.strokeRect(w.x - 19, w.y - 19 + hop, 38, 38);
    }

    const pCanvas = getPokemonCanvasSprite(w.template.code, w.isShiny, 2);
    ctx.drawImage(pCanvas, w.x - 16, w.y - 18 + hop);

    ctx.fillStyle = 'rgba(20,24,36,0.9)';
    ctx.fillRect(w.x - 24, w.y - 30 + hop, 48, 12);
    ctx.fillStyle = rInfo.border;
    ctx.font = 'bold 9px monospace';
    ctx.fillText(`${rInfo.stars}Lv${w.level}`, w.x, w.y - 21 + hop);
  });

  const p = Overworld.player;
  const bob = (Math.floor(p.step) % 2) * 2;
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(p.x - 12, p.y + 12, 24, 6);
  const tCanvas = getTrainerCanvasSprite(2);
  ctx.drawImage(tCanvas, p.x - 16, p.y - 14 - bob);

  for (let i = Overworld.grassParticles.length - 1; i >= 0; i--) {
    const gp = Overworld.grassParticles[i];
    ctx.fillStyle = '#b7efc5';
    ctx.fillRect(gp.x, gp.y - (15 - gp.life), 4, 4);
    gp.life--;
    if (gp.life <= 0) Overworld.grassParticles.splice(i, 1);
  }
}

// ============================================================================
// TURN-BASED BATTLE & CATCHING SYSTEM
// ============================================================================
function getFirstHealthyPartyIndex() {
  return Game.party.findIndex(p => p.hp > 0);
}

function startWildBattle(template, level = 5, isShiny = false) {
  const healthyIdx = getFirstHealthyPartyIndex();
  if (healthyIdx === -1) {
    healPartyAtCenter();
  }

  SFX.battleStart();
  SFX.startBGM('wild');
  const enemy = createPokemonInstance(template, level, isShiny);
  const rInfo = RARITY_TIERS[enemy.rarity] || RARITY_TIERS.common;

  setTimeout(() => {
    SFX.playPokemonCry(enemy.id);
    if (enemy.isShiny) SFX.shinySparkle();
    else SFX.playRarityAlert(enemy.rarity);
  }, 340);

  Game.battle = {
    active: true,
    isTrainer: false,
    trainerName: '',
    trainerQueue: [],
    enemy,
    playerIdx: Math.max(0, getFirstHealthyPartyIndex()),
    turnBusy: false,
    menuMode: 'fight'
  };

  switchScreen('battle');
  setupBattleSpritesAndHUD();
  setBattleDialog(
    `[${rInfo.name}] ${enemy.isShiny ? '✨ SHINY ' : ''}${enemy.name} (ร่าง ${enemy.stage}/${enemy.maxStage} • Lv.${enemy.level}) ปรากฏตัว!`
  );
  renderBattleCommandSubMenu();
}

function startGymBattle() {
  const healthyIdx = getFirstHealthyPartyIndex();
  if (healthyIdx === -1) {
    healPartyAtCenter();
  }

  SFX.battleStart();
  SFX.startBGM('gym');
  const baseLv = Math.max(8, (Game.party[0]?.level || 6) + 1);
  // Gym Leader uses high-tier evolutions: Charizard (#4), Mega Gengar (#21), Bahamut Dragonite (#26)
  const t1 = createPokemonInstance(POKEMON_DB.find(p => p.id === 4), baseLv, false);
  const t2 = createPokemonInstance(POKEMON_DB.find(p => p.id === 21), baseLv + 1, false);
  const t3 = createPokemonInstance(POKEMON_DB.find(p => p.id === 26), baseLv + 2, true);

  setTimeout(() => SFX.playPokemonCry(t1.id), 350);

  Game.battle = {
    active: true,
    isTrainer: true,
    trainerName: 'แชมเปี้ยน เรด (CHAMPION RED)',
    trainerQueue: [t2, t3],
    enemy: t1,
    playerIdx: Math.max(0, getFirstHealthyPartyIndex()),
    turnBusy: false,
    menuMode: 'fight'
  };

  switchScreen('battle');
  setupBattleSpritesAndHUD();
  setBattleDialog(`⚔️ ${Game.battle.trainerName} ขอท้าประลอง! ส่ง ${t1.name} ออกมาสู้!`);
  renderBattleCommandSubMenu();
}

function setupBattleSpritesAndHUD() {
  const b = Game.battle;
  const playerPoke = Game.party[b.playerIdx];
  const enemyPoke = b.enemy;
  if (!playerPoke || !enemyPoke) return;

  const enemyBox = document.getElementById('enemySpriteBox');
  enemyBox.className = 'battle-sprite-box';
  enemyBox.innerHTML = getPokemonPixelImgHTML(enemyPoke.code, enemyPoke.isShiny, 6, '', false);

  const playerBox = document.getElementById('playerSpriteBox');
  playerBox.className = 'battle-sprite-box';
  playerBox.innerHTML = getPokemonPixelImgHTML(playerPoke.code, playerPoke.isShiny, 6, '', true);

  const ballHolder = document.getElementById('battlePokeballHolder');
  ballHolder.className = 'battle-pokeball-holder';

  updateBattleHUDs();
}

function updateBattleHUDs() {
  const b = Game.battle;
  const p = Game.party[b.playerIdx];
  const e = b.enemy;
  if (!p || !e) return;

  const erInfo = RARITY_TIERS[e.rarity] || RARITY_TIERS.common;
  document.getElementById('enemyNameTxt').innerHTML = `
    ${e.name.split(' ')[0]} ${e.isShiny ? '✨' : ''}
    <span style="background:${erInfo.color};color:#fff;font-size:0.65rem;padding:1px 4px;">${erInfo.stars}</span>
  `;
  document.getElementById('enemyLvTxt').textContent = `Lv${e.level}`;
  const ePct = Math.max(0, Math.round((e.hp / e.maxHp) * 100));
  const eBar = document.getElementById('enemyHpFill');
  eBar.style.width = `${ePct}%`;
  eBar.style.backgroundColor = ePct > 50 ? '#38b000' : ePct > 20 ? '#f5b000' : '#e63946';

  const eStatusEl = document.getElementById('enemyStatusBadge');
  if (e.status === 'sleep') {
    eStatusEl.innerHTML = `<span class="status-ailment status-sleep">SLP หลับ</span>`;
  } else if (e.status === 'paralyze') {
    eStatusEl.innerHTML = `<span class="status-ailment status-paralyze">PAR ชา</span>`;
  } else {
    eStatusEl.innerHTML = '';
  }

  const catchHintEl = document.getElementById('enemyCatchHint');
  if (b.isTrainer) {
    catchHintEl.textContent = `⚔️ เทรนเนอร์ (เหลือ ${b.trainerQueue.length + 1} ตัว)`;
  } else {
    const estChance = Math.min(98, Math.round(calcWildCatchProbability('pokeball') * 100));
    catchHintEl.textContent = `${erInfo.short} • ร่าง ${e.stage}/${e.maxStage} • โอกาสจับ ~${estChance}%`;
  }

  document.getElementById('playerNameTxt').innerHTML = `${p.name.split(' ')[0]} <span style="font-size:0.68rem;color:#c0392b;">(ร่าง ${p.stage}/${p.maxStage})</span>`;
  document.getElementById('playerLvTxt').textContent = `Lv${p.level}`;
  const pPct = Math.max(0, Math.round((p.hp / p.maxHp) * 100));
  const pBar = document.getElementById('playerHpFill');
  pBar.style.width = `${pPct}%`;
  pBar.style.backgroundColor = pPct > 50 ? '#38b000' : pPct > 20 ? '#f5b000' : '#e63946';
  document.getElementById('playerHpNums').textContent = `${p.hp}/${p.maxHp}`;

  const expPct = Math.min(100, Math.round((p.exp / p.nextExp) * 100));
  document.getElementById('playerExpFill').style.width = `${expPct}%`;

  renderAllUI();
}

function calcWildCatchProbability(ballKey) {
  const e = Game.battle.enemy;
  if (!e) return 0;
  const template = POKEMON_DB.find(t => t.id === e.id) || POKEMON_DB[0];
  const ballBonus = Game.bag[ballKey]?.rate || 1.0;
  const hpFactor = 1 + (1 - e.hp / e.maxHp) * 1.55;
  const statusBonus = e.status === 'sleep' ? 1.75 : e.status === 'paralyze' ? 1.4 : 1.0;

  return Math.min(0.98, template.catchRate * ballBonus * hpFactor * statusBonus);
}

function setCommandMenuMode(mode) {
  if (Game.battle.turnBusy) return;
  SFX.uiClick();
  Game.battle.menuMode = mode;

  document.getElementById('cmdFightBtn').classList.toggle('active-cmd', mode === 'fight');
  document.getElementById('cmdBagBtn').classList.toggle('active-cmd', mode === 'bag');
  document.getElementById('cmdPokeBtn').classList.toggle('active-cmd', mode === 'pokemon');

  renderBattleCommandSubMenu();
}

function renderBattleCommandSubMenu() {
  const subBox = document.getElementById('battleSubMenu');
  const b = Game.battle;
  const p = Game.party[b.playerIdx];
  if (!subBox || !p) return;

  if (b.menuMode === 'main') {
    subBox.innerHTML = `<div style="color:#ffd166;font-size:0.88rem;">เลือกคำสั่งสำหรับ <b>${p.name.split(' ')[0]}</b> ได้เลย!</div>`;
    return;
  }

  if (b.menuMode === 'fight') {
    subBox.innerHTML = `
      <div class="sub-menu-grid">
        ${p.moves.map(mKey => {
          const m = MOVES_DB[mKey] || MOVES_DB.tackle;
          const tInfo = TYPE_INFO[m.type];
          return `
            <button class="move-btn" onclick="executePlayerMove('${mKey}')">
              <span>⚔️ ${m.name}</span>
              <span style="background:${tInfo.color};padding:2px 6px;font-size:0.72rem;white-space:nowrap;">${m.power > 0 ? m.power : 'สถานะ'}</span>
            </button>
          `;
        }).join('')}
      </div>
    `;
    return;
  }

  if (b.menuMode === 'bag') {
    const items = Object.entries(Game.bag);
    subBox.innerHTML = `
      <div class="sub-menu-grid">
        ${items.map(([k, item]) => `
          <button class="move-btn" onclick="useBagItemInBattle('${k}')">
            <span>${item.kind === 'ball' ? '🔴' : '🧪'} ${item.name.split(' ')[0]}</span>
            <span style="color:#ffd166;">x${item.count}</span>
          </button>
        `).join('')}
      </div>
    `;
    return;
  }

  if (b.menuMode === 'pokemon') {
    subBox.innerHTML = `
      <div class="sub-menu-grid">
        ${Game.party.map((member, idx) => `
          <button class="move-btn" ${member.hp <= 0 || idx === b.playerIdx ? 'disabled style="opacity:0.5"' : ''} onclick="switchActivePokemon(${idx})">
            <span>🐾 ${member.name.split(' ')[0]} (ร่าง ${member.stage}/${member.maxStage})</span>
            <span style="color:#80ed99;">${member.hp}/${member.maxHp}</span>
          </button>
        `).join('')}
      </div>
    `;
  }
}

function executePlayerMove(moveKey) {
  const b = Game.battle;
  if (b.turnBusy || !b.active) return;
  const attacker = Game.party[b.playerIdx];
  const defender = b.enemy;
  const move = MOVES_DB[moveKey] || MOVES_DB.tackle;

  b.turnBusy = true;
  renderBattleCommandSubMenu();

  performAttackStep(attacker, defender, move, true, () => {
    saveGameData();
    if (defender.hp <= 0) {
      handleEnemyFainted();
    } else {
      setTimeout(() => executeEnemyTurn(), 750);
    }
  });
}

function performAttackStep(attacker, defender, move, isPlayerAttacking, onComplete) {
  if (attacker.status === 'sleep') {
    if (Math.random() < 0.45) {
      attacker.status = null;
      SFX.uiClick();
      setBattleDialog(`⏰ ${attacker.name.split(' ')[0]} ตื่นจากการหลับใหลแล้ว!`);
    } else {
      SFX.playMoveSFX('powder');
      setBattleDialog(`💤 ${attacker.name.split(' ')[0]} กำลังหลับปุ๋ย ขยับตัวไม่ได้!`);
      updateBattleHUDs();
      setTimeout(onComplete, 950);
      return;
    }
  }
  if (attacker.status === 'paralyze' && Math.random() < 0.25) {
    SFX.playMoveSFX('electric');
    setBattleDialog(`⚡ ${attacker.name.split(' ')[0]} ติดสถานะชา ขยับตัวไม่ได้!`);
    setTimeout(onComplete, 950);
    return;
  }

  setBattleDialog(`${attacker.name.split(' ')[0]} ใช้ท่า 「${move.name}」!`);

  const atkBox = document.getElementById(isPlayerAttacking ? 'playerSpriteBox' : 'enemySpriteBox');
  const defBox = document.getElementById(isPlayerAttacking ? 'enemySpriteBox' : 'playerSpriteBox');
  atkBox.classList.add(isPlayerAttacking ? 'attack-lunge-right' : 'attack-lunge-left');

  SFX.playMoveSFX(move.vfx);
  spawnBattleVFX(move.vfx, isPlayerAttacking);

  setTimeout(() => {
    atkBox.classList.remove('attack-lunge-right', 'attack-lunge-left');

    if (move.power > 0) {
      const mult = (TYPE_CHART[move.type] && TYPE_CHART[move.type][defender.type]) || 1.0;
      const rawDmg = ((attacker.level * 0.4 + 2) * move.power * (attacker.atk / defender.def)) / 14 + 2;
      const finalDmg = Math.max(2, Math.floor(rawDmg * mult * (0.9 + Math.random() * 0.2)));

      defender.hp = Math.max(0, defender.hp - finalDmg);
      SFX.hit(mult);
      defBox.classList.add('hurt-blink');
      setTimeout(() => defBox.classList.remove('hurt-blink'), 450);

      let effMsg = '';
      if (mult > 1) effMsg = ' (ชนะทางธาตุ รุนแรงมาก!! 🔥)';
      else if (mult < 1) effMsg = ' (ไม่ค่อยได้ผล...)';

      if (move.status && !defender.status && Math.random() < (move.chance || 0.25)) {
        defender.status = move.status;
        effMsg += move.status === 'sleep' ? ' และทำให้หลับ!' : ' และทำให้ติดชา!';
      }

      setBattleDialog(`ทำดาเมจ ${finalDmg} หน่วย!${effMsg}`);
    } else if (move.status) {
      if (Math.random() * 100 <= move.acc) {
        defender.status = move.status;
        SFX.hit(1.5);
        setBattleDialog(`🎵 ${defender.name.split(' ')[0]} ติดสถานะ ${move.status === 'sleep' ? 'หลับปุ๋ย (SLP) จับง่ายขึ้นมาก!' : 'อัมพาต (PAR)'}!`);
      } else {
        setBattleDialog(`แต่การโจมตีพลาดเป้า!`);
      }
    }

    updateBattleHUDs();
    setTimeout(onComplete, 950);
  }, 380);
}

function executeEnemyTurn() {
  const b = Game.battle;
  if (!b.active || !b.enemy || b.enemy.hp <= 0) return;

  const enemy = b.enemy;
  const playerPoke = Game.party[b.playerIdx];
  const randMoveKey = enemy.moves[Math.floor(Math.random() * enemy.moves.length)];
  const move = MOVES_DB[randMoveKey] || MOVES_DB.tackle;

  performAttackStep(enemy, playerPoke, move, false, () => {
    saveGameData();
    if (playerPoke.hp <= 0) {
      handlePlayerPokemonFainted();
    } else {
      b.turnBusy = false;
      renderBattleCommandSubMenu();
    }
  });
}

function useBagItemInBattle(itemKey) {
  const b = Game.battle;
  if (b.turnBusy || !b.active) return;
  const item = Game.bag[itemKey];
  if (!item || item.count <= 0) {
    SFX.hit(0.5);
    setBattleDialog(`⚠️ ${item ? item.name : 'ไอเทม'} หมดกระเป๋าแล้ว!`);
    return;
  }

  if (item.kind === 'heal') {
    const p = Game.party[b.playerIdx];
    if (p.hp >= p.maxHp) {
      SFX.uiClick();
      setBattleDialog(`${p.name.split(' ')[0]} มี HP เต็มอยู่แล้ว!`);
      return;
    }
    item.count--;
    b.turnBusy = true;
    p.hp = Math.min(p.maxHp, p.hp + item.heal);
    SFX.levelUp();
    saveGameData();
    updateBattleHUDs();
    setBattleDialog(`🧪 ใช้ ${item.name} ฟื้นฟู HP ของ ${p.name.split(' ')[0]}!`);

    setTimeout(() => executeEnemyTurn(), 900);
    return;
  }

  if (item.kind === 'ball') {
    if (b.isTrainer) {
      SFX.hit(0.5);
      setBattleDialog(`🚫 โปเกมอนของเทรนเนอร์คนอื่น จับไม่ได้นะ!`);
      return;
    }

    item.count--;
    b.turnBusy = true;
    saveGameData();
    updateBattleHUDs();

    SFX.throwBall();
    setBattleDialog(`🔴 ปา ${item.name} ออกไปแล้ว!`);

    const ballHolder = document.getElementById('battlePokeballHolder');
    ballHolder.innerHTML = getPokeballPixelImgHTML(itemKey, 4);
    ballHolder.className = 'battle-pokeball-holder throwing';

    const enemyBox = document.getElementById('enemySpriteBox');
    setTimeout(() => {
      SFX.ballSuckIn();
      enemyBox.classList.add('suck-in');
    }, 420);

    const prob = calcWildCatchProbability(itemKey);
    const caught = Math.random() < prob;
    const shakes = caught ? 3 : Math.floor(1 + Math.random() * 2);

    for (let s = 1; s <= shakes; s++) {
      setTimeout(() => {
        ballHolder.className = 'battle-pokeball-holder';
        void ballHolder.offsetWidth;
        ballHolder.className = 'battle-pokeball-holder shaking';
        SFX.ballShake();
        setBattleDialog(`ดุ๊กดิ๊ก... จังหวะที่ ${s}/3!`);
      }, 900 + (s - 1) * 780);
    }

    setTimeout(() => {
      if (caught) {
        SFX.catchFanfare();
        SFX.startBGM('overworld');
        const caughtPoke = b.enemy;
        caughtPoke.hp = caughtPoke.maxHp;
        caughtPoke.status = null;
        registerPokemonOwned(caughtPoke, false);

        const rarityBonus = caughtPoke.rarity === 'mythic' ? 200 : caughtPoke.rarity === 'legendary' ? 120 : 55;
        const expGain = caughtPoke.level * 24;
        const coinGain = rarityBonus + (caughtPoke.isShiny ? 120 : 0);
        Game.coins += coinGain;
        const leveledUp = grantExpToActive(expGain);
        saveGameData();

        setBattleDialog(`🎉 ติ๊ง!! จับ ${caughtPoke.name} สำเร็จแล้ว! (+${coinGain}🪙)`);
        const activePoke = Game.party[b.playerIdx];
        if (leveledUp && canPokemonEvolveNow(activePoke)) {
          b.active = false;
          b.turnBusy = false;
          requestEvolvePartyMember(b.playerIdx);
        } else {
          showModalResult(
            `🎉 จับโปเกมอนสำเร็จ!`,
            caughtPoke,
            `ระดับ ${RARITY_TIERS[caughtPoke.rarity].name} (ร่าง ${caughtPoke.stage}/${caughtPoke.maxStage}) • รางวัล +${coinGain}🪙`
          );
          b.active = false;
          b.turnBusy = false;
        }
      } else {
        SFX.ballBreakOut();
        ballHolder.className = 'battle-pokeball-holder';
        enemyBox.classList.remove('suck-in');
        setBattleDialog(`💨 อ๊ะ! ${b.enemy.name.split(' ')[0]} ดิ้นหลุดออกมาได้! ลองตอดเลือดหรือใช้บอลระดับสูงขึ้น!`);
        setTimeout(() => executeEnemyTurn(), 950);
      }
      renderAllUI();
    }, 950 + shakes * 780);
  }
}

function switchActivePokemon(newIdx) {
  const b = Game.battle;
  if (b.turnBusy || newIdx === b.playerIdx || Game.party[newIdx].hp <= 0) return;

  b.turnBusy = true;
  b.playerIdx = newIdx;
  b.menuMode = 'fight';
  SFX.playPokemonCry(Game.party[newIdx].id);
  setupBattleSpritesAndHUD();
  renderBattleCommandSubMenu();
  setBattleDialog(`🐾 ไปเลย! ${Game.party[newIdx].name.split(' ')[0]}!`);

  setTimeout(() => executeEnemyTurn(), 900);
}

function handleEnemyFainted() {
  const b = Game.battle;
  const enemy = b.enemy;
  const enemyBox = document.getElementById('enemySpriteBox');
  enemyBox.classList.add('faint-drop');
  SFX.faint();

  const expGain = enemy.level * 30 + (b.isTrainer ? 50 : 0);
  const coinGain = b.isTrainer ? 110 : 45;
  Game.coins += coinGain;
  const leveledUp = grantExpToActive(expGain);
  saveGameData();

  setBattleDialog(
    `🏆 ${enemy.name.split(' ')[0]} หมดสภาพต่อสู้! ได้รับ +${expGain} EXP และ +${coinGain}🪙${leveledUp ? ' (🎉 LEVEL UP!!)' : ''}`
  );
  updateBattleHUDs();

  setTimeout(() => {
    if (b.isTrainer && b.trainerQueue.length > 0) {
      b.enemy = b.trainerQueue.shift();
      b.turnBusy = false;
      SFX.playPokemonCry(b.enemy.id);
      if (b.enemy.isShiny) SFX.shinySparkle();
      setupBattleSpritesAndHUD();
      setBattleDialog(`⚔️ ${b.trainerName} ส่ง ${b.enemy.name} (Lv.${b.enemy.level}) ออกมาสู้ต่อ!`);
    } else if (b.isTrainer) {
      Game.badges++;
      Game.coins += 200;
      saveGameData();
      SFX.catchFanfare();
      SFX.startBGM('overworld');
      const activePoke = Game.party[b.playerIdx];
      b.active = false;
      b.turnBusy = false;
      if (leveledUp && canPokemonEvolveNow(activePoke)) {
        requestEvolvePartyMember(b.playerIdx);
      } else {
        showModalResult(
          `🏅 ชนะแชมเปี้ยน ${b.trainerName}!`,
          activePoke,
          `คว้าเข็มกลัดยิม (รวม ${Game.badges} เหรียญตรา) และโบนัส +200 เหรียญ!`
        );
      }
    } else {
      const activePoke = Game.party[b.playerIdx];
      b.active = false;
      b.turnBusy = false;
      SFX.startBGM('overworld');
      if (leveledUp && canPokemonEvolveNow(activePoke)) {
        requestEvolvePartyMember(b.playerIdx);
      } else {
        setTimeout(() => switchScreen('world'), 1000);
      }
    }
  }, 1350);
}

function handlePlayerPokemonFainted() {
  const b = Game.battle;
  const p = Game.party[b.playerIdx];
  const playerBox = document.getElementById('playerSpriteBox');
  playerBox.classList.add('faint-drop');
  SFX.faint();
  setBattleDialog(`😵 ${p.name.split(' ')[0]} หมดสติไปแล้ว!`);

  setTimeout(() => {
    const nextIdx = getFirstHealthyPartyIndex();
    if (nextIdx !== -1) {
      b.playerIdx = nextIdx;
      b.turnBusy = false;
      SFX.playPokemonCry(Game.party[nextIdx].id);
      setupBattleSpritesAndHUD();
      setBattleDialog(`ไปเลย ${Game.party[nextIdx].name.split(' ')[0]}! สู้แทนเพื่อนที!`);
      renderBattleCommandSubMenu();
    } else {
      setBattleDialog(`🏥 โปเกมอนในทีมหมดสติทั้งหมด... ส่งตัวกลับไปรักษาที่ Pokémon Center!`);
      SFX.startBGM('overworld');
      setTimeout(() => {
        healPartyAtCenter();
        switchScreen('world');
      }, 1400);
    }
  }, 1100);
}

function grantExpToActive(amount) {
  const p = Game.party[Game.battle.playerIdx];
  if (!p) return false;
  p.exp += amount;
  let leveled = false;
  while (p.exp >= p.nextExp) {
    p.exp -= p.nextExp;
    p.level++;
    p.nextExp = p.level * 35;
    const template = POKEMON_DB.find(t => t.id === p.id) || POKEMON_DB[0];
    const mult = 1 + (p.level - 1) * 0.14;
    const oldMax = p.maxHp;
    p.maxHp = Math.floor(template.baseHp * mult);
    p.hp += (p.maxHp - oldMax);
    p.atk = Math.floor(template.baseAtk * mult);
    p.def = Math.floor(template.baseDef * mult);
    p.spd = Math.floor(template.baseSpd * mult);
    leveled = true;
  }
  if (leveled) SFX.levelUp();
  return leveled;
}

function spawnBattleVFX(vfxType, onEnemy) {
  const layer = document.getElementById('battleVfxLayer');
  if (!layer) return;
  const icons = {
    electric: ['⚡', '✨', '⚡'],
    fire:     ['🔥', '💥', '🔥'],
    water:    ['💧', '🫧', '🌊'],
    leaf:     ['🍃', '🌿', '🍃'],
    powder:   ['💤', '✨', '💤'],
    music:    ['🎵', '🎶', '💤'],
    psychic:  ['🔮', '✨', '🌀'],
    shadow:   ['👻', '🟣', '💥'],
    dragon:   ['🐉', '🔥', '⚡'],
    sparkle:  ['✨', '💖', '⭐'],
    slash:    ['💢', '💨', '💥'],
    impact:   ['💥', '💢', '💥']
  };
  const list = icons[vfxType] || icons.impact;
  list.forEach((emo, i) => {
    const el = document.createElement('div');
    el.className = 'vfx-particle';
    el.textContent = emo;
    el.style.left = onEnemy ? `${64 + i * 6}%` : `${18 + i * 6}%`;
    el.style.top = onEnemy ? `${18 + (i % 2) * 10}%` : `${55 + (i % 2) * 10}%`;
    layer.appendChild(el);
    setTimeout(() => el.remove(), 600);
  });
}

function healPartyAtCenter() {
  SFX.healCenter();
  Game.party.forEach(p => {
    p.hp = p.maxHp;
    p.status = null;
  });
  Game.bag.pokeball.count = Math.max(Game.bag.pokeball.count, 8);
  saveGameData();
  renderAllUI();
}

function setBattleDialog(txt) {
  const el = document.getElementById('battleDialogText');
  if (el) el.textContent = txt;
}

// ============================================================================
// UI CONTROLS, CONTINUOUS MOBILE D-PAD, RARITY FILTER & MODALS
// ============================================================================
function setDexRarityFilter(rarityKey) {
  SFX.uiClick();
  Game.dexRarityFilter = rarityKey;
  renderAllUI();
}

function bindUIControls() {
  document.querySelectorAll('.pixel-tab[data-view]').forEach(btn => {
    btn.addEventListener('click', () => {
      SFX.uiClick();
      const target = btn.dataset.view;
      if (!target) return;
      if (target === 'battle' && !Game.battle.active) {
        const t = pickWildPokemonByRarity();
        const lv = Math.max(3, (Game.party[0]?.level || 5));
        startWildBattle(t, lv, Math.random() < 0.14);
      } else {
        if (target === 'world') SFX.startBGM('overworld');
        switchScreen(target);
      }
    });
  });

  const bgmBtn = document.getElementById('btnToggleBgm');
  if (bgmBtn) {
    bgmBtn.addEventListener('click', () => {
      const on = SFX.toggleBGM();
      bgmBtn.textContent = on ? '🎵 เพลง: เปิด' : '🔇 เพลง: ปิด';
      bgmBtn.style.opacity = on ? '1' : '0.65';
    });
  }

  const sfxBtn = document.getElementById('btnToggleSfx');
  if (sfxBtn) {
    sfxBtn.addEventListener('click', () => {
      const on = SFX.toggleSFX();
      sfxBtn.textContent = on ? '🔊 เอฟเฟกต์: เปิด' : '🔈 เอฟเฟกต์: ปิด';
      sfxBtn.style.opacity = on ? '1' : '0.65';
    });
  }

  document.querySelectorAll('[data-dir]').forEach(btn => {
    const dir = btn.dataset.dir;
    const startHold = e => {
      e.preventDefault();
      SFX.uiClick();
      Overworld.holdDir = dir;
      Overworld.player.tx = null;
      Overworld.player.ty = null;
      btn.classList.add('pressed');
    };
    const endHold = () => {
      if (Overworld.holdDir === dir) Overworld.holdDir = null;
      btn.classList.remove('pressed');
      saveGameData();
    };
    btn.addEventListener('pointerdown', startHold);
    btn.addEventListener('pointerup', endHold);
    btn.addEventListener('pointerleave', endHold);
    btn.addEventListener('pointercancel', endHold);
  });

  document.getElementById('btnWildEncounter').addEventListener('click', () => {
    const t = pickWildPokemonByRarity();
    const lv = Math.max(3, (Game.party[0]?.level || 5) + Math.floor(Math.random() * 3) - 1);
    startWildBattle(t, lv, Math.random() < 0.15);
  });

  document.getElementById('btnGymChallenge').addEventListener('click', startGymBattle);
  document.getElementById('btnHealCenter').addEventListener('click', healPartyAtCenter);

  const resetBtn = document.getElementById('btnResetSave');
  if (resetBtn) resetBtn.addEventListener('click', resetGameSave);

  document.getElementById('cmdFightBtn').addEventListener('click', () => setCommandMenuMode('fight'));
  document.getElementById('cmdBagBtn').addEventListener('click', () => setCommandMenuMode('bag'));
  document.getElementById('cmdPokeBtn').addEventListener('click', () => setCommandMenuMode('pokemon'));
  document.getElementById('cmdRunBtn').addEventListener('click', () => {
    if (Game.battle.turnBusy) return;
    if (Game.battle.isTrainer) {
      SFX.hit(0.5);
      setBattleDialog(`🚫 ยอมแพ้จากการท้าดวลยิมไม่ได้นะ!`);
      return;
    }
    SFX.runAway();
    SFX.startBGM('overworld');
    Game.battle.active = false;
    switchScreen('world');
  });

  document.getElementById('btnToggleDexShiny').addEventListener('click', () => {
    SFX.shinySparkle();
    Game.dexShinyPreview = !Game.dexShinyPreview;
    renderAllUI();
  });
}

function switchScreen(viewName) {
  document.querySelectorAll('.pixel-tab[data-view]').forEach(b => {
    b.classList.toggle('active', b.dataset.view === viewName);
  });
  document.querySelectorAll('.screen-view').forEach(v => {
    v.classList.toggle('active', v.id === `view-${viewName}`);
  });
}

function buyShopItem(key, qty = 1) {
  const item = Game.bag[key];
  if (!item) return;
  const totalCost = item.price * qty;
  if (Game.coins < totalCost) {
    SFX.hit(0.5);
    alert(`🪙 เหรียญไม่พอ! (ต้องการ ${totalCost} เหรียญ แต่มี ${Game.coins} เหรียญ)`);
    return;
  }
  Game.coins -= totalCost;
  item.count += qty;
  SFX.coinChime();
  saveGameData();
  renderAllUI();
  if (Game.battle.active && Game.battle.menuMode === 'bag') {
    renderBattleCommandSubMenu();
  }
}

function makeLeadPokemon(idx) {
  if (idx <= 0 || idx >= Game.party.length) {
    if (Game.party[idx]) SFX.playPokemonCry(Game.party[idx].id);
    return;
  }
  const chosen = Game.party.splice(idx, 1)[0];
  Game.party.unshift(chosen);
  SFX.playPokemonCry(chosen.id);
  saveGameData();
  renderAllUI();
}

function feedCandyToPartyIdx(idx) {
  const p = Game.party[idx];
  if (!p) return;
  if (Game.coins < 40) {
    SFX.hit(0.5);
    alert('🪙 เหรียญไม่พอ! (ต้องการ 40 เหรียญสำหรับแคนดี้ +1 เลเวล)');
    return;
  }
  Game.coins -= 40;
  p.level++;
  p.nextExp = p.level * 35;
  const tmpl = POKEMON_DB.find(t => t.id === p.id) || POKEMON_DB[0];
  const mult = 1 + (p.level - 1) * 0.14;
  p.maxHp = Math.floor(tmpl.baseHp * mult);
  p.hp = p.maxHp;
  p.atk = Math.floor(tmpl.baseAtk * mult);
  p.def = Math.floor(tmpl.baseDef * mult);
  p.spd = Math.floor(tmpl.baseSpd * mult);

  SFX.levelUp();
  saveGameData();
  renderAllUI();
  if (Game.battle.active) updateBattleHUDs();

  if (canPokemonEvolveNow(p)) {
    setTimeout(() => requestEvolvePartyMember(idx), 400);
  }
}

function movePartyToBox(partyIdx) {
  if (Game.party.length <= 1) {
    SFX.hit(0.5);
    alert('⚠️ ต้องมีโปเกมอนในทีมหลักอย่างน้อย 1 ตัวเสมอ!');
    return;
  }
  SFX.uiClick();
  const removed = Game.party.splice(partyIdx, 1)[0];
  Game.pcBox.push(removed);
  saveGameData();
  renderAllUI();
}

function moveBoxToParty(boxIdx) {
  const boxPoke = Game.pcBox[boxIdx];
  if (!boxPoke) return;
  SFX.playPokemonCry(boxPoke.id);

  if (Game.party.length < 6) {
    Game.pcBox.splice(boxIdx, 1);
    Game.party.push(boxPoke);
  } else {
    // Swap with the last party slot (slot #6)
    const lastParty = Game.party.pop();
    Game.pcBox.splice(boxIdx, 1, lastParty);
    Game.party.push(boxPoke);
  }
  saveGameData();
  renderAllUI();
}

function releaseBoxPokemon(boxIdx) {
  const boxPoke = Game.pcBox[boxIdx];
  if (!boxPoke) return;
  if (!confirm(`ต้องการปล่อย ${boxPoke.name} คืนสู่ธรรมชาติและรับทุนวิจัย +30 🪙 หรือไม่?`)) return;
  SFX.coinChime();
  Game.pcBox.splice(boxIdx, 1);
  Game.coins += 30;
  saveGameData();
  renderAllUI();
}

function showModalResult(title, pokeInst, subtitle) {
  const modal = document.getElementById('pixelModal');
  const box = document.getElementById('pixelModalContent');
  const rInfo = RARITY_TIERS[pokeInst.rarity] || RARITY_TIERS.common;
  box.innerHTML = `
    <span style="background:${rInfo.color};border:2px solid ${rInfo.border};padding:2px 8px;font-size:0.78rem;font-weight:700;">
      ${rInfo.name} • ร่างที่ ${pokeInst.stage}/${pokeInst.maxStage}
    </span>
    <div style="display:flex;justify-content:center;margin:10px 0;">
      ${getPokemonPixelImgHTML(pokeInst.code, pokeInst.isShiny, 7)}
    </div>
    <h2 style="color:#ffd166;margin-bottom:6px;">${title}</h2>
    <h3 style="margin-bottom:6px;">${pokeInst.name} (Lv.${pokeInst.level}) ${pokeInst.isShiny ? '✨' : ''}</h3>
    <p style="font-size:0.9rem;color:#c0cbdc;margin-bottom:14px;">${subtitle}</p>
    <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;">
      <button class="px-btn btn-green" onclick="closeModalToWorld()">🗺️ กลับสู่แมพ</button>
      <button class="px-btn btn-gold" onclick="closeModalToNextWild()">⚔️ ลุยหาตัวต่อไป!</button>
    </div>
  `;
  modal.classList.add('open');
}

// --- Pokédex Inspector with Mystery Silhouettes for Locked Pokémon & 3-to-5 Stage Chain! ---
function openDexInspector(pokeId) {
  const t = POKEMON_DB.find(p => p.id === pokeId);
  if (!t) return;
  const isUnlocked = Boolean(Game.pokedex[t.id]);
  if (isUnlocked) {
    SFX.playPokemonCry(t.id);
  } else {
    SFX.uiClick();
  }

  const tInfo = TYPE_INFO[t.type];
  const rInfo = RARITY_TIERS[t.rarity] || RARITY_TIERS.common;
  const modal = document.getElementById('pixelModal');
  const box = document.getElementById('pixelModalContent');

  // Render full visual chain (Stage 1 -> Stage 2 -> Stage 3 -> Stage 4 -> Stage 5)
  // Any stage not yet unlocked in Game.pokedex appears as a dark silhouette!
  const chainList = (t.chainIds || [t.id]).map(cid => POKEMON_DB.find(x => x.id === cid)).filter(Boolean);
  const chainHtml = `
    <div style="background:#141824;border:2px solid #5a6988;padding:8px;margin:8px 0;">
      <div style="font-size:0.76rem;color:#ffd166;margin-bottom:6px;font-weight:700;">
        🧬 สายวิวัฒนาการทั้งหมด (${t.maxStage} ร่าง): ร่างที่ยังไม่ปลดล็อกจะเป็นเงาปริศนา
      </div>
      <div style="display:flex;justify-content:center;align-items:center;gap:6px;flex-wrap:wrap;">
        ${chainList.map((cp, idx) => {
          const cpUnlocked = Boolean(Game.pokedex[cp.id]);
          const silClass = cpUnlocked ? '' : 'silhouette-locked';
          const cpLabel = cpUnlocked ? cp.name.split(' ')[0] : '???';
          return `
            <div onclick="openDexInspector(${cp.id})" style="cursor:pointer;padding:4px 6px;border:2px solid ${cp.id === t.id ? '#ffd166' : '#3a4466'};background:${cp.id === t.id ? '#262b44' : '#181a28'};text-align:center;">
              <div style="display:flex;justify-content:center;">${getPokemonPixelImgHTML(cp.code, cpUnlocked && Game.dexShinyPreview, 3, silClass)}</div>
              <div style="font-size:0.65rem;font-weight:700;margin-top:2px;">ร่าง ${cp.stage}</div>
              <div style="font-size:0.68rem;color:${cpUnlocked ? '#80ed99' : '#8b9bb4'};">${cpLabel}</div>
            </div>
            ${idx < chainList.length - 1 ? `<span style="color:#ffd166;font-weight:700;font-size:0.8rem;">➔</span>` : ''}
          `;
        }).join('')}
      </div>
    </div>
  `;

  if (!isUnlocked) {
    box.innerHTML = `
      <div style="margin-bottom:6px;">
        <span style="background:${rInfo.color};border:2px solid ${rInfo.border};padding:2px 8px;font-size:0.76rem;font-weight:700;">
          ${rInfo.name} • ร่างที่ ${t.stage}/${t.maxStage} (🔒 ยังไม่ปลดล็อก)
        </span>
      </div>
      <div style="display:flex;justify-content:center;margin:12px 0;">
        <div>
          ${getPokemonPixelImgHTML(t.code, false, 6, 'silhouette-locked')}
          <div style="font-size:0.75rem;margin-top:4px;color:#8b9bb4;">เงาปริศนา (ยังไม่ได้จับหรือวิวัฒนาการ)</div>
        </div>
      </div>
      <h2 style="color:#adb5bd;font-size:1.15rem;">#${String(t.id).padStart(2, '0')} ??? (โปเกมอนปริศนา)</h2>
      <div style="margin:6px 0;">
        <span style="background:${tInfo.color};padding:2px 8px;font-weight:700;font-size:0.78rem;">ธาตุ: ${tInfo.label}</span>
        <span style="background:#3a4466;padding:2px 8px;font-weight:700;font-size:0.78rem;">ความหายาก: ${rInfo.short}</span>
      </div>
      ${chainHtml}
      <p style="font-size:0.82rem;color:#8b9bb4;margin:6px 0 12px;">
        💡 วิธีปลดล็อก: ออกสำรวจพุ่มไม้เพื่อจับโปเกมอนตัวนี้ หรือฝึกฝนร่างก่อนหน้าให้วิวัฒนาการมาถึงร่างที่ ${t.stage}/${t.maxStage}!
      </p>
      <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;">
        <button class="px-btn btn-gold" onclick="closeModalAndFightId(${t.id})">⚔️ ออกตามล่าเงาปริศนาตัวนี้!</button>
        <button class="px-btn" onclick="document.getElementById('pixelModal').classList.remove('open')">ปิด</button>
      </div>
    `;
  } else {
    box.innerHTML = `
      <div style="margin-bottom:6px;">
        <span style="background:${rInfo.color};border:2px solid ${rInfo.border};padding:2px 8px;font-size:0.76rem;font-weight:700;">
          ${rInfo.name} • ร่างที่ ${t.stage}/${t.maxStage} (✅ ปลดล็อกแล้ว x${Game.pokedex[t.id].count})
        </span>
      </div>
      <div style="display:flex;justify-content:center;gap:24px;margin-bottom:8px;">
        <div>
          ${getPokemonPixelImgHTML(t.code, false, 5)}
          <div style="font-size:0.74rem;margin-top:3px;">Normal</div>
        </div>
        <div>
          ${getPokemonPixelImgHTML(t.code, true, 5)}
          <div style="font-size:0.74rem;margin-top:3px;color:#ffd166;">✨ Shiny</div>
        </div>
      </div>
      <h2 style="color:#ffd166;font-size:1.15rem;">#${String(t.id).padStart(2, '0')} ${t.name}</h2>
      <div style="margin:5px 0;">
        <span style="background:${tInfo.color};padding:2px 8px;font-weight:700;font-size:0.78rem;">ธาตุ: ${tInfo.label}</span>
        <span style="background:#3a4466;padding:2px 8px;font-weight:700;font-size:0.78rem;">HP:${t.baseHp} ATK:${t.baseAtk} SPD:${t.baseSpd}</span>
      </div>
      ${chainHtml}
      <p style="font-size:0.82rem;color:#d8e2dc;margin:6px 0 12px;">${t.desc}</p>
      <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;">
        <button class="px-btn" style="background:#7209b7;border-color:#f72585;" onclick="SFX.playPokemonCry(${t.id})">🔊 เสียงร้อง</button>
        <button class="px-btn btn-gold" onclick="closeModalAndFightId(${t.id})">⚔️ ทดสอบสู้ & จับ!</button>
        <button class="px-btn" onclick="document.getElementById('pixelModal').classList.remove('open')">ปิด</button>
      </div>
    `;
  }
  modal.classList.add('open');
}

window.closeModalToWorld = function () {
  SFX.uiClick();
  document.getElementById('pixelModal').classList.remove('open');
  switchScreen('world');
};

window.closeModalToNextWild = function () {
  SFX.uiClick();
  document.getElementById('pixelModal').classList.remove('open');
  const t = pickWildPokemonByRarity();
  const lv = Math.max(3, (Game.party[0]?.level || 5));
  startWildBattle(t, lv, Math.random() < 0.15);
};

window.closeModalAndFightId = function (id) {
  SFX.uiClick();
  document.getElementById('pixelModal').classList.remove('open');
  const t = POKEMON_DB.find(p => p.id === id);
  if (t) startWildBattle(t, Math.max(4, Game.party[0]?.level || 5), Game.dexShinyPreview);
};

function renderAllUI() {
  document.getElementById('hudDexCount').textContent = `${Object.keys(Game.pokedex).length}/${POKEMON_DB.length}`;
  document.getElementById('hudBadges').textContent = Game.badges;
  document.getElementById('hudCoins').textContent = Game.coins;

  const tabPartyCount = document.getElementById('tabPartyCount');
  if (tabPartyCount) tabPartyCount.textContent = `${Game.party.length}/6`;

  // 1. Mini Party Quick Strip (top of screen)
  const miniStrip = document.getElementById('miniPartyStrip');
  if (miniStrip) {
    miniStrip.innerHTML = `
      <span class="mini-strip-label">🐾 ทีมหลัก:</span>
      ${Game.party.map((p, idx) => {
        const hpPct = Math.max(0, Math.round((p.hp / p.maxHp) * 100));
        const hpColor = hpPct > 50 ? '#38b000' : hpPct > 20 ? '#f5b000' : '#e63946';
        const readyEvo = canPokemonEvolveNow(p);
        return `
          <div class="mini-party-chip ${idx === 0 ? 'lead-chip' : ''}" onclick="makeLeadPokemon(${idx})" title="แตะเพื่อตั้งเป็นตัวนำทีม">
            ${getPokemonPixelImgHTML(p.code, p.isShiny, 2)}
            <div>
              <div style="font-size:0.72rem;font-weight:700;line-height:1.1;">
                ${idx === 0 ? '⭐' : ''}${p.name.split(' ')[0]} <span style="color:#ffd166;">Lv${p.level}</span>
                ${readyEvo ? '<span style="color:#80ed99;">✨</span>' : ''}
              </div>
              <div class="mini-hp-bar"><div class="mini-hp-fill" style="width:${hpPct}%;background:${hpColor};"></div></div>
            </div>
          </div>
        `;
      }).join('')}
      <button class="px-btn" style="padding:3px 8px;font-size:0.72rem;margin-left:auto;" onclick="switchScreen('team')">⚙️ จัดทีม & กล่อง (${Game.pcBox.length})</button>
    `;
  }

  // 2. Dedicated Team Page (#view-team)
  const teamGrid = document.getElementById('teamPagePartyGrid');
  if (teamGrid) {
    teamGrid.innerHTML = Game.party.map((p, idx) => {
      const hpPct = Math.max(0, Math.round((p.hp / p.maxHp) * 100));
      const hpColor = hpPct > 50 ? '#38b000' : hpPct > 20 ? '#f5b000' : '#e63946';
      const expPct = Math.min(100, Math.round((p.exp / p.nextExp) * 100));
      const tmpl = getEvolutionTemplateFor(p);
      const readyEvo = canPokemonEvolveNow(p);
      const rInfo = RARITY_TIERS[p.rarity] || RARITY_TIERS.common;
      const tInfo = TYPE_INFO[p.type];

      let evoBadge = '';
      if (readyEvo) {
        evoBadge = `<button class="evolve-mini-btn" onclick="requestEvolvePartyMember(${idx})">✨ วิวัฒนาการสู่ร่าง ${p.stage + 1}/${p.maxStage}!</button>`;
      } else if (tmpl) {
        evoBadge = `<span style="color:#ffd166;font-size:0.74rem;">ร่าง ${p.stage}/${p.maxStage} (วิวัฒนาการที่ Lv.${tmpl.evolveLevel})</span>`;
      } else {
        evoBadge = `<span style="color:#80ed99;font-size:0.74rem;">👑 ร่างสมบูรณ์สูงสุด (${p.stage}/${p.maxStage})</span>`;
      }

      return `
        <div class="team-full-card ${idx === 0 ? 'lead-card' : ''}">
          <div style="text-align:center;">
            ${getPokemonPixelImgHTML(p.code, p.isShiny, 4)}
            <div style="font-size:0.68rem;color:${rInfo.border};font-weight:700;margin-top:2px;">${rInfo.short}</div>
          </div>
          <div>
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <strong style="font-size:0.92rem;color:#fff;">
                ${idx === 0 ? '⭐ [ตัวนำ] ' : ''}${p.name} ${p.isShiny ? '✨' : ''}
              </strong>
              <span style="color:#ffd166;font-weight:700;">Lv.${p.level}</span>
            </div>
            <div style="margin:3px 0;">
              <span style="background:${tInfo.color};font-size:0.68rem;padding:1px 6px;font-weight:700;">ธาตุ${tInfo.label}</span>
              <span style="font-size:0.72rem;color:#c0cbdc;margin-left:6px;">ATK ${p.atk} • DEF ${p.def} • SPD ${p.spd}</span>
            </div>
            <div class="hp-track" style="margin:4px 0;">
              <div style="width:${hpPct}%;height:100%;background:${hpColor};"></div>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:0.72rem;color:#adb5bd;">
              <span>HP ${p.hp}/${p.maxHp}</span>
              <span>EXP ${expPct}%</span>
            </div>
            <div style="margin-top:4px;">${evoBadge}</div>
            <div class="team-card-actions">
              ${idx !== 0 ? `<button class="px-btn btn-gold" onclick="makeLeadPokemon(${idx})">⭐ ตั้งเป็นตัวนำ</button>` : ''}
              <button class="px-btn" style="background:#7209b7;border-color:#b5179e;" onclick="feedCandyToPartyIdx(${idx})">🍬 +1 Lv (40🪙)</button>
              <button class="px-btn" onclick="openDexInspector(${p.id})">🔍 ดูสายร่าง</button>
              ${Game.party.length > 1 ? `<button class="px-btn" style="background:#3a4466;" onclick="movePartyToBox(${idx})">📦 เก็บเข้ากล่อง</button>` : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  const boxCountTxt = document.getElementById('pcBoxCountTxt');
  if (boxCountTxt) boxCountTxt.textContent = `${Game.pcBox.length} ตัว`;

  const boxGrid = document.getElementById('teamPageBoxGrid');
  if (boxGrid) {
    if (Game.pcBox.length === 0) {
      boxGrid.innerHTML = `<div style="grid-column:1/-1;text-align:center;color:#8b9bb4;padding:18px;">ยังไม่มีโปเกมอนในกล่องสะสม PC (เมื่อจับโปเกมอนเกิน 6 ตัว หรือกดเก็บเข้ากล่อง จะมาอยู่ที่นี่)</div>`;
    } else {
      boxGrid.innerHTML = Game.pcBox.map((p, bIdx) => {
        const rInfo = RARITY_TIERS[p.rarity] || RARITY_TIERS.common;
        return `
          <div class="pc-box-card" style="border-color:${rInfo.border};">
            <div style="font-size:0.65rem;color:${rInfo.border};font-weight:700;">${rInfo.short} • ร่าง ${p.stage}/${p.maxStage}</div>
            <div style="display:flex;justify-content:center;margin:4px 0;">
              ${getPokemonPixelImgHTML(p.code, p.isShiny, 3)}
            </div>
            <div style="font-size:0.78rem;font-weight:700;">${p.name.split(' ')[0]} ${p.isShiny ? '✨' : ''}</div>
            <div style="font-size:0.7rem;color:#ffd166;margin-bottom:6px;">Lv.${p.level} • HP ${p.maxHp}</div>
            <div style="display:flex;gap:4px;justify-content:center;flex-wrap:wrap;">
              <button class="px-btn btn-green" style="padding:3px 6px;font-size:0.68rem;" onclick="moveBoxToParty(${bIdx})">
                ${Game.party.length < 6 ? '📥 นำเข้าทีม' : '🔄 สลับเข้าทีม'}
              </button>
              <button class="px-btn btn-red" style="padding:3px 6px;font-size:0.68rem;" onclick="releaseBoxPokemon(${bIdx})">ปล่อย (+30🪙)</button>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  // 3. Dedicated Shop Page (#view-shop)
  const shopCoinsEl = document.getElementById('shopCoinsDisplay');
  if (shopCoinsEl) shopCoinsEl.textContent = Game.coins;

  const shopContainer = document.getElementById('shopPageContainer');
  if (shopContainer) {
    const shopItemsMeta = [
      { key: 'pokeball',    icon: getPokeballPixelImgHTML('pokeball', 3),    title: '🔴 โปเกบอล (Poké Ball)',     desc: 'บอลมาตรฐานสำหรับจับโปเกมอนป่าทั่วไป (โอกาสจับ x1.0)' },
      { key: 'greatball',   icon: getPokeballPixelImgHTML('greatball', 3),   title: '🔵 เกรทบอล (Great Ball)',    desc: 'บอลประสิทธิภาพสูง จับโปเกมอนระดับ Rare ได้ดีขึ้น (โอกาสจับ x1.6)' },
      { key: 'ultraball',   icon: getPokeballPixelImgHTML('ultraball', 3),   title: '🟡 อัลตร้าบอล (Ultra Ball)', desc: 'บอลระดับท็อปสำหรับจับ Epic & Legendary (โอกาสจับ x2.3)' },
      { key: 'masterball',  icon: getPokeballPixelImgHTML('masterball', 3),  title: '🟣 มาสเตอร์บอล (Master Ball)',desc: 'บอลในตำนาน! จับโปเกมอนป่าทุกตัวติด 100% ไม่มีพลาด!' },
      { key: 'potion',      icon: '<span style="font-size:2rem;">🧪</span>', title: '🧪 ยาโพชั่น (Potion)',        desc: 'ฟื้นฟูพลังชีวิต (HP) +45 หน่วย ใช้ได้ทั้งในฉากต่อสู้' },
      { key: 'superpotion', icon: '<span style="font-size:2rem;">⚗️</span>', title: '⚗️ ซูเปอร์โพชั่น (Super Potion)', desc: 'ฟื้นฟูพลังชีวิต (HP) เข้มข้น +120 หน่วย สำหรับศึกหนัก' }
    ];

    shopContainer.innerHTML = shopItemsMeta.map(meta => {
      const bagItem = Game.bag[meta.key];
      if (!bagItem) return '';
      return `
        <div class="shop-item-card">
          <div style="display:flex;justify-content:center;align-items:center;">${meta.icon}</div>
          <div>
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <strong style="font-size:0.9rem;color:#ffd166;">${meta.title}</strong>
              <span style="background:#141824;border:1px solid #5a6988;padding:1px 6px;font-size:0.72rem;color:#80ed99;">มีในกระเป๋า: x${bagItem.count}</span>
            </div>
            <p style="font-size:0.75rem;color:#c0cbdc;margin:4px 0 8px;">${meta.desc}</p>
            <div class="shop-buy-row">
              <button class="px-btn btn-green" style="padding:4px 10px;font-size:0.75rem;" onclick="buyShopItem('${meta.key}', 1)">
                🛒 ซื้อ x1 (${bagItem.price} 🪙)
              </button>
              <button class="px-btn btn-gold" style="padding:4px 10px;font-size:0.75rem;" onclick="buyShopItem('${meta.key}', 5)">
                📦 เหมา x5 (${bagItem.price * 5} 🪙)
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // 4. Pokédex Grid (#view-dex) with Mystery Silhouettes for Uncaught/Locked Pokémon!
  const dexGrid = document.getElementById('dexSpriteGrid');
  if (dexGrid) {
    const filteredList = Game.dexRarityFilter === 'all'
      ? POKEMON_DB
      : POKEMON_DB.filter(p => p.rarity === Game.dexRarityFilter);

    dexGrid.innerHTML = filteredList.map(p => {
      const owned = Game.pokedex[p.id];
      const isUnlocked = Boolean(owned);
      const tInfo = TYPE_INFO[p.type];
      const rInfo = RARITY_TIERS[p.rarity] || RARITY_TIERS.common;
      const silClass = isUnlocked ? '' : 'silhouette-locked';
      const displayName = isUnlocked ? p.name.split(' ')[0] : '???';

      return `
        <div class="dex-card ${isUnlocked ? '' : 'locked-card'}" style="border-color:${isUnlocked ? rInfo.border : '#3a4466'};" onclick="openDexInspector(${p.id})">
          ${isUnlocked
            ? `<span class="dex-own-tag">จับแล้ว x${owned.count}</span>`
            : `<span class="dex-own-tag" style="background:#3a4466;color:#adb5bd;">🔒 เงาปริศนา</span>`
          }
          <div style="font-size:0.68rem;color:${rInfo.border};font-weight:700;align-self:flex-start;">
            ${rInfo.short}
          </div>
          <div style="margin:4px 0;">
            ${getPokemonPixelImgHTML(p.code, isUnlocked && Game.dexShinyPreview, 5, silClass)}
          </div>
          <div style="font-weight:700;font-size:0.8rem;color:${isUnlocked ? '#ffffff' : '#8b9bb4'};">
            #${String(p.id).padStart(2, '0')} ${displayName}
          </div>
          <span style="background:${isUnlocked ? tInfo.color : '#2b334e'};font-size:0.66rem;padding:1px 6px;margin-top:4px;font-weight:700;">
            ${isUnlocked ? tInfo.label : '???'} • ร่าง ${p.stage}/${p.maxStage}
          </span>
        </div>
      `;
    }).join('');
  }
}

window.executePlayerMove = executePlayerMove;
window.useBagItemInBattle = useBagItemInBattle;
window.switchActivePokemon = switchActivePokemon;
window.buyShopItem = buyShopItem;
window.makeLeadPokemon = makeLeadPokemon;
window.feedCandyToPartyIdx = feedCandyToPartyIdx;
window.movePartyToBox = movePartyToBox;
window.moveBoxToParty = moveBoxToParty;
window.releaseBoxPokemon = releaseBoxPokemon;
window.openDexInspector = openDexInspector;
window.requestEvolvePartyMember = requestEvolvePartyMember;
window.useRareCandyOnLead = useRareCandyOnLead;
window.triggerManualEvolveLead = triggerManualEvolveLead;
window.setDexRarityFilter = setDexRarityFilter;
window.switchScreen = switchScreen;
window.SFX = SFX;
