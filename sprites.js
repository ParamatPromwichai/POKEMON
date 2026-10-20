// ============================================================================
// PIXEL ART ENGINE & 40 POKÉMON (3-Stage, 4-Stage & 5-Stage Evolution Chains
// + 5 Rarity Tiers: COMMON, RARE, EPIC, LEGENDARY, MYTHIC)
// ============================================================================

const PixelRenderer = {
  cache: {},

  createCanvas(grid, palette, scale = 4, flipX = false) {
    const h = grid.length;
    const w = grid[0].length;
    const canvas = document.createElement('canvas');
    canvas.width = w * scale;
    canvas.height = h * scale;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    for (let y = 0; y < h; y++) {
      const row = grid[y];
      for (let x = 0; x < w; x++) {
        const ch = row[x];
        if (ch === '.' || ch === ' ' || !palette[ch]) continue;
        ctx.fillStyle = palette[ch];
        const drawX = flipX ? (w - 1 - x) * scale : x * scale;
        ctx.fillRect(drawX, y * scale, scale, scale);
      }
    }
    return canvas;
  },

  getDataURL(key, grid, palette, scale = 4, flipX = false) {
    const cacheKey = `${key}_${scale}_${flipX ? 'flip' : 'norm'}`;
    if (this.cache[cacheKey]) return this.cache[cacheKey];
    const c = this.createCanvas(grid, palette, scale, flipX);
    const url = c.toDataURL('image/png');
    this.cache[cacheKey] = url;
    return url;
  },

  getCanvas(key, grid, palette, scale = 4, flipX = false) {
    const cacheKey = `canvas_${key}_${scale}_${flipX ? 'flip' : 'norm'}`;
    if (this.cache[cacheKey]) return this.cache[cacheKey];
    const c = this.createCanvas(grid, palette, scale, flipX);
    this.cache[cacheKey] = c;
    return c;
  }
};

// ============================================================================
// RARITY TIERS CONFIGURATION (แบ่งระดับความหายาก 5 ระดับ)
// ============================================================================
const RARITY_TIERS = {
  common: {
    id: 'common',
    name: 'ทั่วไป (Common)',
    short: '★ ทั่วไป',
    stars: '★',
    color: '#6c757d',
    border: '#adb5bd',
    spawnWeight: 55
  },
  rare: {
    id: 'rare',
    name: 'หายาก (Rare)',
    short: '★★ หายาก',
    stars: '★★',
    color: '#2b9348',
    border: '#80ed99',
    spawnWeight: 26
  },
  epic: {
    id: 'epic',
    name: 'มหากาพย์ (Epic)',
    short: '★★★ Epic',
    stars: '★★★',
    color: '#7209b7',
    border: '#c77dff',
    spawnWeight: 12
  },
  legendary: {
    id: 'legendary',
    name: 'ตำนาน (Legendary)',
    short: '★★★★ ตำนาน',
    stars: '★★★★',
    color: '#e85d04',
    border: '#ffd166',
    spawnWeight: 5
  },
  mythic: {
    id: 'mythic',
    name: 'เทพมายา (Mythic)',
    short: '★★★★★ เทพมายา',
    stars: '★★★★★',
    color: '#d90429',
    border: '#ff70a6',
    spawnWeight: 2
  }
};

// ============================================================================
// MOVES & ELEMENTAL TYPES
// ============================================================================
const MOVES_DB = {
  splash:       { name: 'ดิ้นดุ๊กดิ๊ก (Splash)', type: 'water', power: 20, acc: 100, vfx: 'water' },
  tackle:       { name: 'พุ่งชน (Tackle)', type: 'normal', power: 40, acc: 100, vfx: 'impact' },
  quickAttack:  { name: 'โจมตีไว (Quick Atk)', type: 'normal', power: 45, acc: 100, vfx: 'slash' },
  bodySlam:     { name: 'ทุ่มสุดตัว (Body Slam)', type: 'normal', power: 75, acc: 95, vfx: 'impact', status: 'paralyze', chance: 0.3 },
  hyperBeam:    { name: 'ไฮเปอร์บีม (Hyper Beam)', type: 'normal', power: 105, acc: 95, vfx: 'sparkle' },
  thunderShock: { name: 'ช็อตไฟฟ้า (ThunderShock)', type: 'electric', power: 45, acc: 100, vfx: 'electric', status: 'paralyze', chance: 0.25 },
  thunderbolt:  { name: 'ไฟฟ้าแสนโวลต์ (Thunderbolt)', type: 'electric', power: 75, acc: 95, vfx: 'electric', status: 'paralyze', chance: 0.3 },
  voltTackle:   { name: 'โวลต์แทคเคิล (Volt Tackle)', type: 'electric', power: 95, acc: 95, vfx: 'electric', status: 'paralyze', chance: 0.35 },
  godThunder:   { name: 'อัสนีบาตสวรรค์ (God Thunder)', type: 'electric', power: 125, acc: 100, vfx: 'electric', status: 'paralyze', chance: 0.45 },
  vineWhip:     { name: 'เถาวัลย์ฟาด (Vine Whip)', type: 'grass', power: 45, acc: 100, vfx: 'leaf' },
  razorLeaf:    { name: 'ใบมีดโกน (Razor Leaf)', type: 'grass', power: 65, acc: 95, vfx: 'leaf' },
  solarBeam:    { name: 'โซลาร์บีม (Solar Beam)', type: 'grass', power: 95, acc: 95, vfx: 'leaf' },
  gaiaForest:   { name: 'มหาพฤกษาพิโรธ (Gaia Wrath)', type: 'grass', power: 120, acc: 100, vfx: 'leaf' },
  sleepPowder:  { name: 'ผงนิทรา (Sleep Powder)', type: 'grass', power: 0, acc: 85, vfx: 'powder', status: 'sleep', chance: 1.0 },
  ember:        { name: 'ลูกไฟเล็ก (Ember)', type: 'fire', power: 45, acc: 100, vfx: 'fire' },
  flamethrower: { name: 'พ่นไฟ (Flamethrower)', type: 'fire', power: 75, acc: 95, vfx: 'fire' },
  fireBlast:    { name: 'ไฟบรรลัยกัลป์ (Fire Blast)', type: 'fire', power: 100, acc: 95, vfx: 'fire' },
  blueFlare:    { name: 'เพลิงนิลกาฬเมก้า (Blue Flare)', type: 'fire', power: 130, acc: 100, vfx: 'fire' },
  bubble:       { name: 'ฟองสบู่ (Bubble)', type: 'water', power: 40, acc: 100, vfx: 'water' },
  waterGun:     { name: 'ปืนฉีดน้ำ (Water Gun)', type: 'water', power: 55, acc: 100, vfx: 'water' },
  aquaTail:     { name: 'หางคลื่นน้ำ (Aqua Tail)', type: 'water', power: 75, acc: 95, vfx: 'water' },
  hydroPump:    { name: 'ไฮโดรปั๊ม (Hydro Pump)', type: 'water', power: 100, acc: 95, vfx: 'water' },
  tidalCannon:  { name: 'ปืนใหญ่มหาสมุทร (Tidal Cannon)', type: 'water', power: 125, acc: 100, vfx: 'water' },
  sing:         { name: 'ร้องเพลงกล่อม (Sing)', type: 'fairy', power: 0, acc: 85, vfx: 'music', status: 'sleep', chance: 1.0 },
  fairyWind:    { name: 'ลมภูตแฟรี่ (Fairy Wind)', type: 'fairy', power: 55, acc: 100, vfx: 'sparkle' },
  moonblast:    { name: 'มูนบลาสต์ (Moonblast)', type: 'fairy', power: 95, acc: 100, vfx: 'sparkle' },
  lick:         { name: 'ลิ้นผีเลีย (Lick)', type: 'ghost', power: 40, acc: 100, vfx: 'shadow', status: 'paralyze', chance: 0.35 },
  shadowBall:   { name: 'ชาโดว์บอล (Shadow Ball)', type: 'ghost', power: 80, acc: 100, vfx: 'shadow' },
  abyssCurse:   { name: 'คำสาปมิติมืด (Abyss Curse)', type: 'ghost', power: 125, acc: 100, vfx: 'shadow' },
  dragonBreath: { name: 'ลมหายใจมังกร (DragonBreath)', type: 'dragon', power: 65, acc: 100, vfx: 'dragon', status: 'paralyze', chance: 0.25 },
  outrage:      { name: 'มังกรพิโรธ (Outrage)', type: 'dragon', power: 100, acc: 95, vfx: 'dragon' },
  dracoMeteor:  { name: 'ดราโก้มีเทีย (Draco Meteor)', type: 'dragon', power: 135, acc: 100, vfx: 'dragon' },
  confusion:    { name: 'คลื่นพลังจิต (Confusion)', type: 'psychic', power: 55, acc: 100, vfx: 'psychic' },
  psychic:      { name: 'ไซโคคิเนซิส (Psychic)', type: 'psychic', power: 90, acc: 100, vfx: 'psychic' },
  psystrike:    { name: 'ไซโคเบรก (Psystrike)', type: 'psychic', power: 115, acc: 100, vfx: 'psychic' },
  genesisSuper: { name: 'เจเนซิสซูเปอร์โนวา (Genesis Nova)', type: 'psychic', power: 145, acc: 100, vfx: 'sparkle' }
};

const TYPE_CHART = {
  electric: { water: 2.0, grass: 0.5, electric: 0.5, dragon: 0.5 },
  grass:    { water: 2.0, fire: 0.5, grass: 0.5, dragon: 0.5 },
  fire:     { grass: 2.0, water: 0.5, fire: 0.5, dragon: 0.5 },
  water:    { fire: 2.0, water: 0.5, grass: 0.5, dragon: 0.5 },
  fairy:    { dragon: 2.0, fire: 0.5 },
  ghost:    { psychic: 2.0, ghost: 2.0, normal: 0.5 },
  psychic:  { psychic: 0.5 },
  dragon:   { dragon: 2.0 },
  normal:   { ghost: 0.5 }
};

