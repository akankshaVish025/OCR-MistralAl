// import { Mistral } from "@mistralai/mistralai";
// import * as dotenv from "dotenv";
// import { fileToBase64 } from "./utils";
// dotenv.config();

// const client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY });

// export async function processWithOCR(filePath: string) {
//     try {
//         const { base64, mime } = fileToBase64(filePath);
//         console.log(base64, mime , "FERE");
        
//         const documentUrl = `data:${mime};base64,${base64}`;
//         console.log("DOCUMENT URL", documentUrl);
        
//         const ocrResponse = await client.ocr.process({
//             model: "mistral-ocr-latest",
//             document: {
//             type: "document_url",
//             documentUrl: documentUrl,
//         },
//         includeImageBase64: true
//         });

//         console.log("OCR RESPONSE:", ocrResponse);
//         return ocrResponse;
//     } catch (error) {
//         console.error("Error processing OCR:", error);
//     }
// }

// ocr.ts
import axios from "axios";
import * as dotenv from "dotenv";
import { fileToBase64 } from "./utils";
dotenv.config();

export async function processWithOCR(documentUrl: string) {
    // const { base64, mime } = fileToBase64(filePath);
    // const documentUrl = `data:${mime};base64,${base64}`;
    try {
        const response = await axios.post(
            "https://api.mistral.ai/v1/ocr",
            {
                model: "mistral-ocr-latest",
                document: {
                    type: "document_url",
                    document_url: documentUrl
                }
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );
        return response.data;
    } catch (error: any) {
        console.error("Error processing OCR:", error.response ? error.response.data : error);
        throw error;
    }
}
