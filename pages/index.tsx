import Head from 'next/head'
import { useRouter } from 'next/router'
import { useState } from 'react'

export default function Home() {
  const router = useRouter()
  const [isRouting, setIsRouting] = useState(false)
  const [id, setId] = useState('')

  const goToPage = () => {
    setIsRouting(true)
    void router.push('/[note]', `/${id}`)
  }

  return (
    <div style={{ display: 'flex', width: '100vw', maxWidth: '100%', height: '100%' }}>
      <Head>
        <title>Bös: Ultimate checklist</title>
      </Head>

      <div
        style={{
          display: 'flex',
          flex: '1 0 auto',
          flexDirection: 'column',
          maxWidth: '500px',
          margin: '0 auto',
        }}
      >
        <main
          style={{
            display: 'flex',
            flex: '1 0 0',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
          }}
        >
          <h1>Welcome to Bös</h1>
          <div className="intro-text">Minimalistic and simple checklist sharing.</div>
          <div className="intro-text">
            Enter a hard to guess string below, like 'AlexCoolShoppingList2000' and click 'go'.
          </div>
          <div className="intro-text">
            Share the checklist by simply sending the URL to your friends. Secure? Not completely.
            But it sure is simple. And no one cares about your shoppling list anyway.
          </div>
          <input
            value={id}
            onChange={(e) => setId(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                goToPage()
              }
            }}
            disabled={isRouting}
          />
          <button onClick={goToPage} disabled={isRouting}>
            Go
          </button>
        </main>

        <footer
          style={{
            display: 'flex',
            padding: '20px 0',
            borderTop: '1px solid #eaeaea',
            justifyContent: 'center',
          }}
        >
          <span>
            Bugs or suggestions? Project is on{' '}
            <a href="https://github.com/pgsandstrom/PloxNotes2">Github</a>.
          </span>
        </footer>
      </div>
      <style jsx>{`
        .intro-text {
          margin-bottom: 10px;
        }
      `}</style>
    </div>
  )
}
