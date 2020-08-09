import Head from "next/head";
import styles from "../styles/Home.module.css";

export default function Home() {
  //TODO fix this whole page.
  return (
    <div className={styles.container}>
      <Head>
        <title>Bös: Ultimate checklist</title>
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>Welcome to Bös</h1>
      </main>

      <footer className={styles.footer}>Powered by me</footer>
    </div>
  );
}