const TYPE_INFO = {
  electric: { label: 'ไฟฟ้า', color: '#f5b000' },
  grass:    { label: 'พืช',   color: '#38b000' },
  fire:     { label: 'ไฟ',    color: '#e85d04' },
  water:    { label: 'น้ำ',   color: '#0096c7' },
  fairy:    { label: 'แฟรี่', color: '#ff5d8f' },
  normal:   { label: 'ปกติ',  color: '#8d99ae' },
  ghost:    { label: 'ผี',    color: '#7209b7' },
  dragon:   { label: 'มังกร', color: '#4361ee' },
  psychic:  { label: 'พลังจิต', color: '#f72585' }
};

// ============================================================================
// 40 HANDCRAFTED 16x16 PIXEL ART POKÉMON (3 to 5 Evolution Stages per family!)
// ============================================================================
const POKEMON_DB = [
  // ==========================================================================
  // FAMILY 1: 5-STAGE FIRE DRAGON LINE (#01 -> #02 -> #03 -> #04 -> #05)
  // ==========================================================================
  {
    id: 1, code: 'charmeling', name: 'ฮิโตะเบบี้ (CHARMELING)', type: 'fire',
    rarity: 'common', stage: 1, maxStage: 5, chainIds: [1, 2, 3, 4, 5],
    baseHp: 42, baseAtk: 14, baseDef: 10, baseSpd: 15, catchRate: 0.55,
    evolvesTo: 2, evolveLevel: 5,
    moves: ['ember', 'tackle', 'quickAttack', 'flamethrower'],
    desc: 'ร่างที่ 1/5: ลูกกิ้งก่าไฟเพิ่งฟักจากไข่ หางมีประกายไฟดวงจิ๋ว (วิวัฒนาการ 5 ร่าง!)',
    palette: { K: '#1e1b18', O: '#ff8552', C: '#fff3b0', R: '#ff2a2a', Y: '#ffea00', W: '#ffffff' },
    shinyPalette: { K: '#1e1b18', O: '#ffd166', C: '#ffffff', R: '#3a86ff', Y: '#90e0ef', W: '#ffffff' },
    grid: [
      '................','.....KKKKKK.....','....KOOOOOOK....','...KOOOOOOOOOK..',
      '...KOWKOOOKWOK..','...KOKKOOOKKOK.R','...KOOOOOOOOOKRY','....KOCCCCOOK.RR',
      '...KKCCCCCCKK.K.','...KOCCCCCCOKK..','....KOOOOOOOK...','....KOOK.KOOK...',
      '....KKKK.KKKK...','................','................','................'
    ]
  },
  {
    id: 2, code: 'charmander', name: 'ฮิโตะคาเงะ (CHARMANDER)', type: 'fire',
    rarity: 'common', stage: 2, maxStage: 5, chainIds: [1, 2, 3, 4, 5],
    baseHp: 54, baseAtk: 18, baseDef: 13, baseSpd: 18, catchRate: 0.45,
    evolvesTo: 3, evolveLevel: 9,
    moves: ['ember', 'quickAttack', 'flamethrower', 'tackle'],
    desc: 'ร่างที่ 2/5: กิ้งก่าไฟตัวน้อย เปลวไฟที่ปลายหางบอกถึงพลังชีวิตที่ลุกโชน (Evo Lv.9)',
    palette: { K: '#1e1b18', O: '#ff6b35', S: '#d94e1f', C: '#ffe6a7', R: '#ff2a2a', Y: '#ffea00', W: '#ffffff' },
    shinyPalette: { K: '#1e1b18', O: '#ffbe0b', S: '#fb8500', C: '#fff3b0', R: '#3a86ff', Y: '#8ecae6', W: '#ffffff' },
    grid: [
      '....KKKKKK......','...KOOOOOOK.....','..KOOOOOOOOK....','..KOWKOOOKWOK...',
      '..KOKKOOOKKOK..R','..KOOOOOOOOOK.RY','...KOOOKOOOK..RY','...KOOCCCCOOK.RR',
      '..KKOCCCCCCOK.K.','..KOOCCCCCCOSKK.','...KOCCCCCCOSOK.','...KOOCCCCOOSSK.',
      '...KOOOOOOOOOK..','...KOOK..KOOK...','...KKKK..KKKK...','................'
    ]
  },
  {
    id: 3, code: 'charmeleon', name: 'ลิซาร์โดะ (CHARMELEON)', type: 'fire',
    rarity: 'rare', stage: 3, maxStage: 5, chainIds: [1, 2, 3, 4, 5],
    baseHp: 72, baseAtk: 23, baseDef: 17, baseSpd: 22, catchRate: 0.30,
    evolvesTo: 4, evolveLevel: 14,
    moves: ['flamethrower', 'ember', 'dragonBreath', 'quickAttack'],
    desc: 'ร่างที่ 3/5: มีเขาแหลมบนหัวและกรงเล็บคมกริบ เปลวไฟร้อนแรงขึ้นมาก (Evo Lv.14)',
    palette: { K: '#1e1b18', O: '#d90429', S: '#9b0000', C: '#ffe6a7', R: '#ff5400', Y: '#ffea00', W: '#ffffff' },
    shinyPalette: { K: '#1e1b18', O: '#ffbe0b', S: '#e85d04', C: '#fff3b0', R: '#7209b7', Y: '#4cc9f0', W: '#ffffff' },
    grid: [
      '....KKKKKKKKK...','...KOOOOOOOOOK..','..KOOOOOOOOOK...','..KOWKOOOKWOK..R',
      '..KOKKOOOKKOK.RY','..KOOOOOOOOOK.RY','...KOOCCCCOOK.RR','..KKOCCCCCCOK.K.',
      '.KOOOCCCCCCOSKK.','..KKOCCCCCCOSOK.','...KOOCCCCOOSSK.','...KOOOOOOOOOK..',
      '...KWWK..KWWK...','...KKKK..KKKK...','................','................'
    ]
  },
  {
    id: 4, code: 'charizard', name: 'ลิซาร์ดอน (CHARIZARD)', type: 'fire',
    rarity: 'epic', stage: 4, maxStage: 5, chainIds: [1, 2, 3, 4, 5],
    baseHp: 96, baseAtk: 30, baseDef: 23, baseSpd: 27, catchRate: 0.16,
    evolvesTo: 5, evolveLevel: 20,
    moves: ['fireBlast', 'flamethrower', 'dragonBreath', 'hyperBeam'],
    desc: 'ร่างที่ 4/5: มังกรเพลิงกางปีกบินเหนือท้องฟ้า ยังวิวัฒนาการสู่ร่างเมก้า X ได้อีก! (Evo Lv.20)',
    palette: { K: '#1e1b18', O: '#ff6b35', T: '#0077b6', C: '#ffe6a7', R: '#ff0000', Y: '#ffea00', W: '#ffffff' },
    shinyPalette: { K: '#1e1b18', O: '#2b2d42', T: '#d90429', C: '#adb5bd', R: '#00b4d8', Y: '#90e0ef', W: '#ffffff' },
    grid: [
      '.KK..KKKKKK..KK.','KTTKKOOOOOOKKTTK','KTTTKOOOOOOKTTTK','KTTTKOWKOOKWTTTK',
      'KTTTKOOOOOOOTTTK','KTTKKOOCCCCOOKTK','.KK.KCCCCCCCCK.R','....KCCCCCCCCKRY',
      '...KOOCCCCCCOKRY','...KOOCCCCCCOKRR','...KOOOOOOOOOKK.','...KOOOOOOOOOK..',
      '...KOOK...KOOK..','...KKKK...KKKK..','................','................'
    ]
  },
  {
    id: 5, code: 'megacharizardx', name: 'เมก้าลิซาร์ดอน X (MEGA CHARIZARD X)', type: 'fire',
    rarity: 'mythic', stage: 5, maxStage: 5, chainIds: [1, 2, 3, 4, 5],
    baseHp: 132, baseAtk: 42, baseDef: 32, baseSpd: 35, catchRate: 0.06,
    evolvesTo: null, evolveLevel: null,
    moves: ['blueFlare', 'dracoMeteor', 'fireBlast', 'hyperBeam'],
    desc: 'ร่างที่ 5/5 (Mythic): ร่างเมก้าเพลิงทมิฬ! เปลวไฟสีฟ้าครามพุ่งออกจากมุมปาก ร้อนแรงระดับหลอมอุกกาบาต!',
    palette: { K: '#0b090a', O: '#2b2d42', T: '#00b4d8', C: '#caf0f8', B: '#00f5d4', R: '#ef233c', W: '#ffffff' },
    shinyPalette: { K: '#0b090a', O: '#240046', T: '#ff006e', C: '#ffccd5', B: '#ffbe0b', R: '#00f5d4', W: '#ffffff' },
    grid: [
      'BBK..KKKKKK..KBB','BTTKKOOOOOOKKTTB','KTTTKOOOOOOKTTTK','KTTTKWRKOOKRWTTK',
      'BTTBBOOOOOOOBTTB','KTTKKOOCCCCOOKTK','.KK.KCCCCCCCCK.B','....KCCCCCCCCKBB',
      '...KOOCCCCCCOKBB','...KOOCCCCCCOKTT','...KOOOOOOOOOKK.','...KOOOOOOOOOK..',
      '...KTTK...KTTK..','...KKKK...KKKK..','................','................'
    ]
  },

  // ==========================================================================
  // FAMILY 2: 4-STAGE THUNDER GOD PIKACHU LINE (#06 -> #07 -> #08 -> #09)
  // ==========================================================================
  {
    id: 6, code: 'pichu', name: 'พิชู (PICHU)', type: 'electric',
    rarity: 'common', stage: 1, maxStage: 4, chainIds: [6, 7, 8, 9],
    baseHp: 42, baseAtk: 14, baseDef: 10, baseSpd: 17, catchRate: 0.55,
    evolvesTo: 7, evolveLevel: 6,
    moves: ['thunderShock', 'quickAttack', 'sing', 'tackle'],
    desc: 'ร่างที่ 1/4: ลูกหนูไฟฟ้าตัวจิ๋ว เวลาตกใจจะเผลอช็อตไฟใส่ตัวเอง (Evo Lv.6)',
    palette: { K: '#1e1b18', Y: '#fff3b0', R: '#ff5d8f', W: '#ffffff' },
    shinyPalette: { K: '#1e1b18', Y: '#ffd166', R: '#e63946', W: '#ffffff' },
    grid: [
      '..KKK......KKK..','.KKKKK....KKKKK.','.KKYYKK..KKYYKK.','..KYYYK..KYYYK..',
      '...KYYYYYYYYK...','..KYYYYYYYYYYK..','..KYWKYYYYKWYK..','..KRYRYYYYRYRK..',
      '...KYYKKKKYYK...','....KKKKKKKK....','...KYYYYYYYYK...','...KYYYYYYYYK...',
      '....KYYKKYYK....','....KKK..KKK....','................','................'
    ]
  },
  {
    id: 7, code: 'pikachu', name: 'พิกะจู (PIKACHU)', type: 'electric',
    rarity: 'common', stage: 2, maxStage: 4, chainIds: [6, 7, 8, 9],
    baseHp: 58, baseAtk: 18, baseDef: 14, baseSpd: 21, catchRate: 0.42,
    evolvesTo: 8, evolveLevel: 11,
    moves: ['thunderbolt', 'thunderShock', 'quickAttack', 'voltTackle'],
    desc: 'ร่างที่ 2/4: หนูไฟฟ้าแก้มแดงสุดน่ารัก ชาร์จพลังไฟฟ้าไว้ในแก้มทั้งสองข้าง (Evo Lv.11)',
    palette: { K: '#1e1b18', Y: '#ffdd33', S: '#e6a800', R: '#ff3b3b', W: '#ffffff' },
    shinyPalette: { K: '#1e1b18', Y: '#ff9f1c', S: '#d97706', R: '#ff2a55', W: '#ffffff' },
    grid: [
      '..KK........KK..','.KKKK......KKKK.','.KKYYK....KYYKK.','..KYYYK..KYYYK..',
      '...KYYYYYYYYK...','..KYYYYYYYYYYK..','..KYKWYYYYWKYK..','..KYKKYYYYKKYK..',
      '.KRYRYYYYYYRYRK.','.KRRYYYYKYYYYRRK','..KYYYYYYYYYYK.K','..KYYYSYYYYYYKKY',
      '..KYYYYYYYYYYKYY','...KYYYYYYYYKKS.','...KSSK..KSSK...','...KKK....KKK...'
    ]
  },
  {
    id: 8, code: 'raichu', name: 'ไรจู (RAICHU)', type: 'electric',
    rarity: 'rare', stage: 3, maxStage: 4, chainIds: [6, 7, 8, 9],
    baseHp: 86, baseAtk: 26, baseDef: 20, baseSpd: 26, catchRate: 0.24,
    evolvesTo: 9, evolveLevel: 17,
    moves: ['voltTackle', 'thunderbolt', 'quickAttack', 'hyperBeam'],
    desc: 'ร่างที่ 3/4: หางยาวรูปสายฟ้าช่วยคายประจุไฟฟ้าแรงสูง ยังพัฒนาร่างเทพสายฟ้าได้อีก! (Evo Lv.17)',
    palette: { K: '#1e1b18', O: '#f48c06', Y: '#ffd166', C: '#fff3b0', W: '#ffffff' },
    shinyPalette: { K: '#1e1b18', O: '#d90429', Y: '#ffbe0b', C: '#ffe5d9', W: '#ffffff' },
    grid: [
      '.KKK........KKK.','KYYYK......KYYYK','.KOOOKKKKKKOOOK.','..KOOOOOOOOOOK..',
      '..KOWKOOOOKWOK..','..KYYOOOOOOYYK..','...KOOOOOOOOOK.K','..KOOCCCCCCOOOKY',
      '.KOOCCCCCCCCOOKY','..KOOCCCCCCOOOK.','...KOOOOOOOOOK..','...KOOOKKOOOK...',
      '...KKKK..KKKK...','................','................','................'
    ]
  },
  {
    id: 9, code: 'raichugod', name: 'ไรจูเทพสายฟ้า (THUNDER GOD RAICHU)', type: 'electric',
    rarity: 'legendary', stage: 4, maxStage: 4, chainIds: [6, 7, 8, 9],
    baseHp: 118, baseAtk: 37, baseDef: 28, baseSpd: 36, catchRate: 0.09,
    evolvesTo: null, evolveLevel: null,
    moves: ['godThunder', 'voltTackle', 'psychic', 'hyperBeam'],
    desc: 'ร่างที่ 4/4 (Legendary): ไรจูผู้บรรลุพลังสายฟ้าสวรรค์ ขี่หางคลื่นอัสนีลอยตัวเหนือเมฆา!',
    palette: { K: '#14213d', O: '#ff9f1c', Y: '#ffea00', B: '#00f5d4', W: '#ffffff' },
    shinyPalette: { K: '#14213d', O: '#7209b7', Y: '#f72585', B: '#4cc9f0', W: '#ffffff' },
    grid: [
      'BKKK...BB...KKKB','KYYYK.BWWB.KYYYK','.KOOOKKKKKKOOOK.','..KOOOOOOOOOOK..',
      '..KBBKOOOOKBBK..','..KYYOOOOOOYYK..','..KOOOOOOOOOOKYY','..KOOWWWWWWOOOKY',
      '.BKOOWWWWWWOOKY.','BWWKOOOOOOOOOKWW','BWWWWKKKKKKKKWWB','.BBBBBBBBBBBBBB.',
      '................','................','................','................'
    ]
  },

  // ==========================================================================
  // FAMILY 3: 4-STAGE VENUSAUR LINE (#10 -> #11 -> #12 -> #13)
  // ==========================================================================
  {
    id: 10, code: 'bulba', name: 'ฟุชิกิดาเนะ (BULBASAUR)', type: 'grass',
    rarity: 'common', stage: 1, maxStage: 4, chainIds: [10, 11, 12, 13],
    baseHp: 56, baseAtk: 14, baseDef: 15, baseSpd: 13, catchRate: 0.45,
    evolvesTo: 11, evolveLevel: 7,
    moves: ['vineWhip', 'tackle', 'sleepPowder', 'razorLeaf'],
    desc: 'ร่างที่ 1/4: โปเกมอนเมล็ดพันธุ์ มีดอกไม้ตูมสีเขียวสดอยู่บนหลัง (Evo Lv.7)',
    palette: { K: '#1b262c', G: '#38b000', D: '#007200', B: '#57cc99', S: '#2b9348', R: '#e63946', W: '#ffffff' },
    shinyPalette: { K: '#1b262c', G: '#ffd166', D: '#f4a261', B: '#aacc00', S: '#55a630', R: '#e63946', W: '#ffffff' },
    grid: [
      '......KKKK......','....KKGGGGKK....','...KGGGGGGGDK...','..KGGGGGGGGDDK..',
      '.KBBKKKKKKKKDDK.','.KBBBBBBBBBBGDK.','KBBBBBBBBBBBBGK.','KBWRKBBBBKRWBSSK',
      'KBRRKBBBBKRRBSBK','KBBBBBBBBBBBBBBK','KBBBKKKKKKBBBBBK','.KBBBBBBBBBSSBK.',
      '.KBBBBBBBBBBBBK.','..KBBKBBBKBBKBK.','..KKKK...KKKKKK.','................'
    ]
  },
  {
    id: 11, code: 'ivysaur', name: 'ฟุชิกิโซ (IVYSAUR)', type: 'grass',
    rarity: 'rare', stage: 2, maxStage: 4, chainIds: [10, 11, 12, 13],
    baseHp: 74, baseAtk: 19, baseDef: 20, baseSpd: 16, catchRate: 0.30,
    evolvesTo: 12, evolveLevel: 13,
    moves: ['razorLeaf', 'vineWhip', 'sleepPowder', 'solarBeam'],
    desc: 'ร่างที่ 2/4: ดอกไม้ตูมสีชมพูบนหลังเริ่มบานออก ส่งกลิ่นหอมหวาน (Evo Lv.13)',
    palette: { K: '#1b262c', P: '#ff4d6d', G: '#38b000', B: '#38a3a5', S: '#22577a', R: '#e63946', W: '#ffffff' },
    shinyPalette: { K: '#1b262c', P: '#ffbe0b', G: '#80ed99', B: '#70e000', S: '#38b000', R: '#e63946', W: '#ffffff' },
    grid: [
      '....KKKKKKKK....','...KPPPPPPPPK...','..KPPPPPPPPPPK..','.KGGGGKKKKKKKKG.',
      'KGGGGBBBBBBBBBGK','KGBBBBBBBBBBBBBK','KBWRKBBBBKRWBSSK','KBRRKBBBBKRRBSBK',
      'KBBBBBBBBBBBBBBK','KBBBKKKKKKBBBBBK','.KBBBBBBBBBSSBK.','.KBBBBBBBBBBBBK.',
      '..KBBKBBBBKBBK..','..KKKK....KKKK..','................','................'
    ]
  },
  {
    id: 12, code: 'venusaur', name: 'ฟุชิกิบานะ (VENUSAUR)', type: 'grass',
    rarity: 'epic', stage: 3, maxStage: 4, chainIds: [10, 11, 12, 13],
    baseHp: 98, baseAtk: 26, baseDef: 26, baseSpd: 20, catchRate: 0.18,
    evolvesTo: 13, evolveLevel: 19,
    moves: ['solarBeam', 'razorLeaf', 'sleepPowder', 'bodySlam'],
    desc: 'ร่างที่ 3/4: ดอกไม้ยักษ์บนหลังรับแสงอาทิตย์เต็มพิกัด พัฒนาสู่ร่างเมก้าได้อีก! (Evo Lv.19)',
    palette: { K: '#1b262c', P: '#e63946', Y: '#ffd166', G: '#2b9348', B: '#2ec4b6', R: '#ff2a55', W: '#ffffff' },
    shinyPalette: { K: '#1b262c', P: '#ff9f1c', Y: '#fff3b0', G: '#80ed99', B: '#70e000', R: '#ff2a55', W: '#ffffff' },
    grid: [
      '.KKKKKKKKKKKKKK.','KPPPPYYPPPPYYPPK','KPPPPPPPPPPPPPPK','.KKKKGGGGGGKKKK.',
      'KGGGGGGYYGGGGGGK','KBBBBBBBBBBBBBBK','KBWRKBBBBBBKRWBK','KBRRKBBBBBBKRRBK',
      'KBBBBBBBBBBBBBBK','KBBBKKKKKKKKBBBK','KBBBBBBBBBBBBBBK','KBBBBBBBBBBBBBBK',
      '.KBBBKBBBBKBBBK.','.KKKKK....KKKKK.','................','................'
    ]
  },
  {
    id: 13, code: 'megavenusaur', name: 'เมก้าฟุชิกิบานะ (MEGA VENUSAUR)', type: 'grass',
    rarity: 'legendary', stage: 4, maxStage: 4, chainIds: [10, 11, 12, 13],
    baseHp: 130, baseAtk: 34, baseDef: 36, baseSpd: 24, catchRate: 0.08,
    evolvesTo: null, evolveLevel: null,
    moves: ['gaiaForest', 'solarBeam', 'sleepPowder', 'hyperBeam'],
    desc: 'ร่างที่ 4/4 (Legendary): มหาพฤกษาเมก้า! ดอกไม้บานซ้อนกันสองชั้นพร้อมเถาวัลย์ศักดิ์สิทธิ์บนหน้าผาก!',
    palette: { K: '#1b262c', P: '#ff006e', Y: '#ffea00', G: '#38b000', B: '#00bbf9', W: '#ffffff' },
    shinyPalette: { K: '#1b262c', P: '#ffd166', Y: '#ffffff', G: '#70e000', B: '#9b5de5', W: '#ffffff' },
    grid: [
      'YKKKKKKKKKKKKKKY','KPPPPYYPPPPYYPPK','KYYPPPPYYYYPPPPK','GKKKKGGGGGGKKKKG',
      'KGGGGGGYYGGGGGGK','KBBBBYYBBYYBBBBK','KBWWKBBBBBBKWWBK','KBPKBBBBBBBBKPBK',
      'KBBBBBBBBBBBBBBK','KBBBKKKKKKKKBBBK','KBBBBGGGGGGGBBBK','KBBBBBBBBBBBBBBK',
      '.KBBBKBBBBKBBBK.','.KKKKK....KKKKK.','................','................'
    ]
  },

  // ==========================================================================
  // FAMILY 4: 4-STAGE BLASTOISE LINE (#14 -> #15 -> #16 -> #17)
  // ==========================================================================
  {
    id: 14, code: 'squirtle', name: 'เซนิกาเมะ (SQUIRTLE)', type: 'water',
    rarity: 'common', stage: 1, maxStage: 4, chainIds: [14, 15, 16, 17],
    baseHp: 54, baseAtk: 14, baseDef: 17, baseSpd: 13, catchRate: 0.45,
    evolvesTo: 15, evolveLevel: 7,
    moves: ['bubble', 'tackle', 'waterGun', 'aquaTail'],
    desc: 'ร่างที่ 1/4: เต่าน้อยกระดองแข็งแรง พ่นน้ำแรงดันสูงได้อย่างแม่นยำ (Evo Lv.7)',
    palette: { K: '#1b262c', B: '#48cae4', S: '#0096c7', Y: '#ffe599', M: '#c97a40', W: '#ffffff' },
    shinyPalette: { K: '#1b262c', B: '#9d4edd', S: '#7b2cbf', Y: '#ffe599', M: '#38b000', W: '#ffffff' },
    grid: [
      '....KKKKKK......','...KBBBBBBK.....','..KBBBBBBBBK....','..KBWKBBBKWBK...',
      '..KBKKBBBKKBK...','..KBBBBBBBBBK...','...KBBKKKBBK.KK.','..KKYYYYYYYKKMMK',
      '.KBBYYYYYYYYMMMK','.KBBYYKYYKYYMMMK','..KKYYYYYYYYMMK.','...KYYYYYYYYKKK.',
      '...KBBBBBBBBBSK.','...KBBK..KBBK...','...KKKK..KKKK...','................'
    ]
  },
  {
    id: 15, code: 'wartortle', name: 'คาเมล (WARTORTLE)', type: 'water',
    rarity: 'rare', stage: 2, maxStage: 4, chainIds: [14, 15, 16, 17],
    baseHp: 72, baseAtk: 19, baseDef: 22, baseSpd: 16, catchRate: 0.30,
    evolvesTo: 16, evolveLevel: 13,
    moves: ['waterGun', 'aquaTail', 'bubble', 'bodySlam'],
    desc: 'ร่างที่ 2/4: มีหูและหางปุยสีขาวเหมือนฟองคลื่น สัญลักษณ์แห่งอายุยืนยาว (Evo Lv.13)',
    palette: { K: '#1b262c', B: '#0077b6', W: '#ffffff', Y: '#ffe599', M: '#9c6644' },
    shinyPalette: { K: '#1b262c', B: '#7209b7', W: '#ffd6ff', Y: '#ffe599', M: '#2b9348' },
    grid: [
      '.KKK.KKKKKK.KKK.','KWWWKBWWWWBKWWWK','.KWWKBBBBBBKWWK.','..KKBWKBBKWBKK..',
      '...KBBBBBBBBK...','...KBBKKKKBBKKW.','..KKYYYYYYYMMWWK','.KBBYYYYYYYMMWWK',
      '.KBBYYKYYKYMMWWK','..KKYYYYYYYMMKK.','...KBBBBBBBBK...','...KBBK..KBBK...',
      '...KKKK..KKKK...','................','................','................'
    ]
  },
  {
    id: 16, code: 'blastoise', name: 'คาเม็กซ์ (BLASTOISE)', type: 'water',
    rarity: 'epic', stage: 3, maxStage: 4, chainIds: [14, 15, 16, 17],
    baseHp: 98, baseAtk: 25, baseDef: 29, baseSpd: 19, catchRate: 0.16,
    evolvesTo: 17, evolveLevel: 19,
    moves: ['hydroPump', 'aquaTail', 'waterGun', 'hyperBeam'],
    desc: 'ร่างที่ 3/4: มีปืนใหญ่แรงดันน้ำคู่บนกระดอง ยังวิวัฒนาการสู่ร่างเมก้าได้อีก! (Evo Lv.19)',
    palette: { K: '#1b262c', B: '#005f73', G: '#adb5bd', Y: '#ffe599', M: '#7f4f24', W: '#ffffff' },
    shinyPalette: { K: '#1b262c', B: '#5a189a', G: '#ffd166', Y: '#ffe599', M: '#2b9348', W: '#ffffff' },
    grid: [
      '.KKKK.KKKK.KKKK.','KGGGGKBBBBKGGGGK','KGGGKBBBBBBKGGGK','.KKKBWKBBKWBKKK.',
      '..KMMMMMMMMMMK..','.KMMYYYYYYYYMMK.','KMMMYYYYYYYYMMMK','KBBBYYKYYKYYBBBK',
      'KBBBYYYYYYYYBBBK','.KMMYYYYYYYYMMK.','.KBBBBBBBBBBBBK.','..KBBBK..KBBBK..',
      '..KKKKK..KKKKK..','................','................','................'
    ]
  },
  {
    id: 17, code: 'megablastoise', name: 'เมก้าคาเม็กซ์ (MEGA BLASTOISE)', type: 'water',
    rarity: 'legendary', stage: 4, maxStage: 4, chainIds: [14, 15, 16, 17],
    baseHp: 128, baseAtk: 36, baseDef: 38, baseSpd: 23, catchRate: 0.08,
    evolvesTo: null, evolveLevel: null,
    moves: ['tidalCannon', 'hydroPump', 'aquaTail', 'hyperBeam'],
    desc: 'ร่างที่ 4/4 (Legendary): ป้อมปราการปืนใหญ่วารี 3 กระบอกบนหลังและแขน ยิงคลื่นน้ำถล่มภูเขา!',
    palette: { K: '#1b262c', B: '#0077b6', G: '#e0e1dd', Y: '#ffd166', M: '#582f0e', W: '#ffffff' },
    shinyPalette: { K: '#1b262c', B: '#7209b7', G: '#ffbe0b', Y: '#ffffff', M: '#38b000', W: '#ffffff' },
    grid: [
      'KKKK.KKKKKK.KKKK','KGGGKGGGGGGKGGGK','KGGGKGGGGGGKGGGK','.KKKBWKBBKWBKKK.',
      'KKKMMMMMMMMMMKKK','KGGMYYYYYYYYMGGK','KMMMYYYYYYYYMMMK','KBBBYYKYYKYYBBBK',
      'KBBBYYYYYYYYBBBK','.KMMYYYYYYYYMMK.','.KBBBBBBBBBBBBK.','..KBBBK..KBBBK..',
      '..KKKKK..KKKKK..','................','................','................'
    ]
  },

  // ==========================================================================
  // FAMILY 5: 4-STAGE GENGAR LINE (#18 -> #19 -> #20 -> #21)
  // ==========================================================================
  {
    id: 18, code: 'gastly', name: 'โกส (GASTLY)', type: 'ghost',
    rarity: 'common', stage: 1, maxStage: 4, chainIds: [18, 19, 20, 21],
    baseHp: 46, baseAtk: 17, baseDef: 11, baseSpd: 17, catchRate: 0.45,
    evolvesTo: 19, evolveLevel: 7,
    moves: ['lick', 'shadowBall', 'sleepPowder', 'confusion'],
    desc: 'ร่างที่ 1/4: โปเกมอนแก๊สวิญญาณ ร่างกาย 95% เป็นหมอกพิษเรืองแสง (Evo Lv.7)',
    palette: { K: '#10002b', P: '#9d4edd', D: '#3c096c', W: '#ffffff', R: '#ff2a55' },
    shinyPalette: { K: '#10002b', P: '#4cc9f0', D: '#1d3557', W: '#ffffff', R: '#ff2a55' },
    grid: [
      '..PPP..KKKK..PP.','.PP..KKDDDDKK..P','...KKDDDDDDDDKK.','..KDDWWDDDDWWDDK',
      '..KDDWWKDDKWWDDK','.KDDDDDDDDDDDDDK','.KDDDDDRRRDDDDDK','..KDDDDDDDDDDDK.',
      '..PPKKDDDDDDKKP.','.P....KKKKKK..PP','................','................',
      '................','................','................','................'
    ]
  },
  {
    id: 19, code: 'haunter', name: 'โกสท์ (HAUNTER)', type: 'ghost',
    rarity: 'rare', stage: 2, maxStage: 4, chainIds: [18, 19, 20, 21],
    baseHp: 64, baseAtk: 23, baseDef: 15, baseSpd: 21, catchRate: 0.30,
    evolvesTo: 20, evolveLevel: 13,
    moves: ['shadowBall', 'lick', 'psychic', 'sleepPowder'],
    desc: 'ร่างที่ 2/4: มีมือลอยแยกออกจากลำตัว ชอบแอบซ่อนในความมืด (Evo Lv.13)',
    palette: { K: '#10002b', P: '#7b2cbf', R: '#ff2a55', W: '#ffffff' },
    shinyPalette: { K: '#10002b', P: '#4361ee', R: '#00f5d4', W: '#ffffff' },
    grid: [
      '.KK..KKKKKK..KK.','KPPKKPPPPPPKKPPK','.KPPPPPPPPPPPPK.','.KPPWWKPPKWWPPK.',
      '.KPPPPPPPPPPPPK.','..KPPRRRRRRPPK..','...KPPPPPPPPK...','KKK..KPPPPK..KKK',
      'KPPK..KPPK..KPPK','.KK....KK....KK.','................','................',
      '................','................','................','................'
    ]
  },
  {
    id: 20, code: 'gengar', name: 'เก็งการ์ (GENGAR)', type: 'ghost',
    rarity: 'epic', stage: 3, maxStage: 4, chainIds: [18, 19, 20, 21],
    baseHp: 88, baseAtk: 28, baseDef: 20, baseSpd: 26, catchRate: 0.20,
    evolvesTo: 21, evolveLevel: 19,
    moves: ['shadowBall', 'psychic', 'sleepPowder', 'lick'],
    desc: 'ร่างที่ 3/4: โปเกมอนเงามืดจอมซน ยังวิวัฒนาการสู่ร่างเมก้ามิติมืดได้อีก! (Evo Lv.19)',
    palette: { K: '#10002b', P: '#5a189a', S: '#3c096c', R: '#ff2a55', W: '#ffffff' },
    shinyPalette: { K: '#10002b', P: '#adb5bd', S: '#6c757d', R: '#ff0055', W: '#ffffff' },
    grid: [
      '.KK...K..K...KK.','.KPK.KPKKPK.KPK.','..KPPKPPPPKPPK..','..KPPPPPPPPPPK..',
      '.KPPPPPPPPPPPPK.','.KPPRKPPPPKRPPK.','KPPPRRKPPKRRPPPK','KPPPPPPPPPPPPPPK',
      'KPPPWWWWWWWWPPPK','KPPPWKWKKWKWPPPK','.KPPPWWWWWWPPPK.','.KPPPPPPPPPPPSK.',
      '..KSSSSSSSSSSK..','..KSSK....KSSK..','..KKKK....KKKK..','................'
    ]
  },
  {
    id: 21, code: 'megagengar', name: 'เมก้าเก็งการ์ (MEGA GENGAR)', type: 'ghost',
    rarity: 'legendary', stage: 4, maxStage: 4, chainIds: [18, 19, 20, 21],
    baseHp: 118, baseAtk: 39, baseDef: 26, baseSpd: 34, catchRate: 0.08,
    evolvesTo: null, evolveLevel: null,
    moves: ['abyssCurse', 'shadowBall', 'psychic', 'sleepPowder'],
    desc: 'ร่างที่ 4/4 (Legendary): เมก้าเก็งการ์ผู้เปิดดวงตาที่สามกลางหน้าผาก เชื่อมต่อกับมิติวิญญาณ!',
    palette: { K: '#10002b', P: '#3c096c', S: '#f72585', Y: '#ffea00', R: '#ff0055', W: '#ffffff' },
    shinyPalette: { K: '#10002b', P: '#f8f9fa', S: '#ff006e', Y: '#00f5d4', R: '#7209b7', W: '#ffffff' },
    grid: [
      'K..K..K..K..K..K','KPKKPKKPPKKPKKPK','.KPPPPYYYYPPPPK.','.KPPPPYKKYPPPPK.',
      'KPPPRKPPPPKRPPPK','KPPPRRKPPKRRPPPK','KPPPWWWWWWWWPPPK','KPPPWKWKKWKWPPPK',
      'KSSSSWWWWWWSSSSK','KSSSSSSSSSSSSSSK','.KSSSSK..KSSSSK.','.KKKKKK..KKKKKK.',
      '................','................','................','................'
    ]
  },

  // ==========================================================================
  // FAMILY 6: 5-STAGE CELESTIAL DRAGONITE LINE (#22 -> #23 -> #24 -> #25 -> #26)
  // ==========================================================================
  {
    id: 22, code: 'dragoegg', name: 'ดราโก้เอ้ก (DRAGO-EGG)', type: 'dragon',
    rarity: 'rare', stage: 1, maxStage: 5, chainIds: [22, 23, 24, 25, 26],
    baseHp: 46, baseAtk: 15, baseDef: 14, baseSpd: 14, catchRate: 0.42,
    evolvesTo: 23, evolveLevel: 6,
    moves: ['dragonBreath', 'bubble', 'tackle', 'quickAttack'],
    desc: 'ร่างที่ 1/5 (Rare): ไข่มังกรโบราณที่มีเกล็ดสีฟ้าครามและเขาเล็กๆ โผล่ออกมา (วิวัฒนาการ 5 ร่าง!)',
    palette: { K: '#1d3557', B: '#48cae4', Y: '#ffd166', W: '#ffffff' },
    shinyPalette: { K: '#4a154b', B: '#ff70a6', Y: '#ffea00', W: '#ffffff' },
    grid: [
      '......KKKK......','....KKYYYYKK....','...KBBBBBBBBK...','..KBBWWWWWWBBK..',
      '..KBWWKBBKWWBK..','.KBBBBBBBBBBBBK.','.KBBBBYYYYBBBBK.','.KBBBBYYYYBBBBK.',
      '..KBBBBBBBBBBK..','...KBBBBBBBBK...','....KKKKKKKK....','................',
      '................','................','................','................'
    ]
  },
  {
    id: 23, code: 'dratini', name: 'มินิริว (DRATINI)', type: 'dragon',
    rarity: 'rare', stage: 2, maxStage: 5, chainIds: [22, 23, 24, 25, 26],
    baseHp: 58, baseAtk: 18, baseDef: 15, baseSpd: 17, catchRate: 0.34,
    evolvesTo: 24, evolveLevel: 10,
    moves: ['dragonBreath', 'aquaTail', 'thunderbolt', 'quickAttack'],
    desc: 'ร่างที่ 2/5 (Rare): มังกรน้อยในตำนาน เติบโตด้วยการลอกคราบ (Evo Lv.10)',
    palette: { K: '#1d3557', B: '#4ea8de', S: '#2ec4b6', W: '#ffffff' },
    shinyPalette: { K: '#4a154b', B: '#ff70a6', S: '#ff9770', W: '#ffffff' },
    grid: [
      '..KK........KK..','.KWWK.KKKK.KWWK.','.KWWKKBBBBKKWWK.','..KKKBBWWBBKKK..',
      '....KBKBBKBK....','....KBBWWBBK....','....KBBWWBBK....','.....KBBBBK.....',
      '.....KBBWWK.....','....KBBBWWK.KKK.','...KBBBWWK.KBBBK','...KBBWWK..KBBK.',
      '...KBBWWKKKBBK..','....KBBBWWWWK...','.....KKKKKKKK...','................'
    ]
  },
  {
    id: 24, code: 'dragonair', name: 'ฮาคุริว (DRAGONAIR)', type: 'dragon',
    rarity: 'epic', stage: 3, maxStage: 5, chainIds: [22, 23, 24, 25, 26],
    baseHp: 78, baseAtk: 23, baseDef: 20, baseSpd: 22, catchRate: 0.22,
    evolvesTo: 25, evolveLevel: 15,
    moves: ['dragonBreath', 'aquaTail', 'thunderbolt', 'outrage'],
    desc: 'ร่างที่ 3/5 (Epic): มังกรสวรรค์ผู้สง่างาม มีลูกแก้วคริสตัลควบคุมลมฟ้าอากาศ (Evo Lv.15)',
    palette: { K: '#1d3557', B: '#0096c7', W: '#ffffff', Y: '#ffd166' },
    shinyPalette: { K: '#4a154b', B: '#ff5d8f', W: '#ffffff', Y: '#ffd166' },
    grid: [
      '.KKK...KK...KKK.','KWWWK.KBBK.KWWWK','.KWWKKBBBBKKWWK.','..KKKBBBBBBKKK..',
      '....KBWBBWBK....','.....KBBBBK.....','.....KBYBBK.....','....KBBWWBBK....',
      '...KBBBWWBBBK...','...KBBWWKBBWWK..','....KBBWWBBWWK..','.....KKKKKKKK...',
      '................','................','................','................'
    ]
  },
  {
    id: 25, code: 'dragonite', name: 'ไคริว (DRAGONITE)', type: 'dragon',
    rarity: 'legendary', stage: 4, maxStage: 5, chainIds: [22, 23, 24, 25, 26],
    baseHp: 106, baseAtk: 32, baseDef: 27, baseSpd: 25, catchRate: 0.12,
    evolvesTo: 26, evolveLevel: 21,
    moves: ['outrage', 'dragonBreath', 'thunderbolt', 'hyperBeam'],
    desc: 'ร่างที่ 4/5 (Legendary): มังกรผู้พิทักษ์ท้องทะเล ยังจุติเป็นร่างจักรพรรดิมังกรได้อีก! (Evo Lv.21)',
    palette: { K: '#1e1b18', O: '#f4a261', Y: '#ffe6a7', T: '#2a9d8f', W: '#ffffff' },
    shinyPalette: { K: '#1e1b18', O: '#55a630', Y: '#d8f3dc', T: '#7209b7', W: '#ffffff' },
    grid: [
      '....KYKKKKYK....','...KOOOOOOOOOK..','..KKOWKOOOKWOKK.','.KTTKOOOOOOOOOTK',
      'KTTTKOOYYYYOOTTK','KTTKOOYYYYYYOOTK','.KK.KOOYYYYOOKK.','....KOOYYYYOOK..',
      '....KOOOOOOOOOK.','....KOOOK..KOOK.','....KKKK...KKKK.','................',
      '................','................','................','................'
    ]
  },
  {
    id: 26, code: 'bahamutdragonite', name: 'บาฮามุทไคริว (CELESTIAL DRAGONITE)', type: 'dragon',
    rarity: 'mythic', stage: 5, maxStage: 5, chainIds: [22, 23, 24, 25, 26],
    baseHp: 142, baseAtk: 44, baseDef: 35, baseSpd: 34, catchRate: 0.05,
    evolvesTo: null, evolveLevel: null,
    moves: ['dracoMeteor', 'outrage', 'godThunder', 'hyperBeam'],
    desc: 'ร่างที่ 5/5 (Mythic): จักรพรรดิมังกรสวรรค์ 4 ปีกทองคำ! เรียกฝนดาวตกดราโก้มีเทียถล่มศัตรู!',
    palette: { K: '#14213d', O: '#ffbe0b', Y: '#ffffff', T: '#00f5d4', R: '#ff006e', W: '#ffffff' },
    shinyPalette: { K: '#10002b', O: '#c77dff', Y: '#ffea00', T: '#ff006e', R: '#00f5d4', W: '#ffffff' },
    grid: [
      'YY..KYKKKKYK..YY','YTTKOOOOOOOOOKTY','KTTTKWRKOOKRWTKK','KTTTKOOOOOOOOOTK',
      'YTTTKOOYYYYOOTTY','KTTKOOYYYYYYOOTK','YTT.KOOYYYYOOKTY','....KOOYYYYOOK..',
      '....KOOOOOOOOOK.','....KTTTK..KTTK.','....KKKK...KKKK.','................',
      '................','................','................','................'
    ]
  },

  // ==========================================================================
  // FAMILY 7: 4-STAGE LEVIATHAN GYARADOS LINE (#27 -> #28 -> #29 -> #30)
  // ==========================================================================
  {
    id: 27, code: 'magikarp', name: 'โค่ยคิง (MAGIKARP)', type: 'water',
    rarity: 'common', stage: 1, maxStage: 4, chainIds: [27, 28, 29, 30],
    baseHp: 40, baseAtk: 10, baseDef: 15, baseSpd: 18, catchRate: 0.65,
    evolvesTo: 28, evolveLevel: 8,
    moves: ['splash', 'tackle', 'bubble', 'quickAttack'],
    desc: 'ร่างที่ 1/4: ปลาคาร์ปจอมดิ้นดุ๊กดิ๊ก ถ้าอดทนฝึกถึง Lv.8 จะกลายร่างเป็นมังกรสมุทร!',
    palette: { K: '#1e1b18', O: '#ff5400', Y: '#ffd166', W: '#ffffff' },
    shinyPalette: { K: '#1e1b18', O: '#ffd166', Y: '#fff3b0', W: '#ffffff' },
    grid: [
      '.....KKKKKK.....','....KYYYYYYK....','...KKOOOOOOKK...','..KOOOOOOOOOOKWW',
      '.KOWWOOOOOOOOKWW','.KOWKOOOOOOOOOKW','..KOOOOOOOOOOKWW','...KKOOOOOOKK...',
      '....KYYYYYYK....','.....KKKKKK.....','................','................',
      '................','................','................','................'
    ]
  },
  {
    id: 28, code: 'gyarados', name: 'เกียราดอส (GYARADOS)', type: 'water',
    rarity: 'epic', stage: 2, maxStage: 4, chainIds: [27, 28, 29, 30],
    baseHp: 100, baseAtk: 30, baseDef: 24, baseSpd: 23, catchRate: 0.16,
    evolvesTo: 29, evolveLevel: 15,
    moves: ['hydroPump', 'outrage', 'aquaTail', 'hyperBeam'],
    desc: 'ร่างที่ 2/4 (Epic): มังกรสมุทรผู้เกรี้ยวกราด พัฒนาต่อสู่ร่างเมก้าและลีไวอาธานได้! (Evo Lv.15)',
    palette: { K: '#1d3557', B: '#0077b6', Y: '#fff3b0', R: '#e63946', W: '#ffffff' },
    shinyPalette: { K: '#4a0e17', B: '#d90429', Y: '#ffd166', R: '#ffbe0b', W: '#ffffff' },
    grid: [
      '..KKK..KKK..KKK.','.KWWWKBBBBBKWWWK','.KBBBBBRRBBBBBBK','..KBBWRBBBBBYYK.',
      '...KBBBBBBBBYYK.','..KBBBBYYK..KK..','.KBBBBBYYK..KBBK','.KBBYYBBK..KBBYK',
      '..KBBYYBBBBBBYK.','...KKKKKKKKKKK..','................','................',
      '................','................','................','................'
    ]
  },
  {
    id: 29, code: 'megagyarados', name: 'เมก้าเกียราดอส (MEGA GYARADOS)', type: 'water',
    rarity: 'legendary', stage: 3, maxStage: 4, chainIds: [27, 28, 29, 30],
    baseHp: 124, baseAtk: 38, baseDef: 30, baseSpd: 28, catchRate: 0.08,
    evolvesTo: 30, evolveLevel: 21,
    moves: ['tidalCannon', 'hydroPump', 'outrage', 'hyperBeam'],
    desc: 'ร่างที่ 3/4 (Legendary): เมก้าเกียราดอสครีบยักษ์ พุ่งทะยานด้วยความเร็วเหนือเสียงใต้น้ำ! (Evo Lv.21)',
    palette: { K: '#10002b', B: '#023e8a', Y: '#ffbe0b', R: '#d90429', W: '#ffffff' },
    shinyPalette: { K: '#10002b', B: '#9b0000', Y: '#ffffff', R: '#ffea00', W: '#ffffff' },
    grid: [
      'R.KKK..KKK..KKKR','RKYYYKBBBBBKYYYR','.KBBBBBRRBBBBBBK','..KBBWRBBBBBYYK.',
      'RR.KBBBBBBBBYYK.','.RKBBBBYYK..KK..','.KBBBBBYYK..KBBK','.KBBYYBBK..KBBYK',
      '..KBBYYBBBBBBYK.','...KKKKKKKKKKK..','................','................',
      '................','................','................','................'
    ]
  },
  {
    id: 30, code: 'leviathangyarados', name: 'ลีไวอาธาน (LEVIATHAN GYARADOS)', type: 'water',
    rarity: 'mythic', stage: 4, maxStage: 4, chainIds: [27, 28, 29, 30],
    baseHp: 148, baseAtk: 45, baseDef: 36, baseSpd: 33, catchRate: 0.04,
    evolvesTo: null, evolveLevel: null,
    moves: ['tidalCannon', 'dracoMeteor', 'hydroPump', 'hyperBeam'],
    desc: 'ร่างที่ 4/4 (Mythic): ราชันย์มังกรสมุทรลีไวอาธาน! ควบคุมพายุไซโคลนและคลื่นยักษ์ทั้งเจ็ดคาบสมุทร!',
    palette: { K: '#03045e', B: '#00f5d4', Y: '#ffea00', R: '#ff006e', W: '#ffffff' },
    shinyPalette: { K: '#240046', B: '#ffbe0b', Y: '#ffffff', R: '#00f5d4', W: '#ffffff' },
    grid: [
      'YYKKK..KKK..KKKY','YKWWWKBBBBBKWWWY','RKBBBBBRRBBBBBBK','R.KBBWRBBBBBYYK.',
      'YY.KBBBBBBBBYYK.','.YKBBBBYYK..KKY.','.KBBBBBYYK..KBBK','.KBBYYBBK..KBBYK',
      '..KBBYYBBBBBBYK.','...KKKKKKKKKKK..','................','................',
      '................','................','................','................'
    ]
  },

  // ==========================================================================
  // FAMILY 8: 5-STAGE COSMIC MEW MYTHIC LINE (#31 -> #32 -> #33 -> #34 -> #35)
  // ==========================================================================
  {
    id: 31, code: 'mewspore', name: 'มิวเบบี้ (MEW-SPORE)', type: 'psychic',
    rarity: 'epic', stage: 1, maxStage: 5, chainIds: [31, 32, 33, 34, 35],
    baseHp: 56, baseAtk: 19, baseDef: 18, baseSpd: 20, catchRate: 0.25,
    evolvesTo: 32, evolveLevel: 8,
    moves: ['confusion', 'fairyWind', 'sing', 'psychic'],
    desc: 'ร่างที่ 1/5 (Epic): ตัวอ่อนพลังงานจิตบริสุทธิ์ ลอยตัวอยู่ในฟองออร่าสีชมพู (วิวัฒนาการ 5 ร่าง!)',
    palette: { K: '#2b193d', P: '#ffc8dd', B: '#4cc9f0', W: '#ffffff' },
    shinyPalette: { K: '#1d3557', P: '#90e0ef', B: '#ff006e', W: '#ffffff' },
    grid: [
      '....KKKKKKKK....','..KKPPPPPPPPKK..','.KPPPPPPPPPPPPK.','.KPPWWBPPBWWPPK.',
      '.KPPWBBPPBBWPPK.','.KPPPPPPPPPPPPK.','..KPPPPPPPPPPK..','...KPPPPPPPPK...',
      '....KKKKKKKK....','................','................','................',
      '................','................','................','................'
    ]
  },
  {
    id: 32, code: 'mew', name: 'มิว (MEW)', type: 'psychic',
    rarity: 'legendary', stage: 2, maxStage: 5, chainIds: [31, 32, 33, 34, 35],
    baseHp: 85, baseAtk: 26, baseDef: 24, baseSpd: 27, catchRate: 0.15,
    evolvesTo: 33, evolveLevel: 13,
    moves: ['psychic', 'moonblast', 'thunderbolt', 'flamethrower'],
    desc: 'ร่างที่ 2/5 (Legendary): โปเกมอนมายาผู้มีพันธุกรรมต้นกำเนิด วิวัฒนาการสู่ร่างมิวทูได้! (Evo Lv.13)',
    palette: { K: '#2b193d', P: '#ff99c8', S: '#ff5d8f', B: '#3a86ff', W: '#ffffff' },
    shinyPalette: { K: '#1d3557', P: '#72efdd', S: '#4ea8de', B: '#ff006e', W: '#ffffff' },
    grid: [
      '..KK......KK....','.KPPK....KPPK...','.KPPPKKKKPPPK...','..KPPPPPPPPK..KK',
      '..KPPBPPPPBPK.KP','..KPPWKPPKWPK.KP','...KPPPPPPPPK..K','....KPPPPPPK...K',
      '...KPPPPPPK...K.','...KPPPPPPK..K..','..KSSPPPPSSKK...','..KSSPPPPSSK....',
      '...KPK..KPK.....','..KPPK..KPPK....','..KKK....KKK....','................'
    ]
  },
  {
    id: 33, code: 'mewtwo', name: 'มิวทู (MEWTWO)', type: 'psychic',
    rarity: 'legendary', stage: 3, maxStage: 5, chainIds: [31, 32, 33, 34, 35],
    baseHp: 108, baseAtk: 35, baseDef: 26, baseSpd: 31, catchRate: 0.10,
    evolvesTo: 34, evolveLevel: 18,
    moves: ['psystrike', 'psychic', 'shadowBall', 'thunderbolt'],
    desc: 'ร่างที่ 3/5 (Legendary): สุดยอดโปเกมอนพลังจิตผู้ทรงปัญญาและพลังทำลายล้างสูง! (Evo Lv.18)',
    palette: { K: '#240046', P: '#e0aaff', M: '#9d4edd', R: '#ff006e', W: '#ffffff' },
    shinyPalette: { K: '#1b4332', P: '#d8f3dc', M: '#52b788', R: '#ffbe0b', W: '#ffffff' },
    grid: [
      '..KKK....KKK....','.KPPPK..KPPPK...','..KPPKKKKPPK....','..KPPPPPPPPK....',
      '..KPRWPPWRPK....','...KPPPPPPK..KK.','..KPPPPPPPPKKMMK','.KPPPMMMMPPPKMMK',
      '..KKKMMMMMMMKK..','....KMMMMMMK....','...KPPPPPPPPK...','...KPPK..KPPK...',
      '...KKKK..KKKK...','................','................','................'
    ]
  },
  {
    id: 34, code: 'megamewtwo', name: 'เมก้ามิวทู Y (MEGA MEWTWO Y)', type: 'psychic',
    rarity: 'mythic', stage: 4, maxStage: 5, chainIds: [31, 32, 33, 34, 35],
    baseHp: 128, baseAtk: 42, baseDef: 30, baseSpd: 37, catchRate: 0.06,
    evolvesTo: 35, evolveLevel: 24,
    moves: ['psystrike', 'genesisSuper', 'shadowBall', 'fireBlast'],
    desc: 'ร่างที่ 4/5 (Mythic): เมก้ามิวทูผู้ลอยตัวเหนือแรงโน้มถ่วง! ยังจุติสู่ร่างเทพมายาสูงสุดได้อีก! (Evo Lv.24)',
    palette: { K: '#240046', P: '#f8f9fa', M: '#7209b7', R: '#ff0055', W: '#ffffff' },
    shinyPalette: { K: '#1b4332', P: '#ffffff', M: '#38b000', R: '#ff006e', W: '#ffffff' },
    grid: [
      '..KKKKKKKKKKK...','.KMMMMMMMMMMMK..','KMMKPPPPPPPKMMK.','KMKPPPPPPPPPKMK.',
      '.KKPRWPPPWRPKK..','...KPPPPPPPK....','....KMMMMMK.....','...KPPPPPPPK....',
      '...KMMMMMMMK....','....KPPKPPK.....','....KKKKKKK.....','................',
      '................','................','................','................'
    ]
  },
  {
    id: 35, code: 'cosmicmew', name: 'อาร์เซอุส-มิว (COSMIC MEW GOD)', type: 'psychic',
    rarity: 'mythic', stage: 5, maxStage: 5, chainIds: [31, 32, 33, 34, 35],
    baseHp: 160, baseAtk: 50, baseDef: 40, baseSpd: 42, catchRate: 0.03,
    evolvesTo: null, evolveLevel: null,
    moves: ['genesisSuper', 'psystrike', 'dracoMeteor', 'godThunder'],
    desc: 'ร่างที่ 5/5 (Mythic สูงสุด!): เทพมายาผู้ถือครองวงแหวนจักรวาลทองคำ พลังโจมตีสูงสุดในโลกโปเกมอน!',
    palette: { K: '#10002b', P: '#ffffff', Y: '#ffea00', B: '#00f5d4', R: '#ff006e', W: '#ffffff' },
    shinyPalette: { K: '#000000', P: '#ffd166', Y: '#ff006e', B: '#7209b7', R: '#00f5d4', W: '#ffffff' },
    grid: [
      '.YY..KKKKKK..YY.','YYYYKPPPPPPKYYYY','.YYKPPPPPPPPKYY.','..KPPBBPPBBPPK..',
      '.YKPPRWPPWRPPKY.','YY.KPPPPPPPPK.YY','.YY.KYYYYYYK.YY.','..YYKPPPPPPKYY..',
      '...KPPPPPPPPK...','..KBBPPPPPPBBK..','...KPPK..KPPK...','...KKKK..KKKK...',
      '................','................','................','................'
    ]
  },

  // ==========================================================================
  // FAMILY 9: 3-STAGE MULTI-BRANCH EEVEE -> VAPOREON/JOLTEON/FLAREON -> CELESTIAL EEVEE
  // ==========================================================================
  {
    id: 36, code: 'eevee', name: 'อีวุย (EEVEE)', type: 'normal',
    rarity: 'rare', stage: 1, maxStage: 3, chainIds: [36, 37, 38, 39, 40],
    baseHp: 55, baseAtk: 16, baseDef: 14, baseSpd: 16, catchRate: 0.38,
    evolvesTo: [37, 38, 39], evolveLevel: 8,
    moves: ['quickAttack', 'tackle', 'bodySlam', 'fairyWind'],
    desc: 'ร่างที่ 1/3 (Rare): เลือกวิวัฒนาการได้ 3 ธาตุที่ Lv.8 และไปต่อถึงร่างเทพธาตุที่ Lv.16!',
    palette: { K: '#22181c', B: '#c98a5b', D: '#7f4f24', F: '#fff3d6', W: '#ffffff' },
    shinyPalette: { K: '#22181c', B: '#d8e2dc', D: '#6c757d', F: '#ffffff', W: '#ffffff' },
    grid: [
      '.KK..........KK.','KDDK........KDDK','KDDDK......KDDDK','.KBBBK....KBBBK.',
      '..KBBBBBBBBBBK..','..KBBBBBBBBBBK..','..KBWKBBBBKWBK..','..KBKKBBBBKKBK..',
      '...KBBBBBBBBK...','..KFFFFFFFFFFK..','.KFFFFFFFFFFFFK.','..KKFFFFFFFFKKF.',
      '...KBBBBBBBBKFFK','...KBBK..KBBKKK.','...KKKK..KKKK...','................'
    ]
  },
  {
    id: 37, code: 'vaporeon', name: 'ชาวเวอร์ส (VAPOREON)', type: 'water',
    rarity: 'epic', stage: 2, maxStage: 3, chainIds: [36, 37, 38, 39, 40],
    baseHp: 94, baseAtk: 24, baseDef: 22, baseSpd: 21, catchRate: 0.20,
    evolvesTo: 40, evolveLevel: 16,
    moves: ['hydroPump', 'aquaTail', 'waterGun', 'quickAttack'],
    desc: 'ร่างที่ 2/3 (Epic): ร่างธาตุน้ำของอีวุย วิวัฒนาการต่อเป็นเซเลสเทียลอีวุยที่ Lv.16!',
    palette: { K: '#1d3557', B: '#48cae4', D: '#0077b6', Y: '#fff3b0', W: '#ffffff' },
    shinyPalette: { K: '#4a154b', B: '#c77dff', D: '#7b2cbf', Y: '#ffd6ff', W: '#ffffff' },
    grid: [
      '.KK....KK....KK.','KYYK..KDDK..KYYK','.KYYKKBBBBKKYYK.','..KBBBBBBBBBBK..',
      '..KBWKBBBBKWBK..','...KBBBBBBBBK...','..KWWWWWWWWWWK..','..KBBBBBBBBBBK.K',
      '..KBBBBBBBBBBKKB','...KBBBBBBBBKBBK','...KBBK..KBBKKK.','...KKKK..KKKK...',
      '................','................','................','................'
    ]
  },
  {
    id: 38, code: 'jolteon', name: 'ธันเดอร์ส (JOLTEON)', type: 'electric',
    rarity: 'epic', stage: 2, maxStage: 3, chainIds: [36, 37, 38, 39, 40],
    baseHp: 84, baseAtk: 26, baseDef: 19, baseSpd: 29, catchRate: 0.20,
    evolvesTo: 40, evolveLevel: 16,
    moves: ['voltTackle', 'thunderbolt', 'thunderShock', 'quickAttack'],
    desc: 'ร่างที่ 2/3 (Epic): ร่างธาตุไฟฟ้าของอีวุย วิวัฒนาการต่อเป็นเซเลสเทียลอีวุยที่ Lv.16!',
    palette: { K: '#1e1b18', Y: '#ffea00', S: '#f48c06', W: '#ffffff' },
    shinyPalette: { K: '#1e1b18', Y: '#80ed99', S: '#38b000', W: '#ffffff' },
    grid: [
      '.KK..........KK.','KYYK........KYYK','.KYYKKKKKKKKYYK.','..KYYYYYYYYYYK..',
      '..KYWKYYYYKWYK..','...KYYYYYYYYK...','.KKWWWWWWWWWWKK.','KWWWWWWWWWWWWWWK',
      '.KKYYYYYYYYYYKK.','..KYYYYYYYYYYK..','...KYYK..KYYK...','...KKKK..KKKK...',
      '................','................','................','................'
    ]
  },
  {
    id: 39, code: 'flareon', name: 'บูสเตอร์ (FLAREON)', type: 'fire',
    rarity: 'epic', stage: 2, maxStage: 3, chainIds: [36, 37, 38, 39, 40],
    baseHp: 88, baseAtk: 28, baseDef: 20, baseSpd: 21, catchRate: 0.20,
    evolvesTo: 40, evolveLevel: 16,
    moves: ['fireBlast', 'flamethrower', 'ember', 'bodySlam'],
    desc: 'ร่างที่ 2/3 (Epic): ร่างธาตุไฟของอีวุย วิวัฒนาการต่อเป็นเซเลสเทียลอีวุยที่ Lv.16!',
    palette: { K: '#1e1b18', O: '#ff5400', Y: '#ffd166', W: '#ffffff' },
    shinyPalette: { K: '#1e1b18', O: '#e0a96d', Y: '#fff3b0', W: '#ffffff' },
    grid: [
      '.KK....KKK...KK.','KOOK..KYYYK.KOOK','.KOOKKYYYYYKOOK.','..KOOOOOOOOOOK..',
      '..KOWKOOOOKWOK..','...KOOOOOOOOOK..','..KYYYYYYYYYYK..','.KYYYYYYYYYYYYK.',
      '..KOOOOOOOOOOKYY','...KOOOOOOOOOKY.','...KOOK..KOOK...','...KKKK..KKKK...',
      '................','................','................','................'
    ]
  },
  {
    id: 40, code: 'celestialeevee', name: 'เซเลสเทียลอีวุย (CELESTIAL EEVEE)', type: 'fairy',
    rarity: 'mythic', stage: 3, maxStage: 3, chainIds: [36, 37, 38, 39, 40],
    baseHp: 135, baseAtk: 40, baseDef: 33, baseSpd: 36, catchRate: 0.05,
    evolvesTo: null, evolveLevel: null,
    moves: ['moonblast', 'blueFlare', 'godThunder', 'tidalCannon'],
    desc: 'ร่างที่ 3/3 (Mythic): ร่างจุติแห่งดวงดาวของอีวุย! ใช้พลังไฟ น้ำ ไฟฟ้า และแสงแฟรี่พร้อมกัน!',
    palette: { K: '#240046', P: '#ff70a6', Y: '#ffea00', B: '#00f5d4', W: '#ffffff' },
    shinyPalette: { K: '#10002b', P: '#ffd166', Y: '#ffffff', B: '#ff006e', W: '#ffffff' },
    grid: [
      '.KK...YYYY...KK.','KBBK..KYYK..KBBK','.KBBKKPPPPKKBBK.','..KPPPPPPPPPPK..',
      '..KPWKPPPPKWPK..','...KPPPPPPPPK...','.KKYYYYYYYYYYKK.','KWWBBBBBBBBBBWWK',
      '.KKPPPPPPPPPPKKB','...KPPPPPPPPKBBK','...KPPK..KPPKKK.','...KKKK..KKKK...',
      '................','................','................','................'
    ]
  }
];

