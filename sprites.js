// ============================================================================
// PIXEL ART ENGINE & SPRITE MATRICES (100% Handcrafted Crisp Pixel Art)
// ============================================================================

// Helper: Render a 2D pixel string grid onto an offscreen canvas or data URL
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
// POKÉMON DATABASE (12 Cute Pixel Art Monsters + Moves + Base Stats)
// ============================================================================
const MOVES_DB = {
  tackle:      { name: 'พุ่งชน (Tackle)', type: 'normal', power: 40, acc: 100, vfx: 'impact' },
  quickAttack: { name: 'โจมตีไว (Quick Atk)', type: 'normal', power: 45, acc: 100, vfx: 'slash' },
  thunderShock:{ name: 'ช็อตไฟฟ้า (ThunderShock)', type: 'electric', power: 45, acc: 100, vfx: 'electric', status: 'paralyze', chance: 0.25 },
  thunderbolt: { name: 'ไฟฟ้าแสนโวลต์ (Thunderbolt)', type: 'electric', power: 75, acc: 95, vfx: 'electric', status: 'paralyze', chance: 0.3 },
  vineWhip:    { name: 'เถาวัลย์ฟาด (Vine Whip)', type: 'grass', power: 45, acc: 100, vfx: 'leaf' },
  razorLeaf:   { name: 'ใบมีดโกน (Razor Leaf)', type: 'grass', power: 65, acc: 95, vfx: 'leaf' },
  sleepPowder: { name: 'ผงนิทรา (Sleep Powder)', type: 'grass', power: 0, acc: 85, vfx: 'powder', status: 'sleep', chance: 1.0 },
  ember:       { name: 'ลูกไฟเล็ก (Ember)', type: 'fire', power: 45, acc: 100, vfx: 'fire' },
  flamethrower:{ name: 'พ่นไฟ (Flamethrower)', type: 'fire', power: 75, acc: 95, vfx: 'fire' },
  bubble:      { name: 'ฟองสบู่ (Bubble)', type: 'water', power: 40, acc: 100, vfx: 'water' },
  waterGun:    { name: 'ปืนฉีดน้ำ (Water Gun)', type: 'water', power: 55, acc: 100, vfx: 'water' },
  aquaTail:    { name: 'หางคลื่นน้ำ (Aqua Tail)', type: 'water', power: 75, acc: 90, vfx: 'water' },
  sing:        { name: 'ร้องเพลงกล่อม (Sing)', type: 'fairy', power: 0, acc: 80, vfx: 'music', status: 'sleep', chance: 1.0 },
  fairyWind:   { name: 'ลมภูตแฟรี่ (Fairy Wind)', type: 'fairy', power: 50, acc: 100, vfx: 'sparkle' },
  bodySlam:    { name: 'ทุ่มสุดตัว (Body Slam)', type: 'normal', power: 70, acc: 95, vfx: 'impact', status: 'paralyze', chance: 0.3 },
  shadowBall:  { name: 'ชาโดว์บอล (Shadow Ball)', type: 'ghost', power: 75, acc: 100, vfx: 'shadow' },
  lick:        { name: 'ลิ้นผีเลีย (Lick)', type: 'ghost', power: 35, acc: 100, vfx: 'shadow', status: 'paralyze', chance: 0.35 },
  dragonBreath:{ name: 'ลมหายใจมังกร (DragonBreath)', type: 'dragon', power: 65, acc: 100, vfx: 'dragon', status: 'paralyze', chance: 0.25 },
  confusion:   { name: 'คลื่นพลังจิต (Confusion)', type: 'psychic', power: 55, acc: 100, vfx: 'psychic' },
  psychic:     { name: 'ไซโคคิเนซิส (Psychic)', type: 'psychic', power: 85, acc: 100, vfx: 'psychic' }
};

// Type Chart
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

