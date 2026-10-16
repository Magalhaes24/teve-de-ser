import { useEffect } from 'react'
import confetti from 'canvas-confetti'
import { COLORS, IMG, LETTER, NOME, ORDER } from '../content.js'

export default function Finale({ onRestart }) {
  useEffect(() => {
    const t = setTimeout(
      () => confetti({ particleCount: 160, spread: 110, startVelocity: 40, origin: { y: 0.4 }, colors: COLORS }),
      500,
    )
    return () => clearTimeout(t)
  }, [])

  return (
    <section className="finale">
      <div className="reveal-img">
        <img src={IMG.jardineiras} alt="Jardineiras da Favorite People com padrão de triângulos verdes, roxos e amarelos" />
      </div>
      <div className="card letter">
        <span className="eyebrow">Para a {NOME}</span>
        <h1 className="display">{LETTER.title}</h1>
        {LETTER.lines.map((l, i) => (
          <p key={i} className="lead" style={{ '--i': i }}>
            {l}
          </p>
        ))}
        <div className="polaroid">
          <img src={IMG.espelho} alt="Chancha a usar as jardineiras ao espelho" />
        </div>
      </div>
      <div className="order">
        <span className="order-title">A caminho 📦</span>
        <div className="order-row">
          <span>Número da encomenda</span>
          <b>{ORDER.number}</b>
        </div>
        <div className="order-row">
          <span>Número de acompanhamento</span>
          <b>{ORDER.tracking}</b>
        </div>
      </div>
      <button className="btn ghost" onClick={onRestart}>
        Rever desde o início
      </button>
    </section>
  )
}
