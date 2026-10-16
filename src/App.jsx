import { useEffect, useState } from 'react'
import Intro from './components/Intro.jsx'
import Murdoku from './components/Murdoku.jsx'
import Wordle from './components/Wordle.jsx'
import Puzzle from './components/Puzzle.jsx'
import Finale from './components/Finale.jsx'

const STAGES = ['intro', 'murdle', 'wordle', 'puzzle', 'finale']
const STEPS = [
  { key: 'murdle', label: 'Murdoku' },
  { key: 'wordle', label: 'Palavra' },
  { key: 'puzzle', label: 'Puzzle' },
  { key: 'finale', label: 'Presente' },
]

function loadStage() {
  try {
    if (new URLSearchParams(location.search).has('reset')) localStorage.removeItem('presente-stage')
    const s = localStorage.getItem('presente-stage')
    return STAGES.includes(s) ? s : 'intro'
  } catch {
    return 'intro'
  }
}

export default function App() {
  const [stage, setStage] = useState(loadStage)

  useEffect(() => {
    try {
      localStorage.setItem('presente-stage', stage)
    } catch {}
    window.scrollTo({ top: 0 })
  }, [stage])

  const next = () => setStage((s) => STAGES[Math.min(STAGES.indexOf(s) + 1, STAGES.length - 1)])
  const idx = STEPS.findIndex((s) => s.key === stage)

  return (
    <div className="app">
      <div className="bg" aria-hidden="true" />
      {stage !== 'intro' && (
        <nav className="progress" aria-label="Progresso">
          {STEPS.map((s, i) => (
            <div key={s.key} className={`step ${i < idx ? 'done' : ''} ${i === idx ? 'now' : ''}`}>
              <span className="dot">{i < idx ? '✓' : i + 1}</span>
              <span className="lbl">{s.label}</span>
            </div>
          ))}
        </nav>
      )}
      <main className="stage" key={stage}>
        {stage === 'intro' && <Intro onNext={next} />}
        {stage === 'murdle' && <Murdoku onNext={next} />}
        {stage === 'wordle' && <Wordle onNext={next} />}
        {stage === 'puzzle' && <Puzzle onNext={next} />}
        {stage === 'finale' && <Finale onRestart={() => setStage('intro')} />}
      </main>
    </div>
  )
}
