import { Mistral } from "@mistralai/mistralai";
import * as dotenv from "dotenv";
dotenv.config();

console.log("Loaded API key:", process.env.MISTRAL_API_KEY);
const client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY });

export async function structureWithLLM(text: string) {
    try {
        const response = await client.chat.complete({
            model: "mistral-7b",
            messages: [
                {
                    role: "user",
                    content: `Extract structured information from this document and return as JSON. Document:\n${text}`,
                },
            ],
            responseFormat: { type: "json_object" },
        });

        if (!response.choices || !response.choices[0]?.message?.content) {
            throw new Error("No choices returned from LLM response");
        }
        return response.choices[0].message.content;
        // OR
        // return response.choices?.[0]?.message?.content ?? "";
    } catch (error) {
        console.error("Error structuring with Mistral", error);
    }
}
