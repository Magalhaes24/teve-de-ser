import { useCallback, useEffect, useRef, useState } from 'react'
import confetti from 'canvas-confetti'
import { COLORS, WORD, WORD_HINT } from '../content.js'

const ROWS = 6
const LEN = WORD.length
const KEYS = ['QWERTYUIOP', 'ASDFGHJKL', '+ZXCVBNM-']

const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase()

function evaluate(guess) {
  const res = Array(LEN).fill('absent')
  const left = {}
  for (let i = 0; i < LEN; i++) {
    if (guess[i] === WORD[i]) res[i] = 'correct'
    else left[WORD[i]] = (left[WORD[i]] || 0) + 1
  }
  for (let i = 0; i < LEN; i++) {
    if (res[i] !== 'correct' && left[guess[i]] > 0) {
      res[i] = 'present'
      left[guess[i]]--
    }
  }
  return res
}

const RANK = { absent: 1, present: 2, correct: 3 }

export default function Wordle({ onNext }) {
  const [guesses, setGuesses] = useState([])
  const [current, setCurrent] = useState('')
  const [msg, setMsg] = useState('')
  const [shake, setShake] = useState(0)
  const [reveal, setReveal] = useState(-1) // linha a animar
  const [status, setStatus] = useState('playing')
  const busy = useRef(false)

  const results = guesses.map(evaluate)
  const keyState = {}
  guesses.forEach((g, r) =>
    [...g].forEach((ch, i) => {
      const st = results[r][i]
      if (!keyState[ch] || RANK[st] > RANK[keyState[ch]]) keyState[ch] = st
    }),
  )

  const flash = (t) => {
    setMsg(t)
    setTimeout(() => setMsg((m) => (m === t ? '' : m)), 1600)
  }

  const type = useCallback(
    (ch) => {
      if (status !== 'playing' || busy.current) return
      setCurrent((c) => (c.length < LEN ? c + ch : c))
    },
    [status],
  )
  const del = useCallback(() => {
    if (busy.current) return
    setCurrent((c) => c.slice(0, -1))
  }, [])

  const submit = useCallback(() => {
    if (status !== 'playing' || busy.current) return
    if (current.length < LEN) {
      setShake((s) => s + 1)
      flash('Faltam letras')
      return
    }
    busy.current = true
    const row = guesses.length
    setGuesses((g) => [...g, current])
    setReveal(row)
    const guess = current
    setCurrent('')
    setTimeout(() => {
      busy.current = false
      setReveal(-1)
      if (guess === WORD) {
        setStatus('won')
        confetti({ particleCount: 140, spread: 90, origin: { y: 0.5 }, colors: COLORS })
      } else if (row === ROWS - 1) {
        setStatus('lost')
      }
    }, LEN * 280 + 500)
  }, [current, guesses.length, status])

  useEffect(() => {
    const onKey = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      if (e.key === 'Enter') {
        e.preventDefault()
        submit()
      } else if (e.key === 'Backspace') del()
      else {
        const l = norm(e.key)
        if (e.key.length === 1 && /^[A-Z]$/.test(l)) type(l)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [submit, del, type])

  const retry = () => {
    setGuesses([])
    setCurrent('')
    setStatus('playing')
  }

  const rows = Array.from({ length: ROWS }, (_, r) => {
    if (r < guesses.length) return { letters: guesses[r], res: results[r], done: true }
    if (r === guesses.length) return { letters: current, res: null, done: false, active: true }
    return { letters: '', res: null, done: false }
  })

  return (
    <section className="wordle">
      <header className="ch-head">
        <span className="ch-emoji">🔤</span>
        <div>
          <span className="eyebrow">Desafio 2 · Palavra secreta</span>
          <h2 className="display sm">Qual é a palavra?</h2>
        </div>
      </header>
      <p className="lead small">
        Uma palavra de <b>{LEN} letras</b>, {ROWS} tentativas. Verde: letra certa no sítio certo. Amarelo: existe, mas noutro
        sítio.
      </p>

      <div className="board" role="grid" aria-label="Tabuleiro">
        {rows.map((row, r) => (
          <div key={`${r}-${row.active ? shake : 0}`} className={`wrow ${row.active && shake ? 'shake' : ''}`}>
            {Array.from({ length: LEN }, (_, i) => {
              const ch = row.letters[i] || ''
              const animating = reveal === r
              const st = row.res?.[i]
              return (
                <div
                  key={i}
                  className={`tile ${ch ? 'filled' : ''} ${st && row.done ? 'flip ' + st : ''} ${
                    status === 'won' && r === guesses.length - 1 ? 'win' : ''
                  }`}
                  style={{
                    '--d': `${i * 0.28}s`,
                    '--w': `${i * 0.08}s`,
                    ...(animating ? {} : { animationDuration: '0s', animationDelay: '0s' }),
                  }}
                >
                  <span>{ch}</span>
                </div>
              )
            })}
          </div>
        ))}
      </div>

      <div className="toast-slot">{msg && <div className="toast">{msg}</div>}</div>

      {guesses.length >= 3 && status === 'playing' && <p className="hint">{WORD_HINT}</p>}

      {status === 'won' && (
        <div className="result">
          <p className="lead">
            <b>{WORD}</b>! Exatamente o que eu fiz. 🛍️
          </p>
          <button className="btn primary big" onClick={onNext}>
            Último desafio <span className="arrow">→</span>
          </button>
        </div>
      )}
      {status === 'lost' && (
        <div className="result">
          <p className="lead">
            Quase! Era <b>{WORD}</b>. Tenta outra vez.
          </p>
          <button className="btn primary" onClick={retry}>
            Tentar de novo
          </button>
        </div>
      )}

      {status === 'playing' && (
        <div className="kb">
          {KEYS.map((row, ri) => (
            <div className="kb-row" key={ri}>
              {[...row].map((k) =>
                k === '+' ? (
                  <button key={k} className="key wide" onClick={submit}>
                    Enter
                  </button>
                ) : k === '-' ? (
                  <button key={k} className="key wide" onClick={del} aria-label="Apagar">
                    ⌫
                  </button>
                ) : (
                  <button key={k} className={`key ${keyState[k] || ''}`} onClick={() => type(k)}>
                    {k}
                  </button>
                ),
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
