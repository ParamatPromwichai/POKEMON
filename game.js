// ============================================================================
// POKÉ-PIXEL RPG ENGINE (30 Pokémon + Evolution System + 8-Bit Audio + PWA)
// ============================================================================

const SAVE_STORAGE_KEY = 'POKE_PIXEL_RPG_SAVE_V3';
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

  // --- Evolution Cutscene Audio Effects! ---
  evolutionStart() {
    // Classic "What? POKÉMON is evolving!" intro chord
    [392, 493.88, 587.33, 783.99].forEach((f, i) => {
      this.beep(f, 'square', 0.12, i * 0.09, 0.11);
    });
  },
  evolutionPulse(stepIdx) {
    // Classic alternating GBA evolution notes that pitch up as it progresses
    const pitchBoost = 1 + Math.floor(stepIdx / 4) * 0.08;
    const f1 = (stepIdx % 2 === 0 ? 392 : 523.25) * pitchBoost;
    const f2 = (stepIdx % 2 === 0 ? 493.88 : 659.25) * pitchBoost;
    this.beep(f1, 'square', 0.11, 0, 0.1);
    this.beep(f2, 'triangle', 0.11, 0.09, 0.1);
  },
  evolutionComplete() {
    // Grand Evolution Fanfare + Sparkle!
    const notes = [523.25, 587.33, 659.25, 783.99, 659.25, 783.99, 1046.5];
    const delays = [0, 0.11, 0.22, 0.34, 0.50, 0.62, 0.76];
    notes.forEach((f, i) => {
      this.beep(f, 'square', i === notes.length - 1 ? 0.45 : 0.11, delays[i], 0.13);
    });
    this.noise(0.25, 0.76, 0.09, 2500, 'highpass');
  },

  // --- Unique 8-Bit Electronic Cry for all 30 Pokemon! ---
  playPokemonCry(pokeId) {
    if (!this.sfxEnabled) return;
    const id = Number(pokeId) || 1;
    const p = POKEMON_DB.find(x => x.id === id) || POKEMON_DB[0];

    // Customize cry based on Pokemon stage & elemental family
    const isFinalStage = !p.evolvesTo && p.baseHp >= 84;
    const isMidStage = p.evolvesTo && p.baseHp >= 62;

    if (id === 10 || id === 11 || id === 12 || id === 15) {
      // Electric family (Pichu / Pikachu / Raichu / Jolteon)
      const base = id === 10 ? 820 : id === 11 ? 660 : 420;
      this.slide(base, base * 1.45, 'square', 0.09, 0, 0.1);
      this.slide(base * 1.3, base * 0.75, 'square', 0.14, 0.1, 0.1);
      this.beep(base * 1.6, 'triangle', 0.09, 0.24, 0.1);
    } else if (isFinalStage) {
      // Mighty Final Evolution Roar (Venusaur, Charizard, Blastoise, Gengar, Dragonite, Gyarados, Snorlax)
      const root = 150 + (id * 13) % 120;
      this.slide(root * 1.8, root * 0.7, 'sawtooth', 0.22, 0, 0.13);
      this.noise(0.24, 0.05, 0.11, 900, 'lowpass');
      this.slide(root * 1.4, root * 0.55, 'square', 0.28, 0.2, 0.12);
    } else if (isMidStage) {
      // Mid-stage fierce cry (Ivysaur, Charmeleon, Wartortle, Haunter, Dragonair)
      const root = 260 + (id * 19) % 160;
      this.slide(root, root * 1.5, 'sawtooth', 0.12, 0, 0.11);
      this.slide(root * 1.4, root * 0.8, 'square', 0.18, 0.12, 0.11);
    } else if (p.type === 'fairy' || id === 30) {
      // Cute Fairy / Mew musical trill
      const root = 520 + (id * 23) % 240;
      [root, root * 1.25, root * 1.12, root * 1.5].forEach((f, i) => {
        this.beep(f, 'sine', 0.11, i * 0.08, 0.12);
      });
    } else {
      // Cute Starter / Base stage chirp
      const root = 340 + (id * 29) % 240;
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
  coins: 400,
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
  evolvingNow: false
};

// ============================================================================
// PERSISTENT SAVE / LOAD SYSTEM (Auto-migrates old saves to 30-Pokemon DB)
// ============================================================================
function saveGameData() {
  try {
    const payload = {
      version: 3,
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
    const raw = localStorage.getItem(SAVE_STORAGE_KEY) || localStorage.getItem('POKE_PIXEL_RPG_SAVE_V2');
    if (!raw) return false;
    const data = JSON.parse(raw);
    if (!data || !Array.isArray(data.party) || data.party.length === 0) return false;

    // Sync each saved Pokemon with new 30-Pokemon DB by code
    const syncPoke = p => {
      const tmpl = POKEMON_DB.find(t => t.code === p.code) || POKEMON_DB.find(t => t.id === p.id) || POKEMON_DB[0];
      p.id = tmpl.id;
      p.code = tmpl.code;
      p.name = tmpl.name;
      p.type = tmpl.type;
      p.moves = [...tmpl.moves];
      return p;
    };

    Game.coins = typeof data.coins === 'number' ? data.coins : 400;
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
  localStorage.removeItem('POKE_PIXEL_RPG_SAVE_V2');
  window.location.reload();
}

// --- PWA Service Worker & Persistent Storage Registration ---
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
        alert('📲 วิธีติดตั้งเป็นแอป (PWA):\n• มือถือ Android/Chrome: กดเมนู ⋮ มุมขวาบน เลือก "ติดตั้งแอป" หรือ "เพิ่มลงในหน้าจอหลัก"\n• มือถือ iPhone (Safari): กดปุ่มแชร์ (Share) ด้านล่าง เลือก "เพิ่มไปยังหน้าจอโฮม (Add to Home Screen)"\n\nข้อมูลโปเกมอน 30 สายพันธุ์ การวิวัฒนาการ และไอเทมทั้งหมดจะถูกเซฟไว้ในเครื่องอัตโนมัติ ไม่หายแน่นอน!');
      }
    });
  }
}