// ============================================================================
// PIXEL ART TRAINER & POKEBALL SPRITES
// ============================================================================
const TRAINER_SPRITE = {
  palette: {
    K: '#1a1c2c',
    R: '#e63946',
    W: '#ffffff',
    F: '#ffcdb2',
    B: '#1d3557',
    H: '#3d2c2e'
  },
  down: [
    '....KKKKKKKK....','...KRRRRRRRRK...','..KRRRWWWWWRRK..','..KHHHHHHHHHHK..',
    '..KHFFKFFKFFHK..','..KHFFFFFFFFHK..','...KKKKKKKKKK...','..KWWWRRRRWWWK..',
    '..KFFKRRRRKFFK..','...KKKBBBBKKK...','....KBBBBBBK....','....KBBKKBBK....',
    '....KKKK.KKKK...'
  ]
};

const POKEBALL_SPRITES = {
  pokeball: {
    palette: { K: '#1a1c2c', T: '#ff2a55', H: '#ff8fa3', W: '#ffffff', G: '#adb5bd' },
    grid: [
      '....KKKK....','..KKTTTTKK..','.KTTHHTTTTK.','KTTTTTTTTTTK','KTTTTTTTTTTK',
      'KKKKKWWKKKKK','KWWWWWWGWWWK','KWWWWWWWWWWK','.KWWWWWWWWK.','..KKWWWWKK..','....KKKK....'
    ]
  },
  greatball: {
    palette: { K: '#1a1c2c', T: '#0077b6', H: '#ff2a55', W: '#ffffff', G: '#adb5bd' },
    grid: [
      '....KKKK....','..KKTTTTKK..','.KHHTTTTHHK.','KHTTTTTTTTHK','KTTTTTTTTTTK',
      'KKKKKWWKKKKK','KWWWWWWGWWWK','KWWWWWWWWWWK','.KWWWWWWWWK.','..KKWWWWKK..','....KKKK....'
    ]
  },
  ultraball: {
    palette: { K: '#1a1c2c', T: '#2b2d42', H: '#ffd166', W: '#ffffff', G: '#adb5bd' },
    grid: [
      '....KKKK....','..KKHTTHKK..','.KTTHHTTHHTK','KTTHTTTTTHTK','KTTTTTTTTTTK',
      'KKKKKWWKKKKK','KWWWWWWGWWWK','KWWWWWWWWWWK','.KWWWWWWWWK.','..KKWWWWKK..','....KKKK....'
    ]
  },
  masterball: {
    palette: { K: '#1a1c2c', T: '#7209b7', H: '#f72585', W: '#ffffff', G: '#adb5bd' },
    grid: [
      '....KKKK....','..KKTTTTKK..','.KHHTTTTHHK.','KHTWTWTWTTHK','KTTTTTTTTTTK',
      'KKKKKWWKKKKK','KWWWWWWGWWWK','KWWWWWWWWWWK','.KWWWWWWWWK.','..KKWWWWKK..','....KKKK....'
    ]
  }
};

