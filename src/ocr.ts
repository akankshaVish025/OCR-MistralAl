import { Mistral } from "@mistralai/mistralai";
import * as dotenv from "dotenv";
import { fileToBase64 } from "./utils";
dotenv.config();

const client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY });

export async function processWithOCR(filePath: string) {
    try {
        const { base64, mime } = fileToBase64(filePath);
        const documentUrl = `data:${mime};base64,${base64}`;

        const ocrResponse = await client.ocr.process({
            model: "mistral-ocr-latest",
            document: {
            type: "document_url",
            documentUrl: documentUrl,
        },
        includeImageBase64: true
        });

        console.log("OCR RESPONSE:", ocrResponse);
        return ocrResponse;
    } catch (error) {
        console.error("Error processing OCR:", error);
    }
}