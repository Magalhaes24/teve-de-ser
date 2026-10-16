import { useState } from 'react'
import { IMG, NOME } from '../content.js'

export default function Intro({ onNext }) {
  const [open, setOpen] = useState(false)

  const go = () => {
    setOpen(true)
    setTimeout(onNext, 650)
  }

  return (
    <section className={`intro ${open ? 'leaving' : ''}`}>
      <div className="gift-wrap">
        <div className="ribbon-tag">Para ti</div>
        <div className="gift-photo">
          <img src={IMG.selfie} alt="" />
        </div>
      </div>
      <h1 className="display">
        Olá, {NOME}.<br />
        <span>Tens um presente à tua espera.</span>
      </h1>
      <p className="lead">
        Mas não é assim tão fácil. Para o desembrulhares vais ter de resolver <b>3 desafios</b>. Pensa bem, confia no teu
        instinto e diverte-te.
      </p>
      <button className="btn primary big" onClick={go}>
        Começar
        <span className="arrow">→</span>
      </button>
      <p className="tiny">Demora uns 5 minutinhos ⏱️</p>
    </section>
  )
}
