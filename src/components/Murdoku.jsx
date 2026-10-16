import { useEffect, useMemo, useRef, useState } from 'react'
import confetti from 'canvas-confetti'
import {
  CARDS, COLORS, FURNITURE, GENERAL, IMG, KINDS, MURDERER_ID, N, PIECES, ROOMS, ROOM_MAP, VICTIM_ID,
} from '../content.js'

const key = (r, c) => `${r}-${c}`
const furnAt = (r, c) => FURNITURE.find((f) => f.r === r && f.c === c)
const isBlocked = (r, c) => {
  const f = furnAt(r, c)
  return !!f && !KINDS[f.k].walk
}
const roomOf = (p) => ROOM_MAP[p[0]][p[1]]
const isSit = (p) => {
  const f = furnAt(p[0], p[1])
  return !!f && !!KINDS[f.k].sit
}
const besideKind = (p, k) => FURNITURE.some((f) => f.k === k && Math.abs(f.r - p[0]) + Math.abs(f.c - p[1]) === 1)

function Face({ s, size }) {
  const fluid = typeof size === 'string'
  const box = fluid ? { width: size, aspectRatio: '1' } : { width: size, height: size }
  return s.emoji ? (
    <span className="face emoji" style={{ ...box, fontSize: fluid ? 'calc(var(--cs) * 0.42)' : size * 0.6 }}>
      {s.emoji}
    </span>
  ) : (
    <span className="face" style={{ ...box, backgroundImage: `url(${s.img})`, backgroundPosition: s.pos }} />
  )
}

// true / false / null (ainda não se sabe)
function evalCard(card, i, A) {
  const me = A[i]
  if (!me) return null
  const all = A.every(Boolean)
  const others = (room, except) => A.filter((p, j) => p && !except.includes(j) && roomOf(p) === room).length
  switch (card.type) {
    case 'room':
      return roomOf(me) === card.room
    case 'beside':
      return besideKind(me, card.k)
    case 'above': {
      const o = A[card.j]
      return o ? me[0] < o[0] : null
    }
    case 'with': {
      const o = A[card.j]
      if (!o) return null
      if (roomOf(o) !== roomOf(me)) return false
      if (others(roomOf(me), [i, card.j]) > 0) return false
      return all ? true : null
    }
    case 'victim': {
      const n = others(roomOf(me), [i])
      if (n > 1) return false
      return all ? n === 1 : null
    }
    default:
      return null
  }
}
function evalGeneral(g, A) {
  const all = A.every(Boolean)
  const n =
    g.type === 'sitCount'
      ? A.filter((p) => p && isSit(p)).length
      : A.filter((p) => p && roomOf(p) === g.room).length
  if (n > g.n) return false
  return all ? n === g.n : null
}

const EMPTY = { pos: {}, notes: {}, xs: {} }
const LONG_PRESS = 420

