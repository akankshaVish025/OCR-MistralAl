// import { Mistral } from "@mistralai/mistralai";
// import * as dotenv from "dotenv";
// dotenv.config();


// const client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY });

// export async function structureWithLLM(text: string) {
//     try {
//         const response = await client.chat.complete({
//             model: "mistral-7b",
//             messages: [
//                 {
//                     role: "user",
//                     content: `Extract structured information from this document and return as JSON. Document:\n${text}`,
//                 },
//             ],
//             responseFormat: { type: "json_object" },
//         });

//         if (!response.choices || !response.choices[0]?.message?.content) {
//             throw new Error("No choices returned from LLM response");
//         }
//         return response.choices[0].message.content;
//         // OR
//         // return response.choices?.[0]?.message?.content ?? "";
//     } catch (error) {
//         console.error("Error structuring with Mistral", error);
//     }
// }

import axios from "axios";
import * as dotenv from "dotenv";
dotenv.config();

// Optional: Define the expected structure of the JSON output
// interface StructuredBankData {
//     bankName?: string;
//     branchAddress?: string;
//     ifscCode?: string;
//     accountNumber?: string;
//     date?: string;
//     [key: string]: any;
// }

// console.log("Loaded API key: LLM", process.env.MISTRAL_API_KEY);

if (!process.env.MISTRAL_API_KEY) {
    throw new Error("MISTRAL_API_KEY is not set in your environment variables.");
}

export async function structureWithLLM(markdown: string) {
    console.log("Inside LLM$$$$");

    try {
        const prompt = `
        Analyze the following document OCR text (in markdown). 
        Extract all structured information you can find and return it as valid JSON.
        Group related fields into objects or arrays as appropriate.
        Use the text and tables to infer field names and values.
        If you find tables, convert them into arrays of objects with appropriate keys.
        If you find key-value pairs, include them as fields in the JSON.
        If a value is missing, use null.
        Do not include any explanation or extra text—return only the JSON object:
        ${markdown}
        `.trim();

        const payload = {
            model: "open-mistral-7b", // Use the correct model name for your deployment
            messages: [
                {
                    role: "system",
                    content: "You are a helpful assistant that extracts structured data from OCR text. Return only valid JSON.",
                },
                {
                    role: "user",
                    content: prompt,
                }
            ],
            response_format: { type: "json_object" }, // Note: Use snake_case for raw HTTP
            temperature: 0.2
        };

        const response = await axios.post(
            "https://api.mistral.ai/v1/chat/completions",
            payload,
            {
                headers: {
                    "Authorization": `Bearer ${process.env.MISTRAL_API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        const content = response.data.choices?.[0]?.message?.content;
        if (!content) {
            throw new Error("No content returned from LLM response");
        }

        // Parse the JSON output from the LLM
        const structured = JSON.parse(content);
        return structured;
    } catch (error: any) {
        console.error("Error structuring with Mistral:", error?.response?.data || error.message || error);
        return null;
    }
}
