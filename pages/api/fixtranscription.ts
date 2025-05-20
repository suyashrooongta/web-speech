// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";

const KRUTRIM_CHAT_COMPLETIONS_ENDPOINT =
  "https://cloud.olakrutrim.com/v1/chat/completions"; // Example path, check Krutrim docs

export interface KrutrimChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface KrutrimChatCompletionRequest {
  model: string; // Specify the Krutrim model you want to use
  messages: KrutrimChatMessage[];
  temperature?: number; // Optional parameter, adjust as needed
}

interface KrutrimChatChoice {
  message: KrutrimChatMessage;
}

interface KrutrimChatCompletionResponse {
  choices: KrutrimChatChoice[];
}

export async function callKrutrimChatCompletions(
  messages: KrutrimChatMessage[],
  modelName: string
): Promise<string | null> {
  const headers = new Headers({
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.KRUTRIM_API_KEY}`, // Assuming Bearer token authentication
  });

  const body: KrutrimChatCompletionRequest = {
    model: modelName,
    messages: messages,
    temperature: 0.0,
  };

  const requestOptions: RequestInit = {
    method: "POST",
    headers: headers,
    body: JSON.stringify(body),
  };

  console.log("Request Body:", body); // Log the request body for debugging
  console.log("Request Headers:", headers); // Log the request headers for debugging
  try {
    const response = await fetch(
      KRUTRIM_CHAT_COMPLETIONS_ENDPOINT,
      requestOptions
    );
    if (!response.ok) {
      console.error(
        `Krutrim API Error: ${response.status} - ${response.statusText}`
      );
      const errorData = await response.json();
      console.error("Error Details:", errorData);
      return null;
    }
    const data = (await response.json()) as KrutrimChatCompletionResponse;
    if (data.choices && data.choices.length > 0) {
      return data.choices[0].message.content;
    }
    return null;
  } catch (error) {
    console.error("Error calling Krutrim API:", error);
    return null;
  }
}

type Data = {
  response: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ response: "Method Not Allowed" });
    return;
  }

  const { transcript, context } = req.body as {
    transcript?: string;
    context?: string;
  };

  if (typeof transcript !== "string") {
    res.status(400).json({ response: "Missing or invalid transcript" });
    return;
  }

  const conversation: KrutrimChatMessage[] = [
    {
      role: "system",
      content:
        "You are a helpful assistant. The user input will be some transcribed text with potential errors." +
        (context ? ` Context of the user input: ${context}` : "") +
        "Please correct the text. You can add punctuation. Do not improve the text in any other way - do not add extra words, do not change the order of words.  Return only the corrected text and not any other text.",
    },
    {
      role: "user",
      content: transcript,
    },
  ];
  console.log("Conversation:", conversation); // Log the conversation for debugging
  const modelToUse = "Llama-4-Scout-17B-16E-Instruct";
  const response = await callKrutrimChatCompletions(conversation, modelToUse);
  res.status(200).json({ response: response || "No response" });
}