export default function Murdoku({ onNext }) {
  const [board, setBoard] = useState(EMPTY) // pos: id -> [r,c] · notes: "r-c" -> [ids] · xs: "r-c" -> true
  const [sel, setSel] = useState(0)
  const [tool, setTool] = useState('pen') // pen | x | erase
  const [mode, setMode] = useState('note') // note | place (só para a caneta)
  const [phase, setPhase] = useState('place') // place | accuse | solved
  const [pop, setPop] = useState(null)
  const [press, setPress] = useState(null)
  const [histLen, setHistLen] = useState(0)
  const [wrong, setWrong] = useState(0)
  const [shake, setShake] = useState(0)

  const live = useRef({})
  const hist = useRef([])
  const gest = useRef(null)
  const eraseTimer = useRef(null)
  const eraseLong = useRef(false)
  live.current = { board, sel, tool, mode, phase }

  const { pos, notes, xs } = board
  const A = PIECES.map((p) => pos[p.id])
  const placedIds = PIECES.filter((p) => pos[p.id]).map((p) => p.id)
  const allPlaced = placedIds.length === PIECES.length
  const at = (r, c) => placedIds.find((id) => pos[id][0] === r && pos[id][1] === c)

  const conflicts = useMemo(() => {
    const bad = new Set()
    placedIds.forEach((a) =>
      placedIds.forEach((b) => {
        if (a !== b && (pos[a][0] === pos[b][0] || pos[a][1] === pos[b][1])) bad.add(a)
      }),
    )
    return bad
  }, [pos]) // eslint-disable-line

  const cardV = CARDS.map((c, i) => evalCard(c, i, A))
  const genV = GENERAL.map((g) => evalGeneral(g, A))
  const okCount = cardV.filter((v) => v === true).length + genV.filter((v) => v === true).length
  const total = CARDS.length + GENERAL.length

  // ---------- estado + histórico ----------
  const commit = (next, pushed) => {
    const cur = live.current.board
    if (next === cur) return
    if (!pushed || !pushed.done) {
      hist.current.push(cur)
      if (hist.current.length > 80) hist.current.shift()
      setHistLen(hist.current.length)
      if (pushed) pushed.done = true
    }
    live.current.board = next
    setBoard(next)
  }
  const undo = () => {
    const prev = hist.current.pop()
    setHistLen(hist.current.length)
    if (prev) {
      live.current.board = prev
      setBoard(prev)
    }
  }
  const clearAll = () => {
    if (!Object.keys(live.current.board.pos).length && !Object.keys(live.current.board.notes).length && !Object.keys(live.current.board.xs).length) return
    commit(EMPTY)
    setSel(0)
    if (navigator.vibrate) navigator.vibrate(40)
  }

  const nextUnplaced = (p, from) => {
    for (let i = 1; i <= PIECES.length; i++) {
      const id = (from + i) % PIECES.length
      if (!p[id]) return id
    }
    return null
  }

  const checkSolved = (p) => {
    const arr = PIECES.map((x) => p[x.id])
    if (!arr.every(Boolean)) return
    const rows = new Set(arr.map((x) => x[0]))
    const cols = new Set(arr.map((x) => x[1]))
    const good =
      rows.size === N &&
      cols.size === N &&
      CARDS.every((c, i) => evalCard(c, i, arr) === true) &&
      GENERAL.every((g) => evalGeneral(g, arr) === true)
    if (good) {
      setTimeout(() => {
        setPhase('accuse')
        confetti({ particleCount: 80, spread: 80, origin: { y: 0.4 }, colors: COLORS })
      }, 500)
    }
  }

  // ---------- ações sobre uma casa ----------
  const cellOcc = (b, r, c) => PIECES.find((p) => b.pos[p.id] && b.pos[p.id][0] === r && b.pos[p.id][1] === c)

  const placeAt = (r, c, id) => {
    const b = live.current.board
    if (isBlocked(r, c)) return
    const pos2 = { ...b.pos }
    const there = cellOcc(b, r, c)
    if (there) delete pos2[there.id]
    pos2[id] = [r, c]
    const k = key(r, c)
    const notes2 = { ...b.notes }
    delete notes2[k]
    const xs2 = { ...b.xs }
    delete xs2[k]
    commit({ pos: pos2, notes: notes2, xs: xs2 })
    setPop(k)
    setTimeout(() => setPop(null), 350)
    if (navigator.vibrate) navigator.vibrate(12)
    setSel(nextUnplaced(pos2, id))
    checkSolved(pos2)
  }

  const eraseAt = (r, c, g) => {
    const b = live.current.board
    const k = key(r, c)
    const there = cellOcc(b, r, c)
    if (!b.notes[k] && !b.xs[k] && !there) return
    const pos2 = { ...b.pos }
    if (there) delete pos2[there.id]
    const notes2 = { ...b.notes }
    delete notes2[k]
    const xs2 = { ...b.xs }
    delete xs2[k]
    commit({ pos: pos2, notes: notes2, xs: xs2 }, g)
  }

  // modo: 'add' | 'remove', decidido pela primeira casa do gesto
  const noteAt = (r, c, g, first) => {
    const { board: b, sel: s } = live.current
    if (s === null || isBlocked(r, c) || cellOcc(b, r, c)) return
    const k = key(r, c)
    const list = b.notes[k] || []
    if (first && g) g.mode = list.includes(s) ? 'remove' : 'add'
    const m = g ? g.mode : list.includes(s) ? 'remove' : 'add'
    const has = list.includes(s)
    if ((m === 'add' && has) || (m === 'remove' && !has)) return
    const next = m === 'add' ? [...list, s] : list.filter((x) => x !== s)
    const notes2 = { ...b.notes }
    if (next.length) notes2[k] = next
    else delete notes2[k]
    commit({ ...b, notes: notes2 }, g)
  }

  const crossAt = (r, c, g, first) => {
    const b = live.current.board
    if (isBlocked(r, c) || cellOcc(b, r, c)) return
    const k = key(r, c)
    if (first && g) g.mode = b.xs[k] ? 'remove' : 'add'
    const m = g ? g.mode : b.xs[k] ? 'remove' : 'add'
    if ((m === 'add') === !!b.xs[k]) return
    const xs2 = { ...b.xs }
    if (m === 'add') xs2[k] = true
    else delete xs2[k]
    commit({ ...b, xs: xs2 }, g)
  }

  const apply = (r, c, g, first) => {
    const { tool: t, mode: m } = live.current
    if (t === 'erase') eraseAt(r, c, g)
    else if (t === 'x') crossAt(r, c, g, first)
    else if (m === 'note') noteAt(r, c, g, first)
  }

  // ---------- gestos no tabuleiro ----------
  const cellFrom = (el) => {
    const d = el && el.closest ? el.closest('[data-cell]') : null
    if (!d) return null
    const [r, c] = d.dataset.cell.split('-').map(Number)
    return { r, c, k: d.dataset.cell }
  }

  const onDown = (e) => {
    if (live.current.phase !== 'place') return
    const cell = cellFrom(e.target)
    if (!cell) return
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {}
    const g = { start: cell, last: cell.k, moved: false, long: false, applied: false, mode: null, done: false, timer: null }
    gest.current = g
    const { tool: t, mode: m, sel: s } = live.current
    if (t === 'pen' && m === 'note' && s !== null && !isBlocked(cell.r, cell.c) && !cellOcc(live.current.board, cell.r, cell.c)) {
      setPress(cell.k)
      g.timer = setTimeout(() => {
        g.long = true
        setPress(null)
        const cur = live.current.sel
        if (cur !== null) placeAt(cell.r, cell.c, cur)
      }, LONG_PRESS)
    }
  }

  const onMove = (e) => {
    const g = gest.current
    if (!g || g.long) return
    const cell = cellFrom(document.elementFromPoint(e.clientX, e.clientY))
    if (!cell || cell.k === g.last) return
    g.moved = true
    clearTimeout(g.timer)
    setPress(null)
    const { tool: t, mode: m } = live.current
    if (t === 'pen' && m === 'place') return
    if (!g.applied) {
      g.applied = true
      apply(g.start.r, g.start.c, g, true)
    }
    g.last = cell.k
    apply(cell.r, cell.c, g, false)
  }

  const onUp = () => {
    const g = gest.current
    gest.current = null
    if (!g) return
    clearTimeout(g.timer)
    setPress(null)
    if (g.long || g.moved) return
    // toque simples
    const { r, c } = g.start
    const { tool: t, mode: m, sel: s, board: b } = live.current
    const occ = cellOcc(b, r, c)
    if (t === 'erase') return eraseAt(r, c, null)
    if (t === 'x') return crossAt(r, c, null, true)
    if (occ) {
      // apanhar a peça
      const pos2 = { ...b.pos }
      delete pos2[occ.id]
      commit({ ...b, pos: pos2 })
      setSel(occ.id)
      return
    }
    if (isBlocked(r, c)) return
    if (m === 'place') {
      if (s !== null) placeAt(r, c, s)
    } else noteAt(r, c, null, true)
  }

  const onCancel = () => {
    if (gest.current) clearTimeout(gest.current.timer)
    gest.current = null
    setPress(null)
  }

  // borracha: toque seleciona, segurar limpa tudo
  const eraserDown = () => {
    eraseLong.current = false
    eraseTimer.current = setTimeout(() => {
      eraseLong.current = true
      clearAll()
    }, 650)
  }
  const eraserUp = () => {
    clearTimeout(eraseTimer.current)
    if (!eraseLong.current) setTool((t) => (t === 'erase' ? 'pen' : 'erase'))
  }
  useEffect(() => () => clearTimeout(eraseTimer.current), [])

  const accuse = (id) => {
    if (id === MURDERER_ID) {
      setPhase('solved')
      confetti({ particleCount: 120, spread: 90, origin: { y: 0.5 }, colors: COLORS })
    } else {
      setWrong((w) => w + 1)
      setShake((s) => s + 1)
      if (navigator.vibrate) navigator.vibrate(60)
    }
  }

  if (phase === 'solved') {
    return (
      <section className="card solved-card">
        <div className="mugshot">
          <img src={IMG.eu} alt="Eu" />
          <div className="bars" />
          <div className="mug-plate">EU · Nº 0001</div>
        </div>
        <h2 className="display sm">Foi o Eu!</h2>
        <p className="lead">
          Sozinho com o pastel no <b>jardim</b>, ao lado de uma árvore. A vítima? O último pastel de nata. Sem remorsos.
        </p>
        <p className="tiny">(Assassino confesso. Mas foi por um bom motivo, vais ver já já.)</p>
        <button className="btn primary big" onClick={onNext}>
          Próximo desafio <span className="arrow">→</span>
        </button>
      </section>
    )
  }

  const crossed = (r, c) =>
    !isBlocked(r, c) && at(r, c) === undefined && placedIds.some((id) => pos[id][0] === r || pos[id][1] === c)

  const cellBorder = (r, c) => {
    const room = ROOM_MAP[r][c]
    const diff = (rr, cc) => rr < 0 || cc < 0 || rr >= N || cc >= N || ROOM_MAP[rr][cc] !== room
    return {
      borderTopWidth: diff(r - 1, c) ? 2.5 : 0.5,
      borderBottomWidth: diff(r + 1, c) ? 2.5 : 0.5,
      borderLeftWidth: diff(r, c - 1) ? 2.5 : 0.5,
      borderRightWidth: diff(r, c + 1) ? 2.5 : 0.5,
    }
  }
  const labelCell = (room) => {
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (ROOM_MAP[r][c] === room) return key(r, c)
  }
  const victimRoom = pos[VICTIM_ID] ? roomOf(pos[VICTIM_ID]) : null
  const hasAnything = placedIds.length || Object.keys(notes).length || Object.keys(xs).length

  const hint =
    tool === 'erase'
      ? 'Borracha: toca ou arrasta para limpar casas.'
      : tool === 'x'
        ? 'Riscar: marca as casas impossíveis (toca ou arrasta).'
        : sel === null
          ? allPlaced
            ? 'Há pistas por cumprir. Toca numa peça no tabuleiro para a mover.'
            : 'Escolhe uma peça nos cartões abaixo.'
          : mode === 'note'
            ? `${PIECES[sel].name}: toca para anotar, arrasta para pintar, segura para colocar.`
            : `${PIECES[sel].name}: toca numa casa para colocar.`

  return (
    <section className="murdoku">
      <header className="ch-head">
        <img className="ch-img" src={IMG.policia} alt="" />
        <div>
          <span className="eyebrow">Desafio 1 · Murdoku</span>
          <h2 className="display sm">O crime do pastel</h2>
        </div>
      </header>

      <div className="card story">
        <p>
          Alguém assassinou <b>o último pastel de nata</b> 🥧. Coloca as 8 peças na planta da casa, seguindo as pistas de
          cada uma.
        </p>
        <ul className="rules">
          <li>
            Cada <b>linha</b> e cada <b>coluna</b> tem exatamente uma peça.
          </li>
          <li>
            Não podes pôr ninguém em cima de árvores, estantes, mesas, TVs…, mas <b>sofás, cadeiras, camas e tapetes</b>{' '}
            são para ocupar. Sofás e cadeiras contam como <b>sentado</b>.
          </li>
          <li>
            O assassino é quem estava <b>sozinho com a vítima</b>, na mesma divisão.
          </li>
          <li>
            Escolhe uma peça e <b>toca</b> numa casa para fazer uma <b>nota</b>. <b>Segura</b> para a colocar mesmo.
          </li>
        </ul>
        <div className="general">
          <span className="eyebrow dark">Pistas gerais</span>
          {GENERAL.map((g, i) => (
            <div key={i} className={`gen ${genV[i] === true ? 'ok' : genV[i] === false ? 'ko' : ''}`}>
              <span className="gi">{genV[i] === true ? '✓' : genV[i] === false ? '✕' : '★'}</span>
              {g.text}
            </div>
          ))}
        </div>
      </div>

      <div className="card board-card">
        <div className="progress-line">
          <span>
            {placedIds.length}/{PIECES.length} colocados
          </span>
          <span>
            {okCount}/{total} pistas cumpridas
          </span>
        </div>

        {phase === 'place' && (
          <div className="toolbar" role="toolbar" aria-label="Ferramentas">
            <button
              className={`tool ${tool === 'pen' && mode === 'note' ? 'on' : ''}`}
              onClick={() => (setTool('pen'), setMode('note'))}
            >
              <span className="ti">📝</span>Notas
            </button>
            <button
              className={`tool ${tool === 'pen' && mode === 'place' ? 'on' : ''}`}
              onClick={() => (setTool('pen'), setMode('place'))}
            >
              <span className="ti">📍</span>Colocar
            </button>
            <button className={`tool ${tool === 'x' ? 'on' : ''}`} onClick={() => setTool((t) => (t === 'x' ? 'pen' : 'x'))}>
              <span className="ti">✕</span>Riscar
            </button>
            <button
              className={`tool ${tool === 'erase' ? 'on' : ''}`}
              onPointerDown={eraserDown}
              onPointerUp={eraserUp}
              onPointerLeave={() => clearTimeout(eraseTimer.current)}
              onContextMenu={(e) => e.preventDefault()}
            >
              <span className="ti">🧽</span>Borracha
            </button>
            <button className="tool" onClick={undo} disabled={!histLen}>
              <span className="ti">↩</span>Desfazer
            </button>
          </div>
        )}

        <div
          className={`floor ${phase === 'accuse' ? 'locked' : ''}`}
          style={{ '--n': N }}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onCancel}
          onContextMenu={(e) => e.preventDefault()}
        >
          {Array.from({ length: N * N }, (_, i) => {
            const r = Math.floor(i / N)
            const c = i % N
            const k = key(r, c)
            const room = ROOMS[ROOM_MAP[r][c]]
            const f = furnAt(r, c)
            const kind = f ? KINDS[f.k] : null
            const blockedCell = isBlocked(r, c)
            const who = at(r, c)
            const piece = who !== undefined ? PIECES[who] : null
            const glow = phase === 'accuse' && ROOM_MAP[r][c] === victimRoom
            const cellNotes = !piece && notes[k] ? notes[k] : null
            return (
              <div
                key={k}
                data-cell={k}
                className={`fcell ${blockedCell ? 'block' : ''} ${piece ? 'has' : ''} ${
                  piece && conflicts.has(who) ? 'bad' : ''
                } ${pop === k ? 'pop' : ''} ${glow ? 'glow' : ''} ${press === k ? 'pressing' : ''} ${
                  f?.k === 'carpet' ? 'carpet' : ''
                }`}
                style={{ background: room.color, ...cellBorder(r, c) }}
                role="button"
                aria-label={`Linha ${r + 1}, coluna ${c + 1}${kind ? ', ' + kind.name : ''}${piece ? ': ' + piece.name : ''}`}
              >
                {labelCell(ROOM_MAP[r][c]) === k && <span className="rname">{room.short || room.name}</span>}
                {kind && kind.icon && (
                  <span className={`furn ${kind.walk ? 'soft' : ''} ${piece ? 'under' : ''}`}>{kind.icon}</span>
                )}
                {piece && <Face s={piece} size="68%" />}
                {cellNotes && (
                  <span className="notes" style={{ "--nc": cellNotes.length <= 4 ? 2 : 3 }}>
                    {cellNotes.map((id) => {
                      const s = PIECES[id]
                      return s.emoji ? (
                        <i key={id} className="nf emo">
                          {s.emoji}
                        </i>
                      ) : (
                        <i key={id} className="nf" style={{ backgroundImage: `url(${s.img})`, backgroundPosition: s.pos }} />
                      )
                    })}
                  </span>
                )}
                {!piece && xs[k] && <span className="xmark">✕</span>}
                {!piece && !xs[k] && !cellNotes && crossed(r, c) && <span className="cross">×</span>}
              </div>
            )
          })}
        </div>

        {phase === 'place' && (
          <div className="floor-actions">
            <span className="hint-line">{hint}</span>
            {hasAnything ? (
              <span className="tiny-dark">Segura a 🧽 para limpar tudo</span>
            ) : null}
          </div>
        )}
      </div>

      {phase === 'accuse' && (
        <div className={`card accuse ${shake ? 'shake' : ''}`} key={shake}>
          <h3>Tudo no sítio! 🔍</h3>
          <p className="lead small">
            O pastel está no <b>{ROOMS[victimRoom].name}</b>. Quem lá estava sozinho com ele?
          </p>
          <div className="chips">
            {PIECES.filter((p) => !p.victim).map((p) => (
              <button key={p.id} className="chip" onClick={() => accuse(p.id)}>
                <Face s={p} size={32} />
                {p.name}
              </button>
            ))}
          </div>
          {wrong > 0 && (
            <p className="oops">
              Hmm, não é bem esse. 🕵️ {wrong > 1 && 'Procura quem está na mesma divisão que o pastel.'}
            </p>
          )}
        </div>
      )}

      <div className="cards">
        {PIECES.map((p) => {
          const v = cardV[p.id]
          const card = CARDS[p.id]
          return (
            <button
              key={p.id}
              className={`pcard ${sel === p.id ? 'on' : ''} ${pos[p.id] ? 'placed' : ''} ${
                v === true ? 'ok' : v === false ? 'ko' : ''
              } ${conflicts.has(p.id) ? 'bad' : ''} ${p.victim ? 'vic' : ''}`}
              onClick={() => {
                setSel(p.id)
                if (tool !== 'pen') setTool('pen')
              }}
              disabled={phase !== 'place'}
            >
              <span className="ptop">
                <Face s={p} size={42} />
                <span className="pname">{p.name}</span>
                {v === true && <i className="pstate ok">✓</i>}
                {v === false && <i className="pstate ko">✕</i>}
              </span>
              <span className="ptext">{card.text}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
