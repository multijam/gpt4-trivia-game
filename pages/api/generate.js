import { Configuration, OpenAIApi } from "openai";
import {GAME_SYSTEM_PROMPT, GALAXY_BRAIN_SYSTEM_PROMPT, FUNNY_FILTER_SYSTEM_PROMPT} from "./constants.js"
import { initializeApp, cert, getApps } from "firebase-admin/app"
import { getFirestore, Timestamp, FieldValue } from "firebase-admin/firestore"
import serviceAccount from "../../firebaseServiceAccountKey.json"


if (getApps().length === 0) {
  initializeApp({
    credential: cert(serviceAccount)
  });
}

const db = getFirestore();

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const conversation = []

export default async function (req, res) {
  if (!configuration.apiKey) {
    res.status(500).json({
      error: {
        message: "OpenAI API key not configured, please follow instructions in README.md",
      }
    });
    return;
  }

  const userID = req.body.userID;
  if (!userID) {
    res.status(400).json({
      error: {
        message: "UserID required with request. This is a dev error, please let us know if you see this!",
      }
    });
    return;
  }

  const sessionsRef = db.collection('sessions');
  const snapshot = await sessionsRef.where('userID', '==', userID).get();

  let sessionDocRef;
  if (snapshot.empty) {
    const data = {
      userID: userID,
      conversation: [],
    }
    sessionDocRef = db.collection('sessions').doc(crypto.randomUUID());
    const res = await sessionDocRef.set(data);
  } else {
    sessionDocRef = snapshot.docs[0].ref
  }

  const playerInput = req.body.playerInput || '';
  if (playerInput.trim().length === 0) {
    res.status(400).json({
      error: {
        message: "Please enter a valid message",
      }
    });
    return;
  }

  try {
    let newUserInput = {role: "user", content: playerInput}
    conversation.push(newUserInput)
    const completion = await openai.createChatCompletion({
      model: "gpt-4",
      frequency_penalty: 1,
      max_tokens: 256,
      presence_penalty: 1,
      stream: false,
      temperature: 0.8,
      top_p: .7,
      messages: [
        {role: "system", content: GAME_SYSTEM_PROMPT},
        ...conversation
      ],
      temperature: 0.6,
    });
    let newAnswer = completion.data.choices[0].message
    conversation.push(newAnswer)
    res.status(200).json({ result: completion.data });

    // update the conversation in firebase
    sessionDocRef.update({
      conversation: FieldValue.arrayUnion(newUserInput, newAnswer)
    })
  } catch(error) {
    // Consider adjusting the error handling logic for your use case
    if (error.response) {
      console.error(error.response.status, error.response.data);
      res.status(error.response.status).json(error.response.data);
    } else {
      console.error(`Error with OpenAI API request: ${error.message}`);
      res.status(500).json({
        error: {
          message: 'An error occurred during your request.',
        }
      });
    }
  }
}
