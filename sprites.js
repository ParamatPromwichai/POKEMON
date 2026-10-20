// ============================================================================
// PIXEL ART ENGINE & 30 POKÉMON SPRITE MATRICES (With Full Evolution Chains!)
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
// MOVES & ELEMENTAL TYPES
// ============================================================================
const MOVES_DB = {
  splash:      { name: 'ดิ้นดุ๊กดิ๊ก (Splash)', type: 'water', power: 15, acc: 100, vfx: 'water' },
  tackle:      { name: 'พุ่งชน (Tackle)', type: 'normal', power: 40, acc: 100, vfx: 'impact' },
  quickAttack: { name: 'โจมตีไว (Quick Atk)', type: 'normal', power: 45, acc: 100, vfx: 'slash' },
  bodySlam:    { name: 'ทุ่มสุดตัว (Body Slam)', type: 'normal', power: 75, acc: 95, vfx: 'impact', status: 'paralyze', chance: 0.3 },
  hyperBeam:   { name: 'ไฮเปอร์บีม (Hyper Beam)', type: 'normal', power: 100, acc: 90, vfx: 'sparkle' },
  thunderShock:{ name: 'ช็อตไฟฟ้า (ThunderShock)', type: 'electric', power: 45, acc: 100, vfx: 'electric', status: 'paralyze', chance: 0.25 },
  thunderbolt: { name: 'ไฟฟ้าแสนโวลต์ (Thunderbolt)', type: 'electric', power: 75, acc: 95, vfx: 'electric', status: 'paralyze', chance: 0.3 },
  voltTackle:  { name: 'โวลต์แทคเคิล (Volt Tackle)', type: 'electric', power: 95, acc: 95, vfx: 'electric', status: 'paralyze', chance: 0.35 },
  vineWhip:    { name: 'เถาวัลย์ฟาด (Vine Whip)', type: 'grass', power: 45, acc: 100, vfx: 'leaf' },
  razorLeaf:   { name: 'ใบมีดโกน (Razor Leaf)', type: 'grass', power: 65, acc: 95, vfx: 'leaf' },
  solarBeam:   { name: 'โซลาร์บีม (Solar Beam)', type: 'grass', power: 95, acc: 95, vfx: 'leaf' },
  sleepPowder: { name: 'ผงนิทรา (Sleep Powder)', type: 'grass', power: 0, acc: 85, vfx: 'powder', status: 'sleep', chance: 1.0 },
  ember:       { name: 'ลูกไฟเล็ก (Ember)', type: 'fire', power: 45, acc: 100, vfx: 'fire' },
  flamethrower:{ name: 'พ่นไฟ (Flamethrower)', type: 'fire', power: 75, acc: 95, vfx: 'fire' },
  fireBlast:   { name: 'ไฟบรรลัยกัลป์ (Fire Blast)', type: 'fire', power: 100, acc: 90, vfx: 'fire' },
  bubble:      { name: 'ฟองสบู่ (Bubble)', type: 'water', power: 40, acc: 100, vfx: 'water' },
  waterGun:    { name: 'ปืนฉีดน้ำ (Water Gun)', type: 'water', power: 55, acc: 100, vfx: 'water' },
  aquaTail:    { name: 'หางคลื่นน้ำ (Aqua Tail)', type: 'water', power: 75, acc: 95, vfx: 'water' },
  hydroPump:   { name: 'ไฮโดรปั๊ม (Hydro Pump)', type: 'water', power: 100, acc: 90, vfx: 'water' },
  sing:        { name: 'ร้องเพลงกล่อม (Sing)', type: 'fairy', power: 0, acc: 85, vfx: 'music', status: 'sleep', chance: 1.0 },
  fairyWind:   { name: 'ลมภูตแฟรี่ (Fairy Wind)', type: 'fairy', power: 55, acc: 100, vfx: 'sparkle' },
  moonblast:   { name: 'มูนบลาสต์ (Moonblast)', type: 'fairy', power: 90, acc: 100, vfx: 'sparkle' },
  lick:        { name: 'ลิ้นผีเลีย (Lick)', type: 'ghost', power: 40, acc: 100, vfx: 'shadow', status: 'paralyze', chance: 0.35 },
  shadowBall:  { name: 'ชาโดว์บอล (Shadow Ball)', type: 'ghost', power: 80, acc: 100, vfx: 'shadow' },
  dragonBreath:{ name: 'ลมหายใจมังกร (DragonBreath)', type: 'dragon', power: 65, acc: 100, vfx: 'dragon', status: 'paralyze', chance: 0.25 },
  outrage:     { name: 'มังกรพิโรธ (Outrage)', type: 'dragon', power: 100, acc: 95, vfx: 'dragon' },
  confusion:   { name: 'คลื่นพลังจิต (Confusion)', type: 'psychic', power: 55, acc: 100, vfx: 'psychic' },
  psychic:     { name: 'ไซโคคิเนซิส (Psychic)', type: 'psychic', power: 90, acc: 100, vfx: 'psychic' }
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
// 30 HANDCRAFTED 16x16 PIXEL ART POKÉMON WITH EVOLUTION CHAINS
// ============================================================================
const POKEMON_DB = [
  // --- #01 - #03: BULBASAUR LINE ---
  {
    id: 1, code: 'bulba', name: 'ฟุชิกิดาเนะ (BULBASAUR)', type: 'grass',
    baseHp: 54, baseAtk: 14, baseDef: 14, baseSpd: 13, catchRate: 0.45,
    evolvesTo: 2, evolveLevel: 8,
    moves: ['vineWhip', 'tackle', 'sleepPowder', 'razorLeaf'],
    desc: 'โปเกมอนเมล็ดพันธุ์ มีดอกไม้ตูมสีเขียวสดอยู่บนหลังมาตั้งแต่เกิด (วิวัฒนาการที่ Lv.8)',
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
    id: 2, code: 'ivysaur', name: 'ฟุชิกิโซ (IVYSAUR)', type: 'grass',
    baseHp: 72, baseAtk: 19, baseDef: 19, baseSpd: 16, catchRate: 0.30,
    evolvesTo: 3, evolveLevel: 14,
    moves: ['razorLeaf', 'vineWhip', 'sleepPowder', 'solarBeam'],
    desc: 'ดอกไม้ตูมสีชมพูบนหลังเริ่มบานออก ส่งกลิ่นหอมหวานไปทั่วทุ่งหญ้า (วิวัฒนาการที่ Lv.14)',
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
    id: 3, code: 'venusaur', name: 'ฟุชิกิบานะ (VENUSAUR)', type: 'grass',
    baseHp: 98, baseAtk: 26, baseDef: 26, baseSpd: 20, catchRate: 0.18,
    evolvesTo: null, evolveLevel: null,
    moves: ['solarBeam', 'razorLeaf', 'sleepPowder', 'bodySlam'],
    desc: 'ร่างสุดยอด! ดอกไม้ยักษ์บนหลังรับแสงอาทิตย์เพื่อเปลี่ยนเป็นพลังงานมหาศาล',
    palette: { K: '#1b262c', P: '#e63946', Y: '#ffd166', G: '#2b9348', B: '#2ec4b6', R: '#ff2a55', W: '#ffffff' },
    shinyPalette: { K: '#1b262c', P: '#ff9f1c', Y: '#fff3b0', G: '#80ed99', B: '#70e000', R: '#ff2a55', W: '#ffffff' },
    grid: [
      '.KKKKKKKKKKKKKK.','KPPPPYYPPPPYYPPK','KPPPPPPPPPPPPPPK','.KKKKGGGGGGKKKK.',
      'KGGGGGGYYGGGGGGK','KBBBBBBBBBBBBBBK','KBWRKBBBBBBKRWBK','KBRRKBBBBBBKRRBK',
      'KBBBBBBBBBBBBBBK','KBBBKKKKKKKKBBBK','KBBBBBBBBBBBBBBK','KBBBBBBBBBBBBBBK',
      '.KBBBKBBBBKBBBK.','.KKKKK....KKKKK.','................','................'
    ]
  },

  // --- #04 - #06: CHARMANDER LINE ---
  {
    id: 4, code: 'charmander', name: 'ฮิโตะคาเงะ (CHARMANDER)', type: 'fire',
    baseHp: 50, baseAtk: 17, baseDef: 12, baseSpd: 17, catchRate: 0.45,
    evolvesTo: 5, evolveLevel: 8,
    moves: ['ember', 'quickAttack', 'flamethrower', 'tackle'],
    desc: 'กิ้งก่าไฟตัวน้อย เปลวไฟที่ปลายหางบอกถึงพลังชีวิตที่ลุกโชน (วิวัฒนาการที่ Lv.8)',
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
    id: 5, code: 'charmeleon', name: 'ลิซาร์โดะ (CHARMELEON)', type: 'fire',
    baseHp: 68, baseAtk: 22, baseDef: 16, baseSpd: 21, catchRate: 0.30,
    evolvesTo: 6, evolveLevel: 14,
    moves: ['flamethrower', 'ember', 'quickAttack', 'dragonBreath'],
    desc: 'มีเขาแหลมบนหัวและกรงเล็บคมกริบ เปลวไฟที่หางร้อนแรงขึ้นกว่าเดิม (วิวัฒนาการที่ Lv.14)',
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
    id: 6, code: 'charizard', name: 'ลิซาร์ดอน (CHARIZARD)', type: 'fire',
    baseHp: 95, baseAtk: 29, baseDef: 22, baseSpd: 26, catchRate: 0.16,
    evolvesTo: null, evolveLevel: null,
    moves: ['fireBlast', 'flamethrower', 'dragonBreath', 'hyperBeam'],
    desc: 'ร่างสุดยอด! มังกรเพลิงกางปีกบินเหนือท้องฟ้า พ่นไฟหลอมละลายหินผาได้ในพริบตา',
    palette: { K: '#1e1b18', O: '#ff6b35', T: '#0077b6', C: '#ffe6a7', R: '#ff0000', Y: '#ffea00', W: '#ffffff' },
    shinyPalette: { K: '#1e1b18', O: '#2b2d42', T: '#d90429', C: '#adb5bd', R: '#00b4d8', Y: '#90e0ef', W: '#ffffff' },
    grid: [
      '.KK..KKKKKK..KK.','KTTKKOOOOOOKKTTK','KTTTKOOOOOOKTTTK','KTTTKOWKOOKWTTTK',
      'KTTTKOOOOOOOTTTK','KTTKKOOCCCCOOKTK','.KK.KCCCCCCCCK.R','....KCCCCCCCCKRY',
      '...KOOCCCCCCOKRY','...KOOCCCCCCOKRR','...KOOOOOOOOOKK.','...KOOOOOOOOOK..',
      '...KOOK...KOOK..','...KKKK...KKKK..','................','................'
    ]
  },

  // --- #07 - #09: SQUIRTLE LINE ---
  {
    id: 7, code: 'squirtle', name: 'เซนิกาเมะ (SQUIRTLE)', type: 'water',
    baseHp: 54, baseAtk: 14, baseDef: 17, baseSpd: 13, catchRate: 0.45,
    evolvesTo: 8, evolveLevel: 8,
    moves: ['bubble', 'tackle', 'waterGun', 'aquaTail'],
    desc: 'เต่าน้อยกระดองแข็งแรง พ่นน้ำแรงดันสูงออกจากปากได้อย่างแม่นยำ (วิวัฒนาการที่ Lv.8)',
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
    id: 8, code: 'wartortle', name: 'คาเมล (WARTORTLE)', type: 'water',
    baseHp: 72, baseAtk: 18, baseDef: 22, baseSpd: 16, catchRate: 0.30,
    evolvesTo: 9, evolveLevel: 14,
    moves: ['waterGun', 'aquaTail', 'bubble', 'bodySlam'],
    desc: 'มีหูและหางปุยสีขาวเหมือนฟองคลื่น เป็นสัญลักษณ์แห่งอายุยืนยาว (วิวัฒนาการที่ Lv.14)',
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
    id: 9, code: 'blastoise', name: 'คาเม็กซ์ (BLASTOISE)', type: 'water',
    baseHp: 98, baseAtk: 25, baseDef: 28, baseSpd: 19, catchRate: 0.16,
    evolvesTo: null, evolveLevel: null,
    moves: ['hydroPump', 'aquaTail', 'waterGun', 'hyperBeam'],
    desc: 'ร่างสุดยอด! มีปืนใหญ่แรงดันน้ำคู่บนกระดอง ยิงทะลุแผ่นเหล็กหนาได้สบาย',
    palette: { K: '#1b262c', B: '#005f73', G: '#adb5bd', Y: '#ffe599', M: '#7f4f24', W: '#ffffff' },
    shinyPalette: { K: '#1b262c', B: '#5a189a', G: '#ffd166', Y: '#ffe599', M: '#2b9348', W: '#ffffff' },
    grid: [
      '.KKKK.KKKK.KKKK.','KGGGGKBBBBKGGGGK','KGGGKBBBBBBKGGGK','.KKKBWKBBKWBKKK.',
      '..KMMMMMMMMMMK..','.KMMYYYYYYYYMMK.','KMMMYYYYYYYYMMMK','KBBBYYKYYKYYBBBK',
      'KBBBYYYYYYYYBBBK','.KMMYYYYYYYYMMK.','.KBBBBBBBBBBBBK.','..KBBBK..KBBBK..',
      '..KKKKK..KKKKK..','................','................','................'
    ]
  },

  // --- #10 - #12: PICHU -> PIKACHU -> RAICHU ---
  {
    id: 10, code: 'pichu', name: 'พิชู (PICHU)', type: 'electric',
    baseHp: 42, baseAtk: 13, baseDef: 10, baseSpd: 16, catchRate: 0.55,
    evolvesTo: 11, evolveLevel: 6,
    moves: ['thunderShock', 'quickAttack', 'sing', 'tackle'],
    desc: 'ลูกหนูไฟฟ้าตัวจิ๋ว เวลาตกใจหรือหัวเราะจะเผลอช็อตไฟใส่ตัวเอง (วิวัฒนาการที่ Lv.6)',
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
    id: 11, code: 'pikachu', name: 'พิกะจู (PIKACHU)', type: 'electric',
    baseHp: 56, baseAtk: 17, baseDef: 13, baseSpd: 20, catchRate: 0.42,
    evolvesTo: 12, evolveLevel: 12,
    moves: ['thunderbolt', 'thunderShock', 'quickAttack', 'voltTackle'],
    desc: 'หนูไฟฟ้าแก้มแดงสุดน่ารัก ชาร์จพลังไฟฟ้าไว้ในแก้มทั้งสองข้าง (วิวัฒนาการที่ Lv.12)',
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
    id: 12, code: 'raichu', name: 'ไรจู (RAICHU)', type: 'electric',
    baseHp: 88, baseAtk: 26, baseDef: 20, baseSpd: 26, catchRate: 0.22,
    evolvesTo: null, evolveLevel: null,
    moves: ['voltTackle', 'thunderbolt', 'quickAttack', 'hyperBeam'],
    desc: 'ร่างพัฒนาของพิกะจู หางยาวรูปสายฟ้าช่วยคายประจุไฟฟ้าแรงสูงลงพื้นดินได้',
    palette: { K: '#1e1b18', O: '#f48c06', Y: '#ffd166', C: '#fff3b0', W: '#ffffff' },
    shinyPalette: { K: '#1e1b18', O: '#d90429', Y: '#ffbe0b', C: '#ffe5d9', W: '#ffffff' },
    grid: [
      '.KKK........KKK.','KYYYK......KYYYK','.KOOOKKKKKKOOOK.','..KOOOOOOOOOOK..',
      '..KOWKOOOOKWOK..','..KYYOOOOOOYYK..','...KOOOOOOOOOK.K','..KOOCCCCCCOOOKY',
      '.KOOCCCCCCCCOOKY','..KOOCCCCCCOOOK.','...KOOOOOOOOOK..','...KOOOKKOOOK...',
      '...KKKK..KKKK...','................','................','................'
    ]
  },

  // --- #13 - #16: EEVEE & 3 EEVEELUTIONS ---
  {
    id: 13, code: 'eevee', name: 'อีวุย (EEVEE)', type: 'normal',
    baseHp: 55, baseAtk: 16, baseDef: 14, baseSpd: 16, catchRate: 0.38,
    evolvesTo: [14, 15, 16], evolveLevel: 10,
    moves: ['quickAttack', 'tackle', 'bodySlam', 'fairyWind'],
    desc: 'มีรหัสพันธุกรรมพิเศษ เลือกวิวัฒนาการได้ 3 ธาตุ: น้ำ / ไฟฟ้า / ไฟ! (Lv.10)',
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
    id: 14, code: 'vaporeon', name: 'ชาวเวอร์ส (VAPOREON)', type: 'water',
    baseHp: 96, baseAtk: 24, baseDef: 22, baseSpd: 21, catchRate: 0.20,
    evolvesTo: null, evolveLevel: null,
    moves: ['hydroPump', 'aquaTail', 'waterGun', 'quickAttack'],
    desc: 'ร่างวิวัฒนาการธาตุน้ำของอีวุย มีครีบหูสีครีมและสามารถละลายหายไปในผืนน้ำได้',
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
    id: 15, code: 'jolteon', name: 'ธันเดอร์ส (JOLTEON)', type: 'electric',
    baseHp: 84, baseAtk: 26, baseDef: 19, baseSpd: 29, catchRate: 0.20,
    evolvesTo: null, evolveLevel: null,
    moves: ['voltTackle', 'thunderbolt', 'thunderShock', 'quickAttack'],
    desc: 'ร่างวิวัฒนาการธาตุไฟฟ้าของอีวุย ขนแหลมคมดุจเข็มสายฟ้า รวดเร็วปานสายฟ้าแลบ',
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
    id: 16, code: 'flareon', name: 'บูสเตอร์ (FLAREON)', type: 'fire',
    baseHp: 88, baseAtk: 28, baseDef: 20, baseSpd: 21, catchRate: 0.20,
    evolvesTo: null, evolveLevel: null,
    moves: ['fireBlast', 'flamethrower', 'ember', 'bodySlam'],
    desc: 'ร่างวิวัฒนาการธาตุไฟของอีวุย มีแผงคอและหางฟูฟ่องที่มีอุณหภูมิสูงถึง 900 องศา',
    palette: { K: '#1e1b18', O: '#ff5400', Y: '#ffd166', W: '#ffffff' },
    shinyPalette: { K: '#1e1b18', O: '#e0a96d', Y: '#fff3b0', W: '#ffffff' },
    grid: [
      '.KK....KKK...KK.','KOOK..KYYYK.KOOK','.KOOKKYYYYYKOOK.','..KOOOOOOOOOOK..',
      '..KOWKOOOOKWOK..','...KOOOOOOOOOK..','..KYYYYYYYYYYK..','.KYYYYYYYYYYYYK.',
      '..KOOOOOOOOOOKYY','...KOOOOOOOOOKY.','...KOOK..KOOK...','...KKKK..KKKK...',
      '................','................','................','................'
    ]
  },

  // --- #17 - #19: GASTLY -> HAUNTER -> GENGAR ---
  {
    id: 17, code: 'gastly', name: 'โกส (GASTLY)', type: 'ghost',
    baseHp: 46, baseAtk: 17, baseDef: 11, baseSpd: 17, catchRate: 0.45,
    evolvesTo: 18, evolveLevel: 8,
    moves: ['lick', 'shadowBall', 'sleepPowder', 'confusion'],
    desc: 'โปเกมอนแก๊สวิญญาณ ร่างกาย 95% เป็นหมอกพิษสีม่วงเรืองแสง (วิวัฒนาการที่ Lv.8)',
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
    id: 18, code: 'haunter', name: 'โกสท์ (HAUNTER)', type: 'ghost',
    baseHp: 64, baseAtk: 23, baseDef: 15, baseSpd: 21, catchRate: 0.30,
    evolvesTo: 19, evolveLevel: 14,
    moves: ['shadowBall', 'lick', 'psychic', 'sleepPowder'],
    desc: 'มีมือลอยแยกออกจากลำตัว ชอบแอบซ่อนในความมืดแล้วสะกิดไหล่ผู้คน (วิวัฒนาการที่ Lv.14)',
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
    id: 19, code: 'gengar', name: 'เก็งการ์ (GENGAR)', type: 'ghost',
    baseHp: 88, baseAtk: 28, baseDef: 20, baseSpd: 26, catchRate: 0.20,
    evolvesTo: null, evolveLevel: null,
    moves: ['shadowBall', 'psychic', 'sleepPowder', 'lick'],
    desc: 'ร่างสุดยอด! โปเกมอนเงามืดที่ชอบยิ้มกว้างแกล้งหลอกในคืนพระจันทร์เต็มดวง',
    palette: { K: '#10002b', P: '#5a189a', S: '#3c096c', R: '#ff2a55', W: '#ffffff' },
    shinyPalette: { K: '#10002b', P: '#adb5bd', S: '#6c757d', R: '#ff0055', W: '#ffffff' },
    grid: [
      '.KK...K..K...KK.','.KPK.KPKKPK.KPK.','..KPPKPPPPKPPK..','..KPPPPPPPPPPK..',
      '.KPPPPPPPPPPPPK.','.KPPRKPPPPKRPPK.','KPPPRRKPPKRRPPPK','KPPPPPPPPPPPPPPK',
      'KPPPWWWWWWWWPPPK','KPPPWKWKKWKWPPPK','.KPPPWWWWWWPPPK.','.KPPPPPPPPPPPSK.',
      '..KSSSSSSSSSSK..','..KSSK....KSSK..','..KKKK....KKKK..','................'
    ]
  },

  // --- #20 - #22: DRATINI -> DRAGONAIR -> DRAGONITE ---
  {
    id: 20, code: 'dratini', name: 'มินิริว (DRATINI)', type: 'dragon',
    baseHp: 54, baseAtk: 17, baseDef: 14, baseSpd: 16, catchRate: 0.35,
    evolvesTo: 21, evolveLevel: 9,
    moves: ['dragonBreath', 'aquaTail', 'thunderbolt', 'quickAttack'],
    desc: 'มังกรน้อยในตำนาน เติบโตด้วยการลอกคราบและมีพลังลึกลับซ่อนอยู่ (วิวัฒนาการที่ Lv.9)',
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
    id: 21, code: 'dragonair', name: 'ฮาคุริว (DRAGONAIR)', type: 'dragon',
    baseHp: 74, baseAtk: 22, baseDef: 19, baseSpd: 21, catchRate: 0.24,
    evolvesTo: 22, evolveLevel: 15,
    moves: ['dragonBreath', 'aquaTail', 'thunderbolt', 'outRage' in MOVES_DB ? 'outRage' : 'outrage'],
    desc: 'มังกรสวรรค์ผู้สง่างาม มีลูกแก้วคริสตัลที่คอซึ่งควบคุมสภาพอากาศได้ (วิวัฒนาการที่ Lv.15)',
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
    id: 22, code: 'dragonite', name: 'ไคริว (DRAGONITE)', type: 'dragon',
    baseHp: 105, baseAtk: 31, baseDef: 26, baseSpd: 24, catchRate: 0.14,
    evolvesTo: null, evolveLevel: null,
    moves: ['outrage', 'dragonBreath', 'thunderbolt', 'hyperBeam'],
    desc: 'ร่างสุดยอด! มังกรใจดีแต่ทรงพลังมหาศาล บินรอบโลกได้ในเวลาเพียง 16 ชั่วโมง!',
    palette: { K: '#1e1b18', O: '#f4a261', Y: '#ffe6a7', T: '#2a9d8f', W: '#ffffff' },
    shinyPalette: { K: '#1e1b18', O: '#55a630', Y: '#d8f3dc', T: '#7209b7', W: '#ffffff' },
    grid: [
      '....KYKKKKYK....','...KOOOOOOOOOK..','..KKOWKOOOKWOKK.','.KTTKOOOOOOOOOTK',
      'KTTTKOOYYYYOOTTK','KTTKOOYYYYYYOOTK','.KK.KOOYYYYOOKK.','....KOOYYYYOOK..',
      '....KOOOOOOOOOK.','....KOOOK..KOOK.','....KKKK...KKKK.','................',
      '................','................','................','................'
    ]
  },

  // --- #23 - #24: MAGIKARP -> GYARADOS ---
  {
    id: 23, code: 'magikarp', name: 'โค่ยคิง (MAGIKARP)', type: 'water',
    baseHp: 40, baseAtk: 10, baseDef: 15, baseSpd: 18, catchRate: 0.65,
    evolvesTo: 24, evolveLevel: 10,
    moves: ['splash', 'tackle', 'bubble', 'quickAttack'],
    desc: 'ปลาคาร์ปจอมดิ้นดุ๊กดิ๊ก ดูอ่อนแอแต่ถ้าฝึกจนถึง Lv.10 จะกลายร่างเป็นมังกรน้ำสุดโหด!',
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
    id: 24, code: 'gyarados', name: 'เกียราดอส (GYARADOS)', type: 'water',
    baseHp: 102, baseAtk: 30, baseDef: 24, baseSpd: 23, catchRate: 0.15,
    evolvesTo: null, evolveLevel: null,
    moves: ['hydroPump', 'outrage', 'aquaTail', 'hyperBeam'],
    desc: 'ร่างวิวัฒนาการของโค่ยคิง! มังกรสมุทรผู้เกรี้ยวกราด พลังโจมตีรุนแรงระดับตำนาน!',
    palette: { K: '#1d3557', B: '#0077b6', Y: '#fff3b0', R: '#e63946', W: '#ffffff' },
    shinyPalette: { K: '#4a0e17', B: '#d90429', Y: '#ffd166', R: '#ffbe0b', W: '#ffffff' },
    grid: [
      '..KKK..KKK..KKK.','.KWWWKBBBBBKWWWK','.KBBBBBRRBBBBBBK','..KBBWRBBBBBYYK.',
      '...KBBBBBBBBYYK.','..KBBBBYYK..KK..','.KBBBBBYYK..KBBK','.KBBYYBBK..KBBYK',
      '..KBBYYBBBBBBYK.','...KKKKKKKKKKK..','................','................',
      '................','................','................','................'
    ]
  },

  // --- #25 - #26: JIGGLYPUFF -> WIGGLYTUFF ---
  {
    id: 25, code: 'jiggly', name: 'พูริน (JIGGLYPUFF)', type: 'fairy',
    baseHp: 66, baseAtk: 13, baseDef: 13, baseSpd: 12, catchRate: 0.48,
    evolvesTo: 26, evolveLevel: 10,
    moves: ['sing', 'fairyWind', 'bodySlam', 'tackle'],
    desc: 'ตัวกลมปุ๊กปิ๊ก เมื่อร้องเพลงกล่อม ใครได้ยินก็จะเคลิ้มหลับทันที (วิวัฒนาการที่ Lv.10)',
    palette: { K: '#22223b', P: '#ff9ebb', S: '#ff6b9d', B: '#00b4d8', W: '#ffffff' },
    shinyPalette: { K: '#22223b', P: '#ffc8dd', S: '#ffafcc', B: '#38b000', W: '#ffffff' },
    grid: [
      '..KK........KK..','.KPPK..KK..KPPK.','.KPPPKKPPKKPPPK.','..KPPPPPPPPPPK..',
      '.KPPPPPKKPPPPPK.','KPPPPPPPPPPPPPPK','KPPWWBPPPPBWWPPK','KPPWBBPPPPBBWPPK',
      'KPPPBBPPPPBBPPPK','KPPPPPPKKPPPPPPK','KKPPPPPPPPPPPPKK','.KPPPPPPPPPPPPSK',
      '..KSSSSSSSSSSSK.','...KSSK..KSSK...','...KKKK..KKKK...','................'
    ]
  },
  {
    id: 26, code: 'wigglytuff', name: 'พูคุริน (WIGGLYTUFF)', type: 'fairy',
    baseHp: 96, baseAtk: 22, baseDef: 21, baseSpd: 17, catchRate: 0.24,
    evolvesTo: null, evolveLevel: null,
    moves: ['moonblast', 'sing', 'bodySlam', 'hyperBeam'],
    desc: 'ร่างพัฒนาของพูริน หูยาวเหมือนกระต่าย ขนนุ่มฟูละเอียดราวกับปุยเมฆชั้นดี',
    palette: { K: '#22223b', P: '#ff758f', W: '#ffffff', B: '#00b4d8' },
    shinyPalette: { K: '#22223b', P: '#c77dff', W: '#ffffff', B: '#38b000' },
    grid: [
      '..KKK......KKK..','.KPPPK....KPPPK.','.KPPPKKKKKKPPPK.','..KPPPPPPPPPPK..',
      '.KPPWWBPPBWWPPK.','KPPPWBBPPBBWPPPK','KPPPPWWWWWWPPPPK','KPPPWWWWWWWWPPPK',
      '.KPPWWWWWWWWPPK.','..KPPPPPPPPPPK..','...KPPK..KPPK...','...KKKK..KKKK...',
      '................','................','................','................'
    ]
  },

  // --- #27 - #28: PSYDUCK -> GOLDUCK ---
  {
    id: 27, code: 'psyduck', name: 'โคดัก (PSYDUCK)', type: 'water',
    baseHp: 55, baseAtk: 15, baseDef: 13, baseSpd: 13, catchRate: 0.45,
    evolvesTo: 28, evolveLevel: 11,
    moves: ['waterGun', 'confusion', 'tackle', 'aquaTail'],
    desc: 'เป็ดน้อยขี้ปวดหัว ถ้าปวดหัวมากๆ จะปล่อยคลื่นพลังจิตออกมา! (วิวัฒนาการที่ Lv.11)',
    palette: { K: '#1e1b18', Y: '#ffd166', S: '#f4a261', B: '#ffedd8', W: '#ffffff' },
    shinyPalette: { K: '#1e1b18', Y: '#4cc9f0', S: '#4361ee', B: '#ffe5ec', W: '#ffffff' },
    grid: [
      '......K.K.K.....','.....KKKKKKK....','...KKYYYYYYYKK..','..KYYYYYYYYYYYK.',
      '.KYYWWKYYYKWWYYK','.KYYWKKYYYKKWYYK','..KYYBBBBBBBYYK.','..KYYBBBBBBBYYK.',
      '..KYYYBBBBBYYYK.','.KYYYYYYYYYYYYYK','.KYYYYYYYYYYYYSK','..KYYYYYYYYYYSK.',
      '..KSSSSSSSSSSK..','...KBBK..KBBK...','...KKKK..KKKK...','................'
    ]
  },
  {
    id: 28, code: 'golduck', name: 'โกลดัก (GOLDUCK)', type: 'water',
    baseHp: 88, baseAtk: 25, baseDef: 22, baseSpd: 24, catchRate: 0.24,
    evolvesTo: null, evolveLevel: null,
    moves: ['hydroPump', 'psychic', 'aquaTail', 'confusion'],
    desc: 'ร่างพัฒนาของโคดัก อัญมณีสีแดงบนหน้าผากจะส่องประกายเมื่อใช้พลังจิตเต็มพิกัด',
    palette: { K: '#1d3557', B: '#0077b6', Y: '#ffe599', R: '#e63946', W: '#ffffff' },
    shinyPalette: { K: '#1d3557', B: '#4361ee', Y: '#ffccd5', R: '#ff006e', W: '#ffffff' },
    grid: [
      '...KK.KKKK.KK...','..KBBBBBBBBBBK..','..KBBBBRRBBBBK..','..KBWKBBBBKWBK..',
      '...KBBYYYYBBK...','..KBBBBBBBBBBK..','.KBBBBBBBBBBBBK.','..KBBBBBBBBBBK..',
      '...KBBBBBBBBK...','...KBBK..KBBK...','...KKKK..KKKK...','................',
      '................','................','................','................'
    ]
  },

  // --- #29: SNORLAX & #30: MEW ---
  {
    id: 29, code: 'snorlax', name: 'คาบีก้อน (SNORLAX)', type: 'normal',
    baseHp: 110, baseAtk: 26, baseDef: 24, baseSpd: 10, catchRate: 0.22,
    evolvesTo: null, evolveLevel: null,
    moves: ['bodySlam', 'hyperBeam', 'flamethrower', 'shadowBall'],
    desc: 'กินอาหารวันละ 400 กิโลกรัม พออิ่มปุ๊บก็จะหลับปุ๋ยขวางถนนทันที พลังชีวิตสูงที่สุด!',
    palette: { K: '#14213d', T: '#2b5876', C: '#faedcd', F: '#d4a373', W: '#ffffff' },
    shinyPalette: { K: '#14213d', T: '#1d3557', C: '#fff8e8', F: '#e07a5f', W: '#ffffff' },
    grid: [
      '..KKK......KKK..','..KTTKKKKKKTTK..','..KTTCCCCCCCTK..','..KTCCKKCKKCCTK.',
      '..KTCCCCCCCCCTK.','.KTTTCCCCCCCTTTK','KTTTCCCCCCCCCTTK','KTTCCCCCCCCCCCTK',
      'KTTCCCCCCCCCCCTK','KTTCCCCCCCCCCCTK','KTTTCCCCCCCCCTTK','.KTTTCCCCCCCTTTK',
      '.KWWKTTTTTTKWWK.','KWFFWKTTTTKWFFWK','KWWWWK....KWWWWK','.KKKK......KKKK.'
    ]
  },
  {
    id: 30, code: 'mew', name: 'มิว (MEW)', type: 'psychic',
    baseHp: 95, baseAtk: 28, baseDef: 26, baseSpd: 28, catchRate: 0.15,
    evolvesTo: null, evolveLevel: null,
    moves: ['psychic', 'moonblast', 'thunderbolt', 'fireBlast'],
    desc: 'โปเกมอนมายาในตำนานลำดับที่ 30 มีพันธุกรรมของโปเกมอนทุกชนิดและทรงพลังสุดๆ!',
    palette: { K: '#2b193d', P: '#ff99c8', S: '#ff5d8f', B: '#3a86ff', W: '#ffffff' },
    shinyPalette: { K: '#1d3557', P: '#72efdd', S: '#4ea8de', B: '#ff006e', W: '#ffffff' },
    grid: [
      '..KK......KK....','.KPPK....KPPK...','.KPPPKKKKPPPK...','..KPPPPPPPPK..KK',
      '..KPPBPPPPBPK.KP','..KPPWKPPKWPK.KP','...KPPPPPPPPK..K','....KPPPPPPK...K',
      '...KPPPPPPK...K.','...KPPPPPPK..K..','..KSSPPPPSSKK...','..KSSPPPPSSK....',
      '...KPK..KPK.....','..KPPK..KPPK....','..KKK....KKK....','................'
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
