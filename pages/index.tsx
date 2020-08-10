import Head from 'next/head'

export default function Home() {
  //TODO fix this whole page.
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
          }}
        >
          <h1>Welcome to Bös</h1>
          <div>
            Minimalistic and simple checklist sharing. Enter a hard to guess string below, like
            'AlexCoolShoppingList2000' and click 'go'. Share the checklist by simply sending the URL
            to your friends. Secure? Not completely. But it sure is simple. And no one cares about
            your shoppling list anyway.
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
    </div>
  )
}
