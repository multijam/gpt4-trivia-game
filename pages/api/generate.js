import { Configuration, OpenAIApi } from "openai";
import {GAME_SYSTEM_PROMPT, GALAXY_BRAIN_SYSTEM_PROMPT, FUNNY_FILTER_SYSTEM_PROMPT} from "./constants.js"

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const conversation = []
const galaxyBrainConversation = []

export default async function (req, res) {
  if (!configuration.apiKey) {
    res.status(500).json({
      error: {
        message: "OpenAI API key not configured, please follow instructions in README.md",
      }
    });
    return;
  }

  const playerInput = req.body.playerInput || '';
  if (playerInput.trim().length === 0) {
    res.status(400).json({
      error: {
        message: "Please enter a valid animal",
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
    galaxyBrainConversation.push({
      role: "user",
      content: `
        human: ${newUserInput.content},
        caveman: ${newAnswer.content}
      `
    })
    res.status(200).json({ result: completion.data });
    // const commentary = await openai.createChatCompletion({
    //   model: "gpt-4",
    //   frequency_penalty: 1,
    //   max_tokens: 256,
    //   presence_penalty: 1,
    //   stream: false,
    //   temperature: 0.9,
    //   top_p: .8,
    //   messages: [
    //     {role: "system", content: GALAXY_BRAIN_SYSTEM_PROMPT},
    //     ...galaxyBrainConversation
    //   ],
    //   temperature: 0.6,
    // });
    // let commentaryItem = commentary.data.choices[0].message
    // const funnyFilter = await openai.createChatCompletion({
    //   model: "gpt-4",
    //   frequency_penalty: 1,
    //   max_tokens: 256,
    //   presence_penalty: 1,
    //   stream: false,
    //   temperature: 0.6,
    //   top_p: .8,
    //   messages: [
    //     {role: "system", content: FUNNY_FILTER_SYSTEM_PROMPT},
    //     { role: "user",
    //       content: `
    //         human: ${newUserInput.content},
    //         caveman: ${newAnswer.content},
    //         comedian: ${commentaryItem.content},
    //     `}
    //   ],
    //   temperature: 0.6,
    // });
    // galaxyBrainConversation.push(commentary.data.choices[0].message)
    // console.log("funny?")
    // console.log(funnyFilter.data.choices[0].message.content)
    // console.log(galaxyBrainConversation.length)
    // console.log(commentaryItem)
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
