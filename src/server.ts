import express, { Request, Response } from "express";
import multer from "multer";
import { join } from "path";
import { processWithOCR } from "./ocr";
import { structureWithLLM } from "./llm";
import { uploadFileToMistral, getSignedUrlFromMistral } from "./mistralFile"
import fs from "fs";

const app = express();
const upload = multer({ dest: join(__dirname, "../uploads/") });

app.post("/api/ocr", upload.single("file"), async (req: Request, res: Response) => {
    try {
        if(!req.file) {
            res.status(400).json({ error: "No file uploaded" });
            return;
        }

        // 1. Upload file to Mistral storage
        const uploadResult = await uploadFileToMistral(req.file.path);
        const fileId = uploadResult.id;
        if (!fileId) throw new Error("Failed to upload file to Mistral storage");

        // 2. Get signed URL for OCR
        const signedUrl = await getSignedUrlFromMistral(fileId);
        if (!signedUrl) throw new Error("Failed to get signed URL from Mistral");

        // 3. Remove local file after upload
        fs.unlinkSync(req.file.path);

        // OCR processing
        const ocrResult = await processWithOCR(signedUrl);
        console.log("OCR_RESULT****", ocrResult);
        
        // Add null check for ocrResult
        if (!ocrResult) throw new Error("OCR processing failed");
        // For multi-page: concatenate text
        const allMarkdown = ocrResult.pages?.map((p: any) => p.markdown).join("\n\n");

        // LLM structuring
        const structured = await structureWithLLM(allMarkdown);

        res.json({ structured });
    }
    catch(error) {
        res.status(500).json({ error: (error as Error).message });
    }
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
    console.log(`Mistral OCR API running on http://localhost:${PORT}`);
});
server.timeout = 10 * 60 * 1000; // 10 minutes


