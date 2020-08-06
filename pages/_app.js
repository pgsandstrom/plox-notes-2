import Head from "next/head";
import "../styles/globals.css";

function MyApp({ Component, pageProps }) {
  console.log("PLOX");
  return (
    <>
      <Head>
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto&display=swap"
          rel="stylesheet"
        />
      </Head>
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;
