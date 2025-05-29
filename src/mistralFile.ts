// mistralFile.ts
import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import * as dotenv from "dotenv";
dotenv.config();

console.log("Loaded API key: MISTRAL", process.env.MISTRAL_API_KEY);

export async function uploadFileToMistral(filePath: string) {
    const form = new FormData();
    form.append("file", fs.createReadStream(filePath));
    form.append("purpose", "ocr");

    const response = await axios.post(
        "https://api.mistral.ai/v1/files",
        form,
        {
            headers: {
                ...form.getHeaders(),
                Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
        }
    );
    return response.data; // Contains file ID, etc.
}

export async function getSignedUrlFromMistral(fileId: string, expiry: number = 24) {
    const response = await axios.post(
        "https://api.mistral.ai/v1/files/${fileId}/url?expiry=${expiry}",
        { file_id: fileId },
        {
            headers: {
                Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
                "Content-Type": "application/json"
            }
        }
    );
    return response.data.url;
}
