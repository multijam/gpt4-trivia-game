import Head from "next/head";
import { useState } from "react";
import styles from "./index.module.css";
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

if (typeof window !== "undefined" ){
// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyBvybCWxyE5kjRICsxXsyykK6Xnx8IVKw8",
    authDomain: "turing-test-37976.firebaseapp.com",
    projectId: "turing-test-37976",
    storageBucket: "turing-test-37976.appspot.com",
    messagingSenderId: "109122874976",
    appId: "1:109122874976:web:1c9edab030111348db1d05",
    measurementId: "G-Q9VVES0Q31"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
}

export default function Home() {
  const [playerInput, setPlayerInput] = useState("");
  const [conversation, setConversation] = useState([]);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event) {
    event.preventDefault();
    setConversation([...conversation, { role: "user", content: playerInput }]);
    setPlayerInput("");
    try {
      setLoading(true);
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ playerInput: playerInput }),
      });
      const data = await response.json();
      if (response.status !== 200) {
        throw data.error || new Error(`Request failed with status ${response.status}`);
      }
      setConversation([...conversation, { role: "user", content: playerInput }, data.result.choices[0].message]);
      setLoading(false);
    } catch(error) {
      // Consider implementing your own error handling logic here
      setLoading(false);
      console.error(error);
      alert(error.message);
    }
  }

  return (
    <div>
      <Head>
        <title>OpenAI Quickstart</title>
        <link rel="icon" href="/dog.png" />
      </Head>

      <main className={styles.main}>
        <h1>This AI is keeping secrets.</h1>
        <h2>It's your job to guess them.</h2>
        { conversation.length < 1 ? (
          <>
            <p>The daily secret codes are the same for everyone... sort of like Wordle. After you've solved them, you can ask the AI to make up more secret phrases.</p>
            <p>Start by introducing yourself and asking for a hint.</p>
            <p>{`(Note: for some reason the AI thinks it's a caveman)`}</p>
          </>
        ) : null }
        <form style={{transition: "bottom 1s", bottom: conversation.length < 1 ? "200px" : "0px"}}onSubmit={onSubmit}>
          <input
            type="text"
            name="playerInput"
            placeholder="talk to the AI"
            value={playerInput}
            onChange={(e) => setPlayerInput(e.target.value)}
          />
          <input type="submit" value={loading ? "..." : "Send"} disabled={loading}/>
        </form>
        <div className={styles.scroll}  style={{overflowY: "scroll", padding: "10px"}}>
          <div style={{
            maxWidth: "800px", width: "calc(100vw - 30px)", display: "flex", flexDirection: "column", justifyContent: "flex-start"
          }}>
            {
              conversation ? conversation.map((message) => {
                return <div key={message.content}  className={message.role === "user" ? styles.user : styles.agent }>{message.content}</div>
              }) : null
            }
          </div>
        </div>
      </main>
    </div>
  );
}
