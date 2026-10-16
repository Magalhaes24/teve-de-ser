import { useEffect, useMemo, useRef, useState } from 'react'
import confetti from 'canvas-confetti'
import { COLORS, IMG } from '../content.js'

const COLS = 3
const ROWS = 4
const N = COLS * ROWS
const BLANK = N - 1 // a peça que falta (canto inferior direito)
const POSTER = './img/embrulho.webp'

function neighbours(e) {
  const r = Math.floor(e / COLS)
  const c = e % COLS
  const out = []
  if (r > 0) out.push(e - COLS)
  if (r < ROWS - 1) out.push(e + COLS)
  if (c > 0) out.push(e - 1)
  if (c < COLS - 1) out.push(e + 1)
  return out
}

// baralha com movimentos válidos, por isso é sempre possível resolver
function shuffled() {
  for (;;) {
    const o = Array.from({ length: N }, (_, i) => i)
    let e = BLANK
    let prev = -1
    for (let i = 0; i < 140; i++) {
      const opts = neighbours(e).filter((p) => p !== prev)
      const p = opts[Math.floor(Math.random() * opts.length)]
      ;[o[e], o[p]] = [o[p], o[e]]
      prev = e
      e = p
    }
    if (o.filter((v, i) => v === i).length <= 3) return o
  }
}

