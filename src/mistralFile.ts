import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import * as dotenv from "dotenv";
dotenv.config();

// console.log("Loaded API key: MISTRAL", process.env.MISTRAL_API_KEY);

export async function uploadFileToMistral(filePath: string) {
    const form = new FormData();
    form.append("file", fs.createReadStream(filePath));
    form.append("purpose", "ocr");
    // console.log("API key:", process.env.MISTRAL_API_KEY);

    try {
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
        console.log("Upload file Successful####");
        return response.data; // Contains file ID, etc.
    } catch (error: any) {
        // Axios error handling
        if (error.response) {
            // Server responded with a status code outside 2xx
            console.error("Upload failed:", {
                status: error.response.status,
                data: error.response.data,
                headers: error.response.headers,
            });
            throw new Error(
                `Upload failed with status ${error.response.status}: ${JSON.stringify(error.response.data)}`
            );
        } else if (error.request) {
            // Request was made but no response received
            console.error("No response received:", error.request);
            throw new Error("No response received from Mistral API during upload.");
        } else {
            // Something else happened
            console.error("Error during upload:", error.message);
            throw new Error(`Unexpected error during upload: ${error.message}`);
        }
    }
}

export async function getSignedUrlFromMistral(fileId: string, expiry: number = 24) {
    console.log("Inside signed Url");
    
    const response = await axios.get(
        `https://api.mistral.ai/v1/files/${fileId}/url?expiry=${expiry}`,
        {
            headers: {
                Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
                "Content-Type": "application/json"
            }
        }
    );
    return response.data.url;
}
