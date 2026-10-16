// Tudo o que é texto/personalização está aqui — edita à vontade.

export const NOME = 'Chancha'

export const COLORS = ['#ff7a2f', '#ffc93c', '#5b2a86', '#c9b3f0', '#e5372e', '#2e9e5b', '#1e2a78']

export const IMG = {
  policia: './img/policia.webp',
  eu: './img/eu.webp',
  selfie: './img/selfie.webp',
  carro: './img/carro.webp',
  tom: './img/tom.webp',
  dragao: './img/dragao.webp',
  mascote: './img/mascote.webp',
  prisao: './img/prisao.webp',
  cartoon: './img/cartoon.webp',
  jardineiras: './img/jardineiras.webp',
  espelho: './img/espelho.webp',
}

// ---------- MURDOKU ----------
// Grelha 8x8, 8 peças (7 suspeitos + a vítima). Cada linha e coluna leva exatamente uma peça.
// Mobília que bloqueia: ninguém se pode pôr lá. Sofás, cadeiras, camas e tapetes: dá para ficar em cima.
// Puzzle gerado e verificado por computador: solução única. O assassino é o Eu (sozinho com a vítima no Jardim).
export const N = 8
export const PIECES = [
  { id: 0, name: 'Eu', img: IMG.eu, pos: 'center top', fem: false },
  { id: 1, name: 'Tom', img: IMG.tom, pos: 'center 20%' },
  { id: 2, name: 'Dragão', img: IMG.dragao, pos: 'center' },
  { id: 3, name: 'Sr. Chancholy', img: IMG.mascote, pos: 'center' },
  { id: 4, name: 'Chancha', img: './img/chancha.webp', pos: 'center', fem: true },
  { id: 5, name: 'Tidi', img: './img/tidi.webp', pos: 'center', fem: true },
  { id: 6, name: 'Preguiça', emoji: '🦥', fem: true },
  { id: 7, name: 'Pastel', emoji: '🥧', victim: true },
]
export const VICTIM_ID = 7
export const MURDERER_ID = 0

export const ROOMS = [
  { name: 'Jardim', color: '#bfe5c0' },
  { name: 'Varanda', color: '#c9d6ff' },
  { name: 'Cozinha', color: '#ffe08a' },
  { name: 'Sala', color: '#e3cff7' },
  { name: 'Casa de banho', short: 'W.C.', color: '#bfe4ee' },
  { name: 'Quarto', color: '#ffc9a6' },
  { name: 'Escritório', color: '#f6b8b0' },
  { name: 'Garagem', color: '#d5d9e8' },
]
export const ROOM_MAP = [
  [0, 0, 0, 0, 1, 1, 1, 1],
  [0, 0, 0, 0, 1, 1, 1, 1],
  [0, 0, 2, 2, 2, 3, 3, 3],
  [4, 4, 2, 2, 2, 3, 3, 3],
  [4, 4, 2, 2, 2, 3, 3, 3],
  [5, 5, 5, 6, 6, 6, 3, 3],
  [5, 5, 5, 6, 6, 7, 7, 7],
  [5, 5, 5, 6, 6, 7, 7, 7],
]
// walk: dá para ficar em cima · sit: conta como 'sentado'
export const KINDS = {
  tree: { icon: '🌳', name: 'árvore' },
  plant: { icon: '🪴', name: 'planta' },
  stove: { icon: '🔥', name: 'fogão' },
  table: { icon: '🍽️', name: 'mesa' },
  tv: { icon: '📺', name: 'televisão' },
  shelf: { icon: '📚', name: 'estante' },
  bathtub: { icon: '🛁', name: 'banheira' },
  toilet: { icon: '🚽', name: 'sanita' },
  desk: { icon: '🖥️', name: 'secretária' },
  car: { icon: '🚗', name: 'carro' },
  tools: { icon: '🧰', name: 'ferramentas' },
  chair: { icon: '🪑', name: 'cadeira', walk: true, sit: true },
  sofa: { icon: '🛋️', name: 'sofá', walk: true, sit: true },
  bed: { icon: '🛏️', name: 'cama', walk: true },
  carpet: { icon: '', name: 'tapete', walk: true },
}
export const FURNITURE = [
  ['tree', 0, 0], ['tree', 1, 3], ['plant', 0, 7], ['chair', 1, 5],
  ['stove', 2, 3], ['table', 3, 3], ['chair', 4, 2],
  ['sofa', 3, 5], ['tv', 3, 7], ['carpet', 3, 6], ['shelf', 2, 7], ['chair', 5, 6],
  ['bathtub', 3, 0], ['toilet', 4, 1],
  ['bed', 5, 0], ['carpet', 6, 1], ['shelf', 7, 2],
  ['desk', 5, 3], ['chair', 6, 3], ['shelf', 7, 4],
  ['car', 6, 6], ['tools', 7, 5],
].map(([k, r, c]) => ({ k, r, c }))

// Uma pista por suspeito (índice = id da peça). A vítima tem a regra fixa.
export const CARDS = [
  { type: 'beside', k: 'tree', text: 'Estava ao lado de uma árvore.' },
  { type: 'beside', k: 'bed', text: 'Estava ao lado de uma cama.' },
  { type: 'beside', k: 'tv', text: 'Estava ao lado de uma televisão.' },
  { type: 'room', room: 2, text: 'Estava na Cozinha.' },
  { type: 'room', room: 1, text: 'Estava na Varanda.' },
  { type: 'with', j: 6, text: 'Estava sozinha com a Preguiça.' },
  { type: 'above', j: 5, text: 'Estava mais acima do que a Tidi.' },
  { type: 'victim', text: 'A vítima. Estava sozinho com o assassino.' },
]
export const GENERAL = [
  { type: 'sitCount', n: 1, text: 'Exatamente uma pessoa estava sentada.' },
  { type: 'roomCount', room: 0, n: 2, text: 'Havia exatamente 2 pessoas no Jardim.' },
]

// ---------- WORDLE ----------
export const WORD = 'COMPREI'
export const WORD_HINT = 'Pista: um verbo, 1.ª pessoa, pretérito perfeito. Aconteceu numa loja (online). 🛍️'

// ---------- FINAL ----------
export const LETTER = {
  title: 'Parabéns!',
  lines: [
    'Isto foi uma maneira longa e complicada de te dizer que comprei uma coisa para ti.',
    'Eu sei, não tive qualquer tipo de controlo. Aliás, comprei no segundo em que me mandaste a fotografia, daí teres demorado a responder... Eu queria ter-te comprado umas desde que começámos a namorar.',
    'Já não precisas de pedir dinheiro nos anos para isto!',
    '❤️',
  ],
}

export const ORDER = { number: '43881', tracking: '2664013' }
