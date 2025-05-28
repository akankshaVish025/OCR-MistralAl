import express, { Request, Response } from "express";
import multer from "multer";
import { join } from "path";
import { processWithOCR } from "./ocr";
import { structureWithLLM } from "./llm";
import fs from "fs";

const app = express();
const upload = multer({ dest: join(__dirname, "../uploads/") });

app.post("/api/ocr", upload.single("file"), async (req: Request, res: Response) => {
    try {
        if(!req.file) {
            res.status(400).json({ error: "No file uploaded" });
            return;
        }

        // OCR processing
        const ocrResult = await processWithOCR(req.file.path);
        // Add null check for ocrResult
        if (!ocrResult) throw new Error("OCR processing failed");
        // For multi-page: concatenate text
        const allText = ocrResult.pages.map((p: any) => p.text).join("\n\n");

        // LLM structuring
        const structured = await structureWithLLM(allText);

        // Clean up uploaded file
        fs.unlinkSync(req.file.path);

        res.json({ structured });
    }
    catch(error) {
        res.status(500).json({ error: (error as Error).message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Mistral OCR API running on http://localhost:${PORT}`);
});