// 16x16 Handcrafted Cute Pixel Art Sprites
const POKEMON_DB = [
  {
    id: 1,
    code: 'pikachu',
    name: 'พิกะจู (PIKACHU)',
    type: 'electric',
    baseHp: 52,
    baseAtk: 16,
    baseDef: 12,
    baseSpd: 18,
    catchRate: 0.45,
    moves: ['thunderShock', 'quickAttack', 'thunderbolt', 'tackle'],
    desc: 'หนูไฟฟ้าแก้มแดง เวลาดีใจจะปล่อยประจุไฟฟ้าปิ๊บๆ ออกมาจากแก้มทั้งสองข้าง',
    palette: {
      K: '#1e1b18', // Outline
      Y: '#ffdd33', // Main Yellow
      S: '#e6a800', // Shade Yellow
      R: '#ff3b3b', // Red Cheek
      W: '#ffffff'  // Eye shine
    },
    shinyPalette: {
      K: '#1e1b18',
      Y: '#ff9f1c',
      S: '#d97706',
      R: '#ff2a55',
      W: '#ffffff'
    },
    grid: [
      '..KK........KK..',
      '.KKKK......KKKK.',
      '.KKYYK....KYYKK.',
      '..KYYYK..KYYYK..',
      '...KYYYYYYYYK...',
      '..KYYYYYYYYYYK..',
      '..KYKWYYYYWKYK..',
      '..KYKKYYYYKKYK..',
      '.KRYRYYYYYYRYRK.',
      '.KRRYYYYKYYYYRRK',
      '..KYYYYYYYYYYK.K',
      '..KYYYSYYYYYYKKY',
      '..KYYYYYYYYYYKYY',
      '...KYYYYYYYYKKS.',
      '...KSSK..KSSK...',
      '...KKK....KKK...'
    ]
  },
  {
    id: 2,
    code: 'bulba',
    name: 'ฟุชิกิดาเนะ (BULBASAUR)',
    type: 'grass',
    baseHp: 58,
    baseAtk: 14,
    baseDef: 15,
    baseSpd: 13,
    catchRate: 0.42,
    moves: ['vineWhip', 'tackle', 'sleepPowder', 'razorLeaf'],
    desc: 'โปเกมอนเมล็ดพันธุ์ มีดอกไม้ตูมสีเขียวสดอยู่บนหลังมาตั้งแต่เกิด',
    palette: {
      K: '#1b262c',
      G: '#38b000', // Bulb green
      D: '#007200', // Bulb shade
      B: '#57cc99', // Body teal-green
      S: '#2b9348', // Spots
      R: '#e63946', // Red eyes
      W: '#ffffff'
    },
    shinyPalette: {
      K: '#1b262c',
      G: '#ffd166',
      D: '#f4a261',
      B: '#aacc00',
      S: '#55a630',
      R: '#e63946',
      W: '#ffffff'
    },
    grid: [
      '......KKKK......',
      '....KKGGGGKK....',
      '...KGGGGGGGDK...',
      '..KPKGGGGGGDDK..',
      '.KBBKKKKKKKKDDK.',
      '.KBBBBBBBBBBGDK.',
      'KBBBBBBBBBBBBGK.',
      'KBWRKBBBBKRWBSSK',
      'KBRRKBBBBKRRBSBK',
      'KBBBBBBBBBBBBBBK',
      'KBBBKKKKKKBBBBBK',
      '.KBBBBBBBBBSSBK.',
      '.KBBBBBBBBBBBBK.',
      '..KBBKBBBKBBKBK.',
      '..KKKK...KKKKKK.',
      '................'
    ]
  },
  {
    id: 3,
    code: 'charmander',
    name: 'ฮิโตะคาเงะ (CHARMANDER)',
    type: 'fire',
    baseHp: 50,
    baseAtk: 18,
    baseDef: 11,
    baseSpd: 17,
    catchRate: 0.40,
    moves: ['ember', 'quickAttack', 'flamethrower', 'tackle'],
    desc: 'กิ้งก่าไฟตัวน้อย เปลวไฟที่ปลายหางบอกถึงพลังชีวิตที่ลุกโชน',
    palette: {
      K: '#1e1b18',
      O: '#ff6b35', // Orange body
      S: '#d94e1f', // Shade
      C: '#ffe6a7', // Cream belly
      R: '#ff2a2a', // Fire outer
      Y: '#ffea00', // Fire inner
      W: '#ffffff'
    },
    shinyPalette: {
      K: '#1e1b18',
      O: '#ffbe0b',
      S: '#fb8500',
      C: '#fff3b0',
      R: '#3a86ff',
      Y: '#8ecae6',
      W: '#ffffff'
    },
    grid: [
      '....KKKKKK......',
      '...KOOOOOOK.....',
      '..KOOOOOOOOK....',
      '..KOWKOOOKWOK...',
      '..KOKKOOOKKOK..R',
      '..KOOOOOOOOOK.RY',
      '...KOOOKOOOK..RY',
      '...KOOCCCCOOK.RR',
      '..KKOCCCCCCOK.K.',
      '..KOOCCCCCCOSKK.',
      '...KOCCCCCCOSOK.',
      '...KOOCCCCOOSSK.',
      '...KOOOOOOOOOK..',
      '...KOOK..KOOK...',
      '...KKKK..KKKK...',
      '................'
    ]
  },
  {
    id: 4,
    code: 'squirtle',
    name: 'เซนิกาเมะ (SQUIRTLE)',
    type: 'water',
    baseHp: 56,
    baseAtk: 14,
    baseDef: 17,
    baseSpd: 13,
    catchRate: 0.42,
    moves: ['bubble', 'tackle', 'waterGun', 'aquaTail'],
    desc: 'เต่าน้อยกระดองแข็งแรง พ่นน้ำแรงดันสูงออกจากปากได้อย่างแม่นยำ',
    palette: {
      K: '#1b262c',
      B: '#48cae4', // Cyan blue
      S: '#0096c7', // Shade blue
      Y: '#ffe599', // Belly
      M: '#c97a40', // Brown shell
      W: '#ffffff'
    },
    shinyPalette: {
      K: '#1b262c',
      B: '#9d4edd',
      S: '#7b2cbf',
      Y: '#ffe599',
      M: '#38b000',
      W: '#ffffff'
    },
    grid: [
      '....KKKKKK......',
      '...KBBBBBBK.....',
      '..KBBBBBBBBK....',
      '..KBWKBBBKWBK...',
      '..KBKKBBBKKBK...',
      '..KBBBBBBBBBK...',
      '...KBBKPKBBK.KK.',
      '..KKYYYYYYYKKMMK',
      '.KBBYYYYYYYYMMMK',
      '.KBBYYKYYKYYMMMK',
      '..KKYYYYYYYYMMK.',
      '...KYYYYYYYYKKK.',
      '...KBBBBBBBBBSK.',
      '...KBBK..KBBK...',
      '...KKKK..KKKK...',
      '................'
    ]
  },
  {
    id: 5,
    code: 'jiggly',
    name: 'พูริน (JIGGLYPUFF)',
    type: 'fairy',
    baseHp: 68,
    baseAtk: 12,
    baseDef: 12,
    baseSpd: 11,
    catchRate: 0.48,
    moves: ['sing', 'fairyWind', 'bodySlam', 'tackle'],
    desc: 'ตัวกลมปุ๊กปิ๊ก เมื่อขยับตากลมโตแล้วร้องเพลง ใครได้ยินก็จะเคลิ้มหลับทันที',
    palette: {
      K: '#22223b',
      P: '#ff9ebb', // Pink
      S: '#ff6b9d', // Shade pink
      B: '#00b4d8', // Big blue eye
      W: '#ffffff'
    },
    shinyPalette: {
      K: '#22223b',
      P: '#ffc8dd',
      S: '#ffafcc',
      B: '#38b000',
      W: '#ffffff'
    },
    grid: [
      '..KK........KK..',
      '.KPPK..KK..KPPK.',
      '.KPPPKKPPKKPPPK.',
      '..KPPPPPPPPPPK..',
      '.KPPPPPKKPPPPPK.',
      'KPPPPPPPPPPPPPPK',
      'KPPWWBPPPPBWWPPK',
      'KPPWBBPPPPBBWPPK',
      'KPPPBBPPPPBBPPPK',
      'KPPPPPPKKPPPPPPK',
      'KKPPPPPPPPPPPPKK',
      '.KPPPPPPPPPPPPSK',
      '..KSSSSSSSSSSSK.',
      '...KSSK..KSSK...',
      '...KKKK..KKKK...',
      '................'
    ]
  },
  {
    id: 6,
    code: 'eevee',
    name: 'อีวุย (EEVEE)',
    type: 'normal',
    baseHp: 54,
    baseAtk: 16,
    baseDef: 14,
    baseSpd: 16,
    catchRate: 0.36,
    moves: ['quickAttack', 'tackle', 'bodySlam', 'fairyWind'],
    desc: 'โปเกมอนขนปุยที่มีรหัสพันธุกรรมพิเศษ สามารถปรับตัวเข้ากับธรรมชาติได้ทุกแบบ',
    palette: {
      K: '#22181c',
      B: '#c98a5b', // Brown
      D: '#7f4f24', // Dark ear
      F: '#fff3d6', // Fluffy cream collar
      W: '#ffffff'
    },
    shinyPalette: {
      K: '#22181c',
      B: '#d8e2dc',
      D: '#6c757d',
      F: '#ffffff',
      W: '#ffffff'
    },
    grid: [
      '.KK..........KK.',
      'KDDK........KDDK',
      'KDDDK......KDDDK',
      '.KBBBK....KBBBK.',
      '..KBBBBBBBBBBK..',
      '..KBBBBBBBBBBK..',
      '..KBWKBBBBKWBK..',
      '..KBKKBBBBKKBK..',
      '...KBBBBBBBBK...',
      '..KFFFFFFFFFFK..',
      '.KFFFFFFFFFFFFK.',
      '..KKFFFFFFFFKKF.',
      '...KBBBBBBBBKFFK',
      '...KBBK..KBBKKK.',
      '...KKKK..KKKK...',
      '................'
    ]
  },
  {
    id: 7,
    code: 'psyduck',
    name: 'โคดัก (PSYDUCK)',
    type: 'water',
    baseHp: 55,
    baseAtk: 15,
    baseDef: 13,
    baseSpd: 12,
    catchRate: 0.45,
    moves: ['waterGun', 'confusion', 'tackle', 'aquaTail'],
    desc: 'เป็ดน้อยที่ชอบกุมหัวตัวเองตลอดเวลา ถ้าปวดหัวมากๆ จะปล่อยคลื่นพลังจิตออกมา!',
    palette: {
      K: '#1e1b18',
      Y: '#ffd166', // Yellow
      S: '#f4a261', // Shade
      B: '#ffedd8', // Beak cream
      W: '#ffffff'
    },
    shinyPalette: {
      K: '#1e1b18',
      Y: '#4cc9f0',
      S: '#4361ee',
      B: '#ffe5ec',
      W: '#ffffff'
    },
    grid: [
      '......K.K.K.....',
      '.....KKKKKKK....',
      '...KKYYYYYYYKK..',
      '..KYYYYYYYYYYYK.',
      '.KYYWWKYYYKWWYYK',
      '.KYYWKKYYYKKWYYK',
      '..KYYBBBBBBBYYK.',
      '..KYYBBBBBBBYYK.',
      '..KYYYBBBBBYYYK.',
      '.KYYYYYYYYYYYYYK',
      '.KYYYYYYYYYYYYSK',
      '..KYYYYYYYYYYSK.',
      '..KSSSSSSSSSSK..',
      '...KBBK..KBBK...',
      '...KKKK..KKKK...',
      '................'
    ]
  },
  {
    id: 8,
    code: 'togepi',
    name: 'โทเกปี้ (TOGEPI)',
    type: 'fairy',
    baseHp: 50,
    baseAtk: 12,
    baseDef: 18,
    baseSpd: 12,
    catchRate: 0.34,
    moves: ['fairyWind', 'sing', 'tackle', 'psychic'],
    desc: 'โปเกมอนเปลือกไข่ เชื่อกันว่าจะนำความโชคดีมาให้กับเทรนเนอร์ที่ดูแลอย่างอ่อนโยน',
    palette: {
      K: '#22223b',
      Y: '#fff3b0', // Head cream
      W: '#ffffff', // Shell white
      R: '#ef476f', // Red triangle
      B: '#118ab2'  // Blue triangle
    },
    shinyPalette: {
      K: '#22223b',
      Y: '#ffe5d9',
      W: '#fff8f0',
      R: '#b5179e',
      B: '#4cc9f0'
    },
    grid: [
      '..K...K..K...K..',
      '.KYK.KYKKYK.KYK.',
      '.KYYKKYYYYKKYYK.',
      '..KYYYYYYYYYYK..',
      '..KYKYYYYYYKYK..',
      '..KYYYYKKYYYYK..',
      '.KKKYYKWWKYYKKK.',
      'KYYKWWWWWWWWKYYK',
      'KKKWWWRWWBWWKKKK',
      '..KWWWRWWBBWWK..',
      '..KWWWWWWWRWWK..',
      '..KWWBBWWWRWWK..',
      '...KWWWWWWWWK...',
      '....KKKKKKKK....',
      '....KYYK.KYYK...',
      '....KKKK.KKKK...'
    ]
  },
  {
    id: 9,
    code: 'snorlax',
    name: 'คาบีก้อน (SNORLAX)',
    type: 'normal',
    baseHp: 85,
    baseAtk: 20,
    baseDef: 18,
    baseSpd: 8,
    catchRate: 0.25,
    moves: ['bodySlam', 'tackle', 'flamethrower', 'shadowBall'],
    desc: 'กินอาหารวันละ 400 กิโลกรัม พออิ่มปุ๊บก็จะหลับปุ๋ยขวางถนนทันที',
    palette: {
      K: '#14213d',
      T: '#2b5876', // Dark teal
      C: '#faedcd', // Cream belly
      F: '#d4a373', // Paw pads
      W: '#ffffff'
    },
    shinyPalette: {
      K: '#14213d',
      T: '#1d3557',
      C: '#fff8e8',
      F: '#e07a5f',
      W: '#ffffff'
    },
    grid: [
      '..KKK......KKK..',
      '..KTTKKKKKKTTK..',
      '..KTTCCCCCCCTK..',
      '..KTCCKKCKKCCTK.',
      '..KTCCCCCCCCCTK.',
      '.KTTTCCCCCCCTTTK',
      'KTTTCCCCCCCCCTTK',
      'KTTCCCCCCCCCCCTK',
      'KTTCCCCCCCCCCCTK',
      'KTTCCCCCCCCCCCTK',
      'KTTTCCCCCCCCCTTK',
      '.KTTTCCCCCCCTTTK',
      '.KWWKTTTTTTKWWK.',
      'KWFFWKTTTTKWFFWK',
      'KWWWWK....KWWWWK',
      '.KKKK......KKKK.'
    ]
  },
  {
    id: 10,
    code: 'gengar',
    name: 'เก็งการ์ (GENGAR)',
    type: 'ghost',
    baseHp: 58,
    baseAtk: 20,
    baseDef: 13,
    baseSpd: 19,
    catchRate: 0.26,
    moves: ['lick', 'shadowBall', 'confusion', 'sleepPowder'],
    desc: 'โปเกมอนเงามืดที่ชอบซ่อนตัวในเงาของคนอื่นแล้วยิ้มกว้างแกล้งหลอก',
    palette: {
      K: '#10002b',
      P: '#5a189a', // Purple
      S: '#3c096c', // Dark purple
      R: '#ff2a55', // Red eye
      W: '#ffffff'
    },
    shinyPalette: {
      K: '#10002b',
      P: '#adb5bd',
      S: '#6c757d',
      R: '#ff0055',
      W: '#ffffff'
    },
    grid: [
      '.KK...K..K...KK.',
      '.KPK.KPKKPK.KPK.',
      '..KPPKPPPPKPPK..',
      '..KPPPPPPPPPPK..',
      '.KPPPPPPPPPPPPK.',
      '.KPPRKPPPPKRPPK.',
      'KPPPRRKPPKRRPPPK',
      'KPPPPPPPPPPPPPPK',
      'KPPPWWWWWWWWPPPK',
      'KPPPWKWKKWKWPPPK',
      '.KPPPWWWWWWPPPK.',
      '.KPPPPPPPPPPPSK.',
      '..KSSSSSSSSSSK..',
      '..KSSK....KSSK..',
      '..KKKK....KKKK..',
      '................'
    ]
  },
  {
    id: 11,
    code: 'dratini',
    name: 'มินิริว (DRATINI)',
    type: 'dragon',
    baseHp: 56,
    baseAtk: 17,
    baseDef: 14,
    baseSpd: 16,
    catchRate: 0.24,
    moves: ['dragonBreath', 'aquaTail', 'thunderbolt', 'quickAttack'],
    desc: 'มังกรน้อยในตำนาน เติบโตด้วยการลอกคราบและมีพลังลึกลับซ่อนอยู่',
    palette: {
      K: '#1d3557',
      B: '#4ea8de', // Dragon blue
      S: '#2ec4b6',
      W: '#ffffff'
    },
    shinyPalette: {
      K: '#4a154b',
      B: '#ff70a6',
      S: '#ff9770',
      W: '#ffffff'
    },
    grid: [
      '..KK........KK..',
      '.KWWK.KKKK.KWWK.',
      '.KWWKKBBBBKKWWK.',
      '..KKKBBWWBBKKK..',
      '....KBKBBKBK....',
      '....KBBWWBBK....',
      '....KBBWWBBK....',
      '.....KBBBBK.....',
      '.....KBBWWK.....',
      '....KBBBWWK.KKK.',
      '...KBBBWWK.KBBBK',
      '...KBBWWK..KBBK.',
      '...KBBWWKKKBBK..',
      '....KBBBWWWWK...',
      '.....KKKKKKKK...',
      '................'
    ]
  },
  {
    id: 12,
    code: 'mew',
    name: 'มิว (MEW)',
    type: 'psychic',
    baseHp: 65,
    baseAtk: 21,
    baseDef: 18,
    baseSpd: 21,
    catchRate: 0.18,
    moves: ['psychic', 'confusion', 'thunderbolt', 'flamethrower'],
    desc: 'โปเกมอนมายาในตำนาน มีพันธุกรรมของโปเกมอนทุกชนิดและใช้ท่าได้ทุกรูปแบบ',
    palette: {
      K: '#2b193d',
      P: '#ff99c8', // Soft pink
      S: '#ff5d8f', // Pink shade
      B: '#3a86ff', // Blue eyes
      W: '#ffffff'
    },
    shinyPalette: {
      K: '#1d3557',
      P: '#72efdd',
      S: '#4ea8de',
      B: '#ff006e',
      W: '#ffffff'
    },
    grid: [
      '..KK......KK....',
      '.KPPK....KPPK...',
      '.KPPPKKKKPPPK...',
      '..KPPPPPPPPK..KK',
      '..KPPBPPPPBPK.KP',
      '..KPPWKPPKWPK.KP',
      '...KPPPPPPPPK..K',
      '....KPPPPPPK...K',
      '...KPPPPPPK...K.',
      '...KPPPPPPK..K..',
      '..KSSPPPPSSKK...',
      '..KSSPPPPSSK....',
      '...KPK..KPK.....',
      '..KPPK..KPPK....',
      '..KKK....KKK....',
      '................'
    ]
  }
];