function getPokemonPixelImgHTML(codeOrId, isShiny = false, scale = 5, extraClass = '', flipX = false) {
  const poke = POKEMON_DB.find(p => p.code === codeOrId || p.id === codeOrId) || POKEMON_DB[0];
  const pal = isShiny ? poke.shinyPalette : poke.palette;
  const key = `poke_${poke.code}_${isShiny ? 'shiny' : 'norm'}`;
  const url = PixelRenderer.getDataURL(key, poke.grid, pal, scale, flipX);
  return `<img src="${url}" class="pixel-img ${extraClass}" alt="${poke.name}" draggable="false" />`;
}

function getPokeballPixelImgHTML(ballType = 'pokeball', scale = 3) {
  const b = POKEBALL_SPRITES[ballType] || POKEBALL_SPRITES.pokeball;
  const url = PixelRenderer.getDataURL(`ball_${ballType}`, b.grid, b.palette, scale, false);
  return `<img src="${url}" class="pixel-img" alt="${ballType}" draggable="false" />`;
}

function getPokemonCanvasSprite(codeOrId, isShiny = false, scale = 3) {
  const poke = POKEMON_DB.find(p => p.code === codeOrId || p.id === codeOrId) || POKEMON_DB[0];
  const pal = isShiny ? poke.shinyPalette : poke.palette;
  const key = `poke_${poke.code}_${isShiny ? 'shiny' : 'norm'}`;
  return PixelRenderer.getCanvas(key, poke.grid, pal, scale, false);
}

function getTrainerCanvasSprite(scale = 2) {
  return PixelRenderer.getCanvas('trainer_down', TRAINER_SPRITE.down, TRAINER_SPRITE.palette, scale, false);
}