// ============================================================================
// EVOLUTION SYSTEM (Cutscene + Multi-branch Eevee + Audio Fanfare!)
// ============================================================================
function getEvolutionTemplateFor(pokeInst) {
  const tmpl = POKEMON_DB.find(t => t.id === pokeInst.id);
  if (!tmpl || !tmpl.evolvesTo) return null;
  return tmpl;
}

function canPokemonEvolveNow(pokeInst) {
  const tmpl = getEvolutionTemplateFor(pokeInst);
  if (!tmpl) return false;
  return pokeInst.level >= (tmpl.evolveLevel || 8);
}

// Trigger evolution for a specific party index
function requestEvolvePartyMember(partyIdx, forcedTargetId = null) {
  if (Game.evolvingNow) return;
  const poke = Game.party[partyIdx];
  if (!poke) return;
  const tmpl = getEvolutionTemplateFor(poke);
  if (!tmpl) {
    SFX.hit(0.5);
    alert(`${poke.name} เป็นร่างสุดยอดแล้ว ไม่สามารถวิวัฒนาการต่อได้จ้า!`);
    return;
  }

  // Multi-branch evolution (Eevee #13 -> Vaporeon #14, Jolteon #15, Flareon #16)
  if (Array.isArray(tmpl.evolvesTo) && !forcedTargetId) {
    SFX.uiClick();
    const modal = document.getElementById('pixelModal');
    const box = document.getElementById('pixelModalContent');
    box.innerHTML = `
      <h2 style="color:#ffd166;margin-bottom:8px;">✨ เลือกสายวิวัฒนาการของ ${poke.name.split(' ')[0]}!</h2>
      <p style="font-size:0.86rem;color:#c0cbdc;margin-bottom:12px;">เลือกธาตุที่ต้องการให้ ${poke.name.split(' ')[0]} วิวัฒนาการได้เลย:</p>
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

  const modal = document.getElementById('pixelModal');
  const box = document.getElementById('pixelModalContent');
  modal.classList.add('open');

  SFX.evolutionStart();

  box.innerHTML = `
    <h2 style="color:#ffd166;margin-bottom:8px;">✨ เอ๊ะ!? ${oldName} กำลังจะวิวัฒนาการ!!</h2>
    <div id="evoStageBox" class="evo-stage-box">
      <div id="evoSpriteSwap">${getPokemonPixelImgHTML(oldCode, isShiny, 7, 'evo-sprite-silhouette')}</div>
    </div>
    <p id="evoDialogTxt" style="font-size:0.95rem;color:#fff;font-weight:700;margin-bottom:12px;">
      ร่างกายของ ${oldName} เปล่งแสงสว่างจ้า...
    </p>
  `;

  // Rapidly alternate between old sprite and new sprite with accelerating 8-bit pulses!
  let step = 0;
  const totalSteps = 12;
  const swapEl = document.getElementById('evoSpriteSwap');

  const evoInterval = setInterval(() => {
    step++;
    SFX.evolutionPulse(step);
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
  }, 240);
}

function completeEvolutionTransform(pokeInst, nextTemplate) {
  const oldName = pokeInst.name.split(' ')[0];

  // Upgrade Pokemon Instance to new Evolution Template!
  pokeInst.id = nextTemplate.id;
  pokeInst.code = nextTemplate.code;
  pokeInst.name = nextTemplate.name;
  pokeInst.type = nextTemplate.type;
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

  SFX.evolutionComplete();
  setTimeout(() => SFX.playPokemonCry(nextTemplate.id), 950);

  const box = document.getElementById('pixelModalContent');
  box.innerHTML = `
    <h2 style="color:#80ed99;margin-bottom:8px;">🎊 ยินดีด้วย! วิวัฒนาการสำเร็จ!!</h2>
    <div class="evo-stage-box" style="border-color:#80ed99;">
      <div class="evo-complete-burst">${getPokemonPixelImgHTML(nextTemplate.code, pokeInst.isShiny, 7)}</div>
    </div>
    <h3 style="color:#ffd166;margin-bottom:6px;">
      ${oldName} วิวัฒนาการเป็น 「${nextTemplate.name}」! ${pokeInst.isShiny ? '✨' : ''}
    </h3>
    <p style="font-size:0.86rem;color:#c0cbdc;margin-bottom:14px;">
      พลังชีวิตเพิ่มขึ้นเป็น ${pokeInst.maxHp} • โจมตี ${pokeInst.atk} • ความเร็ว ${pokeInst.spd}<br/>
      และเรียนรู้ท่าไม้ตายชุดใหม่เรียบร้อยแล้ว!
    </p>
    <button class="px-btn btn-green" onclick="finishEvolutionModal()">🌟 ยอดเยี่ยมเลย!</button>
  `;
}

window.finishEvolutionModal = function () {
  SFX.uiClick();
  Game.evolvingNow = false;
  document.getElementById('pixelModal').classList.remove('open');
};

// Shop / Quick Rare Candy & Evolution Stone Actions
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
    setTimeout(() => requestEvolvePartyMember(0), 500);
  }
}

function triggerManualEvolveLead() {
  const lead = Game.party[0];
  if (!lead) return;
  const tmpl = getEvolutionTemplateFor(lead);
  if (!tmpl) {
    SFX.hit(0.5);
    alert(`🐾 ${lead.name} เป็นร่างสุดยอดแล้ว วิวัฒนาการต่อไม่ได้จ้า!`);
    return;
  }
  if (Game.coins < 80) {
    SFX.hit(0.5);
    alert('🪙 เหรียญไม่พอ! (ต้องการ 80 เหรียญสำหรับหินวิวัฒนาการทันที)');
    return;
  }
  Game.coins -= 80;
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
    // Starter Team: Pikachu (#11) Lv.6 + Bulbasaur (#1) Lv.6 + Charmander (#4) Lv.6
    const s1 = createPokemonInstance(POKEMON_DB.find(p => p.id === 11), 6, false);
    const s2 = createPokemonInstance(POKEMON_DB.find(p => p.id === 1), 6, false);
    const s3 = createPokemonInstance(POKEMON_DB.find(p => p.id === 4), 6, false);
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
  const template = POKEMON_DB[Math.floor(Math.random() * POKEMON_DB.length)];
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
        const t = POKEMON_DB[Math.floor(Math.random() * POKEMON_DB.length)];
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

  Overworld.wildEntities.forEach(w => {
    const hop = Math.floor(Math.sin(ts * 0.008 + w.phase) * 2) * 2;
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(w.x - 14, w.y + 14, 28, 6);

    if (w.isShiny) {
      ctx.strokeStyle = '#ffd166';
      ctx.lineWidth = 2;
      ctx.strokeRect(w.x - 20, w.y - 20 + hop, 40, 40);
    }

    const pCanvas = getPokemonCanvasSprite(w.template.code, w.isShiny, 2);
    ctx.drawImage(pCanvas, w.x - 16, w.y - 18 + hop);

    ctx.fillStyle = 'rgba(20,24,36,0.85)';
    ctx.fillRect(w.x - 18, w.y - 29 + hop, 36, 12);
    ctx.fillStyle = w.isShiny ? '#ffd166' : '#ffffff';
    ctx.font = 'bold 9px monospace';
    ctx.fillText(`Lv.${w.level}`, w.x, w.y - 20 + hop);
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
  setTimeout(() => {
    SFX.playPokemonCry(enemy.id);
    if (enemy.isShiny) SFX.shinySparkle();
  }, 350);

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
    enemy.isShiny
      ? `✨ โปเกมอนป่าสีพิเศษ ${enemy.name} (Lv.${enemy.level}) ปรากฏตัว!`
      : `🌿 โปเกมอนป่า ${enemy.name} (Lv.${enemy.level}) โผล่ออกมาจากพงหญ้า!`
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
  const baseLv = Math.max(7, (Game.party[0]?.level || 6) + 1);
  // Gym Leader uses evolved powerhouses: Charizard (#6), Gengar (#19), Gyarados (#24)
  const t1 = createPokemonInstance(POKEMON_DB.find(p => p.id === 6), baseLv, false);
  const t2 = createPokemonInstance(POKEMON_DB.find(p => p.id === 19), baseLv + 1, false);
  const t3 = createPokemonInstance(POKEMON_DB.find(p => p.id === 24), baseLv + 2, true);

  setTimeout(() => SFX.playPokemonCry(t1.id), 350);

  Game.battle = {
    active: true,
    isTrainer: true,
    trainerName: 'ยิมลีดเดอร์ เรด (RED)',
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

  document.getElementById('enemyNameTxt').innerHTML = `${e.name.split(' ')[0]} ${e.isShiny ? '✨' : ''}`;
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
    catchHintEl.textContent = `🎯 โอกาสจับ: ~${estChance}% (ตอดเลือดให้จับง่าย!)`;
  }

  document.getElementById('playerNameTxt').innerHTML = `${p.name.split(' ')[0]} ${p.isShiny ? '✨' : ''}`;
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
  const hpFactor = 1 + (1 - e.hp / e.maxHp) * 1.45;
  const statusBonus = e.status === 'sleep' ? 1.65 : e.status === 'paralyze' ? 1.35 : 1.0;

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
            <span>🐾 ${member.name.split(' ')[0]} Lv${member.level}</span>
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

        const expGain = caughtPoke.level * 22;
        const coinGain = caughtPoke.isShiny ? 150 : 55;
        Game.coins += coinGain;
        const leveledUp = grantExpToActive(expGain);
        saveGameData();

        setBattleDialog(`🎉 ติ๊ง!! จับ ${caughtPoke.name} (Lv.${caughtPoke.level}) สำเร็จแล้ว! (+${coinGain}🪙)`);
        const activePoke = Game.party[b.playerIdx];
        if (leveledUp && canPokemonEvolveNow(activePoke)) {
          b.active = false;
          b.turnBusy = false;
          requestEvolvePartyMember(b.playerIdx);
        } else {
          showModalResult(
            `🎉 จับโปเกมอนสำเร็จ!`,
            caughtPoke,
            `บันทึกเข้าทีมเรียบร้อย! รางวัล +${coinGain} เหรียญ และ +${expGain} EXP`
          );
          b.active = false;
          b.turnBusy = false;
        }
      } else {
        SFX.ballBreakOut();
        ballHolder.className = 'battle-pokeball-holder';
        enemyBox.classList.remove('suck-in');
        setBattleDialog(`💨 อ๊ะ! ${b.enemy.name.split(' ')[0]} ดิ้นหลุดออกมาได้! ลองโจมตีให้เลือดลดลงอีกนิด!`);
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

  const expGain = enemy.level * 28 + (b.isTrainer ? 45 : 0);
  const coinGain = b.isTrainer ? 100 : 40;
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
      Game.coins += 160;
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
          `🏅 ชนะยิมลีดเดอร์ ${b.trainerName}!`,
          activePoke,
          `คุณคว้าเข็มกลัดยิม (รวม ${Game.badges} เหรียญตรา) และโบนัส +160 เหรียญ!`
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
// UI CONTROLS, CONTINUOUS MOBILE D-PAD, SHOP & MODALS
// ============================================================================
function bindUIControls() {
  document.querySelectorAll('.pixel-tab[data-view]').forEach(btn => {
    btn.addEventListener('click', () => {
      SFX.uiClick();
      const target = btn.dataset.view;
      if (!target) return;
      if (target === 'battle' && !Game.battle.active) {
        const t = POKEMON_DB[Math.floor(Math.random() * POKEMON_DB.length)];
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
    const t = POKEMON_DB[Math.floor(Math.random() * POKEMON_DB.length)];
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

function buyShopItem(key) {
  const item = Game.bag[key];
  if (!item) return;
  if (Game.coins < item.price) {
    SFX.hit(0.5);
    alert('🪙 เหรียญไม่พอ! ชนะโปเกมอนป่าหรือยิมลีดเดอร์เพื่อรับเหรียญเพิ่มนะ!');
    return;
  }
  Game.coins -= item.price;
  item.count++;
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

function showModalResult(title, pokeInst, subtitle) {
  const modal = document.getElementById('pixelModal');
  const box = document.getElementById('pixelModalContent');
  box.innerHTML = `
    <div style="display:flex;justify-content:center;margin-bottom:10px;">
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

function openDexInspector(pokeId) {
  const t = POKEMON_DB.find(p => p.id === pokeId);
  if (!t) return;
  SFX.playPokemonCry(t.id);
  const tInfo = TYPE_INFO[t.type];
  const modal = document.getElementById('pixelModal');
  const box = document.getElementById('pixelModalContent');

  // Evolution Info HTML
  let evoInfoHtml = `<div style="font-size:0.8rem;color:#80ed99;margin-bottom:10px;">🌟 ร่างสมบูรณ์สูงสุดแล้ว</div>`;
  if (t.evolvesTo) {
    const targets = Array.isArray(t.evolvesTo) ? t.evolvesTo : [t.evolvesTo];
    const targetNames = targets.map(id => {
      const nextP = POKEMON_DB.find(x => x.id === id);
      return nextP ? `#${String(nextP.id).padStart(2, '0')} ${nextP.name.split(' ')[0]}` : '';
    }).join(' / ');
    evoInfoHtml = `<div style="font-size:0.82rem;color:#ffd166;margin-bottom:10px;">✨ วิวัฒนาการที่ Lv.${t.evolveLevel} ➔ <b>${targetNames}</b></div>`;
  }

  box.innerHTML = `
    <div style="display:flex;justify-content:center;gap:24px;margin-bottom:12px;">
      <div>
        ${getPokemonPixelImgHTML(t.code, false, 6)}
        <div style="font-size:0.78rem;margin-top:4px;">Normal Sprite</div>
      </div>
      <div>
        ${getPokemonPixelImgHTML(t.code, true, 6)}
        <div style="font-size:0.78rem;margin-top:4px;color:#ffd166;">✨ Shiny Sprite</div>
      </div>
    </div>
    <h2 style="color:#ffd166;">#${String(t.id).padStart(2, '0')} ${t.name}</h2>
    <div style="margin:6px 0;">
      <span style="background:${tInfo.color};padding:2px 8px;font-weight:700;font-size:0.8rem;">ธาตุ: ${tInfo.label}</span>
      <span style="background:#3a4466;padding:2px 8px;font-weight:700;font-size:0.8rem;">HP:${t.baseHp} ATK:${t.baseAtk} SPD:${t.baseSpd}</span>
    </div>
    ${evoInfoHtml}
    <p style="font-size:0.86rem;color:#d8e2dc;margin:6px 0 14px;">${t.desc}</p>
    <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;">
      <button class="px-btn" style="background:#7209b7;border-color:#f72585;" onclick="SFX.playPokemonCry(${t.id})">🔊 ฟังเสียงร้อง</button>
      <button class="px-btn btn-gold" onclick="closeModalAndFightId(${t.id})">⚔️ ทดสอบสู้ & จับตัวนี้!</button>
      <button class="px-btn" onclick="document.getElementById('pixelModal').classList.remove('open')">ปิด</button>
    </div>
  `;
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
  const t = POKEMON_DB[Math.floor(Math.random() * POKEMON_DB.length)];
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

  const partyEl = document.getElementById('partyListContainer');
  if (partyEl) {
    partyEl.innerHTML = Game.party.map((p, idx) => {
      const hpPct = Math.max(0, Math.round((p.hp / p.maxHp) * 100));
      const hpColor = hpPct > 50 ? '#38b000' : hpPct > 20 ? '#f5b000' : '#e63946';
      const tmpl = getEvolutionTemplateFor(p);
      const readyEvo = canPokemonEvolveNow(p);

      let evoActionHtml = '';
      if (readyEvo) {
        evoActionHtml = `<button class="evolve-mini-btn" onclick="event.stopPropagation(); requestEvolvePartyMember(${idx})">✨ วิวัฒนาการ!</button>`;
      } else if (tmpl) {
        evoActionHtml = `<span style="color:#ffd166;">ร่างถัดไป Lv.${tmpl.evolveLevel}</span>`;
      } else {
        evoActionHtml = `<span style="color:#80ed99;">ร่างสูงสุด</span>`;
      }

      return `
        <div class="party-slot ${idx === 0 ? 'lead-slot' : ''}" onclick="makeLeadPokemon(${idx})" title="แตะเพื่อฟังเสียงร้อง / ตั้งเป็นตัวนำทีม">
          <div>${getPokemonPixelImgHTML(p.code, p.isShiny, 3)}</div>
          <div class="party-slot-info">
            <div class="party-slot-title">
              <span>${idx === 0 ? '⭐ ' : ''}${p.name.split(' ')[0]} ${p.isShiny ? '✨' : ''}</span>
              <span style="color:#ffd166;">Lv.${p.level}</span>
            </div>
            <div class="hp-track" style="margin:4px 0;">
              <div style="width:${hpPct}%;height:100%;background:${hpColor};"></div>
            </div>
            <div style="font-size:0.71rem;color:#adb5bd;display:flex;justify-content:space-between;align-items:center;">
              <span>HP ${p.hp}/${p.maxHp}</span>
              ${evoActionHtml}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  const dexGrid = document.getElementById('dexSpriteGrid');
  if (dexGrid) {
    dexGrid.innerHTML = POKEMON_DB.map(p => {
      const owned = Game.pokedex[p.id];
      const tInfo = TYPE_INFO[p.type];
      return `
        <div class="dex-card" onclick="openDexInspector(${p.id})">
          ${owned ? `<span class="dex-own-tag">จับแล้ว x${owned.count}</span>` : ''}
          <div style="margin:6px 0;">
            ${getPokemonPixelImgHTML(p.code, Game.dexShinyPreview, 5)}
          </div>
          <div style="font-weight:700;font-size:0.82rem;">#${String(p.id).padStart(2, '0')} ${p.name.split(' ')[0]}</div>
          <span style="background:${tInfo.color};font-size:0.68rem;padding:1px 6px;margin-top:4px;font-weight:700;">
            ${tInfo.label} ${p.evolvesTo ? `• Evo Lv.${p.evolveLevel}` : '• MAX'}
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
window.openDexInspector = openDexInspector;
window.requestEvolvePartyMember = requestEvolvePartyMember;
window.useRareCandyOnLead = useRareCandyOnLead;
window.triggerManualEvolveLead = triggerManualEvolveLead;
window.SFX = SFX;
