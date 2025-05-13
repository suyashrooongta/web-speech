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
  // Add other parameters as needed based on Krutrim's API (e.g., temperature, max_tokens)
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
  const conversation: KrutrimChatMessage[] = [
    {
      role: "system",
      content:
        "You are a helpful assistant. The user input will be some transcribed text with potential errors. Please correct the text and return only that, nothing else. Do not improve the text in any other way.",
    },
    {
      role: "user",
      content: req.query.transcript as string,
    },
  ];
  const modelToUse = "Llama-4-Scout-17B-16E-Instruct";
  const response = await callKrutrimChatCompletions(conversation, modelToUse);
  res.status(200).json({ response: response || "No response" });
}
