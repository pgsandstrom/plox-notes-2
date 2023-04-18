import Head from 'next/head'
import Link from 'next/link'
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
          flexDirection: 'column',
          maxWidth: '500px',
          padding: '0 20px',
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
            {"Enter a hard to guess string below, like 'AlexCoolShoppingList2000' and click 'go'."}
          </div>
          <div className="intro-text">
            Share the checklist by simply sending the URL to your friends. Secure? Not completely.
            But it sure is simple. And no one cares about your shopping list anyway.
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
          <button onClick={goToPage} disabled={isRouting} style={{ marginTop: '10px' }}>
            Go
          </button>

          <div style={{ marginTop: '20px', display: 'inline', whiteSpace: 'break-spaces' }}>
            You can swipe on rows to indent them. Or press alt and arrow keys to indent. For you
            awesome vim users out there you can also indent with alt + h/l.
          </div>

          <div style={{ marginTop: '20px', display: 'inline', whiteSpace: 'break-spaces' }}>
            If you are a real bös power user you can also create a list of lists by adding
            &apos;meta&apos; to the start of the url, like{'\n'}
            <Link href="/meta/my-meta-list">https://bös.se/meta/my-meta-list</Link>
          </div>
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