// ============================================================================
// PIXEL ART TRAINER & POKEBALL SPRITES
// ============================================================================
const TRAINER_SPRITE = {
  palette: {
    K: '#1a1c2c',
    R: '#e63946', // Red Hat & Shirt
    W: '#ffffff', // Hat trim
    F: '#ffcdb2', // Skin
    B: '#1d3557', // Blue pants
    H: '#3d2c2e'  // Hair
  },
  down: [
    '....KKKKKKKK....',
    '...KRRRRRRRRK...',
    '..KRRRWWWWWRRK..',
    '..KHHHHHHHHHHK..',
    '..KHFFKFFKFFHK..',
    '..KHFFFFFFFFHK..',
    '...KKKKKKKKKK...',
    '..KWWWRRRRWWWK..',
    '..KFFKRRRRKFFK..',
    '...KKKBBBBKKK...',
    '....KBBBBBBK....',
    '....KBBKKBBK....',
    '....KKKK.KKKK...'
  ]
};

const POKEBALL_SPRITES = {
  pokeball: {
    palette: { K: '#1a1c2c', T: '#ff2a55', H: '#ff8fa3', W: '#ffffff', G: '#adb5bd' },
    grid: [
      '....KKKK....',
      '..KKTTTTKK..',
      '.KTTHHTTTTK.',
      'KTTTTTTTTTTK',
      'KTTTTTTTTTTK',
      'KKKKKWWKKKKK',
      'KWWWWWWGWWWK',
      'KWWWWWWWWWWK',
      '.KWWWWWWWWK.',
      '..KKWWWWKK..',
      '....KKKK....'
    ]
  },
  greatball: {
    palette: { K: '#1a1c2c', T: '#0077b6', H: '#ff2a55', W: '#ffffff', G: '#adb5bd' },
    grid: [
      '....KKKK....',
      '..KKTTTTKK..',
      '.KHHTTTTHHK.',
      'KHTTTTTTTTHK',
      'KTTTTTTTTTTK',
      'KKKKKWWKKKKK',
      'KWWWWWWGWWWK',
      'KWWWWWWWWWWK',
      '.KWWWWWWWWK.',
      '..KKWWWWKK..',
      '....KKKK....'
    ]
  },
  ultraball: {
    palette: { K: '#1a1c2c', T: '#2b2d42', H: '#ffd166', W: '#ffffff', G: '#adb5bd' },
    grid: [
      '....KKKK....',
      '..KKHTTHKK..',
      '.KTTHHTTHHTK',
      'KTTHTTTTTHTK',
      'KTTTTTTTTTTK',
      'KKKKKWWKKKKK',
      'KWWWWWWGWWWK',
      'KWWWWWWWWWWK',
      '.KWWWWWWWWK.',
      '..KKWWWWKK..',
      '....KKKK....'
    ]
  },
  masterball: {
    palette: { K: '#1a1c2c', T: '#7209b7', H: '#f72585', W: '#ffffff', G: '#adb5bd' },
    grid: [
      '....KKKK....',
      '..KKTTTTKK..',
      '.KHHTTTTHHK.',
      'KHTWTWTWTTHK',
      'KTTTTTTTTTTK',
      'KKKKKWWKKKKK',
      'KWWWWWWGWWWK',
      'KWWWWWWWWWWK',
      '.KWWWWWWWWK.',
      '..KKWWWWKK..',
      '....KKKK....'
    ]
  }
};

// Return HTML <img> tag with crisp pixel art for any Pokemon
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