// order[pos] = id da peça que está na posição pos
export default function Puzzle({ onNext }) {
  const [order, setOrder] = useState(shuffled)
  const [moves, setMoves] = useState(0)
  const [drag, setDrag] = useState(null)
  const [peek, setPeek] = useState(false)
  const [done, setDone] = useState(false)
  const [open, setOpen] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const dragRef = useRef(null)
  const boardRef = useRef(null)
  const orderRef = useRef(order)
  orderRef.current = order

  const posOf = useMemo(() => {
    const m = {}
    order.forEach((id, pos) => (m[id] = pos))
    return m
  }, [order])
  const correct = order.filter((id, pos) => id === pos && id !== BLANK).length

  // direção em que a peça na posição p teria de ir para chegar ao vazio (se estiverem alinhadas)
  const dirToEmpty = (p) => {
    const e = orderRef.current.indexOf(BLANK)
    const pr = Math.floor(p / COLS), pc = p % COLS
    const er = Math.floor(e / COLS), ec = e % COLS
    if (pr === er && pc !== ec) return pc < ec ? 'right' : 'left'
    if (pc === ec && pr !== er) return pr < er ? 'down' : 'up'
    return null
  }

  // desliza a peça (e as que estão pelo caminho) em direção ao espaço vazio
  const slideFrom = (p) => {
    const o = orderRef.current
    const dir = dirToEmpty(p)
    if (!dir || done) return false
    const e = o.indexOf(BLANK)
    const step = dir === 'right' ? 1 : dir === 'left' ? -1 : dir === 'down' ? COLS : -COLS
    const n = [...o]
    let cur = e
    let count = 0
    while (cur !== p) {
      n[cur] = n[cur - step]
      cur -= step
      count++
    }
    n[p] = BLANK
    orderRef.current = n
    setOrder(n)
    setMoves((m) => m + count)
    if (n.every((v, i) => v === i)) setTimeout(() => setDone(true), 450)
    return true
  }

  useEffect(() => {
    if (!done) return
    confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 }, colors: COLORS })
  }, [done])

  const unwrap = () => {
    setOpen(true)
    setTimeout(() => {
      setRevealed(true)
      const end = Date.now() + 1400
      const fire = () => {
        confetti({ particleCount: 5, angle: 60, spread: 60, origin: { x: 0, y: 0.7 }, colors: COLORS })
        confetti({ particleCount: 5, angle: 120, spread: 60, origin: { x: 1, y: 0.7 }, colors: COLORS })
        if (Date.now() < end) requestAnimationFrame(fire)
      }
      fire()
      confetti({ particleCount: 150, spread: 110, origin: { y: 0.55 }, colors: COLORS })
    }, 1700)
  }

  // ----- gestos: toque desliza; arrastar acompanha o dedo (peça vizinha ao vazio) -----
  const down = (e, id) => {
    if (done || id === BLANK) return
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {}
    dragRef.current = { id, x: e.clientX, y: e.clientY, moved: false }
  }
  const move = (e) => {
    const d = dragRef.current
    if (!d) return
    const dx = e.clientX - d.x
    const dy = e.clientY - d.y
    if (!d.moved && Math.hypot(dx, dy) > 6) d.moved = true
    if (!d.moved) return
    const o = orderRef.current
    const p = o.indexOf(d.id)
    const dir = dirToEmpty(p)
    const e0 = o.indexOf(BLANK)
    const adjacent = Math.abs(p - e0) === COLS || (Math.abs(p - e0) === 1 && Math.floor(p / COLS) === Math.floor(e0 / COLS))
    if (!dir || !adjacent) return
    const rect = boardRef.current.getBoundingClientRect()
    const tw = rect.width / COLS
    const th = rect.height / ROWS
    let ox = 0, oy = 0
    if (dir === 'right') ox = Math.min(Math.max(dx, 0), tw)
    if (dir === 'left') ox = Math.max(Math.min(dx, 0), -tw)
    if (dir === 'down') oy = Math.min(Math.max(dy, 0), th)
    if (dir === 'up') oy = Math.max(Math.min(dy, 0), -th)
    setDrag({ id: d.id, ox, oy })
  }
  const up = (e) => {
    const d = dragRef.current
    dragRef.current = null
    setDrag(null)
    if (!d) return
    const dx = e.clientX - d.x
    const dy = e.clientY - d.y
    const p = orderRef.current.indexOf(d.id)
    const dir = dirToEmpty(p)
    if (!d.moved) {
      if (slideFrom(p) && navigator.vibrate) navigator.vibrate(8)
      return
    }
    if (!dir) return
    const along = dir === 'right' ? dx : dir === 'left' ? -dx : dir === 'down' ? dy : -dy
    const rect = boardRef.current.getBoundingClientRect()
    const size = dir === 'left' || dir === 'right' ? rect.width / COLS : rect.height / ROWS
    if (along > Math.min(18, size * 0.3)) slideFrom(p)
  }

  const bgFor = (id, url) => ({
    backgroundImage: `url(${url})`,
    backgroundSize: `${COLS * 100}% ${ROWS * 100}%`,
    backgroundPosition: `${(id % COLS) * (100 / (COLS - 1))}% ${Math.floor(id / COLS) * (100 / (ROWS - 1))}%`,
  })

  const title = revealed ? 'Surpresa!' : done ? 'Completo!' : 'Desliza as peças'

  return (
    <section className="puzzle">
      <header className="ch-head">
        <span className="ch-emoji">🧩</span>
        <div>
          <span className="eyebrow">Desafio 3 · Puzzle deslizante</span>
          <h2 className="display sm">{title}</h2>
        </div>
      </header>
      {!done && (
        <p className="lead small">
          Há um espaço vazio no tabuleiro. <b>Toca</b> numa peça junto a ele (ou <b>desliza-a</b>) para a mover e vai
          arrumando tudo até a imagem ficar completa. Quando estiver, descobres o que ela escondia.
        </p>
      )}

      <div className="puzzle-stats">
        <span>
          Jogadas <b>{moves}</b>
        </span>
        <span className="bar">
          <i style={{ width: `${((done ? N - 1 : correct) / (N - 1)) * 100}%` }} />
        </span>
        <span>
          <b>{done ? N - 1 : correct}</b>/{N - 1}
        </span>
      </div>

      <div className={`board-wrap ${done ? 'done' : ''}`}>
        <div
          ref={boardRef}
          className={`pz-board slide ${done ? 'solved' : ''} ${open ? 'open' : ''} ${revealed ? 'revealed' : ''}`}
        >
          {Array.from({ length: N }, (_, id) => {
            const pos = posOf[id]
            const x = (pos % COLS) * 100
            const y = Math.floor(pos / COLS) * 100
            const dragging = drag?.id === id
            const isBlank = id === BLANK
            const movable = !done && !isBlank && dirToEmpty(pos) !== null
            return (
              <div
                key={id}
                className={`pz-tile ${dragging ? 'drag' : ''} ${open ? 'flipped' : ''} ${isBlank && !done ? 'blank' : ''} ${
                  movable ? 'movable' : ''
                }`}
                style={{
                  width: `${100 / COLS}%`,
                  height: `${100 / ROWS}%`,
                  transform: `translate(${x}%, ${y}%) ${dragging ? `translate(${drag.ox}px, ${drag.oy}px)` : ''}`,
                  '--fd': `${(id % COLS) * 110 + Math.floor(id / COLS) * 110}ms`,
                }}
                onPointerDown={(e) => down(e, id)}
                onPointerMove={move}
                onPointerUp={up}
                onPointerCancel={() => {
                  dragRef.current = null
                  setDrag(null)
                }}
              >
                <div className="flip">
                  <div className="face front" style={bgFor(id, POSTER)} />
                  <div className="face back" style={bgFor(id, IMG.jardineiras)} />
                </div>
              </div>
            )
          })}
          {revealed && <div className="full-img" style={{ backgroundImage: `url(${IMG.jardineiras})` }} />}
          {peek && !done && <div className="peek" style={{ backgroundImage: `url(${POSTER})` }} />}
        </div>
      </div>

      {revealed ? (
        <div className="result">
          <p className="lead">São tuas! 💚</p>
          <button className="btn primary big" onClick={onNext}>
            Abrir o cartão <span className="arrow">→</span>
          </button>
        </div>
      ) : done ? (
        <div className="result">
          <p className="lead">
            Resolvido em <b>{moves}</b> jogadas. Agora vem a melhor parte…
          </p>
          <button className="btn primary big" onClick={unwrap} disabled={open}>
            Revelar
          </button>
        </div>
      ) : (
        <div className="puzzle-actions">
          {moves >= 25 ? (
            <button
              className="btn ghost"
              onPointerDown={() => setPeek(true)}
              onPointerUp={() => setPeek(false)}
              onPointerLeave={() => setPeek(false)}
            >
              👀 Segura para espreitar
            </button>
          ) : (
            <span className="tiny">A ajuda aparece daqui a {25 - moves} jogadas</span>
          )}
        </div>
      )}
    </section>
  )
}
