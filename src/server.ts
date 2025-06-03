import express, { Request, Response } from "express";
import multer from "multer";
import { join } from "path";
import { processWithOCR } from "./ocr";
import { structureWithLLM } from "./llm";
import { uploadFileToMistral, getSignedUrlFromMistral } from "./mistralFile";
import { convertPDFToImages, convertExcelToImages } from "./utils/converters";
import { fileToBase64, splitMarkdown, structureLargeMarkdown } from "./utils";
import fs from "fs";

const app = express();
const upload = multer({ dest: join(__dirname, "../uploads/") });

const MAX_FILE_SIZE_MB = 20; // Mistral's typical limit per file
const SUPPORTED_MIMETYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel"
];

//** Working correctly */
app.post("/api/ocr", upload.single("file"), async (req: Request, res: Response) => {
    try {
        if(!req.file) {
            res.status(400).json({ error: "No file uploaded" });
            return;
        }

        const mimetype = req.file.mimetype;
        // 1. Upload file to Mistral storage
        const uploadResult = await uploadFileToMistral(req.file.path);
        const fileId = uploadResult.id;
        if (!fileId) throw new Error("Failed to upload file to Mistral storage");

        // 2. Get signed URL for OCR
        const signedUrl = await getSignedUrlFromMistral(fileId);
        if (!signedUrl) throw new Error("Failed to get signed URL from Mistral");

        // 3. Remove local file after upload
        fs.unlinkSync(req.file.path);

        // Choose OCR type based on file mimetype
        let ocrType: "document_url" | "image_url";
        let ocrField: "document_url" | "image_url";
        if (mimetype.startsWith("application/")) {
            ocrType = "document_url";
            ocrField = "document_url";
        } else if (mimetype.startsWith("image/")) {
            ocrType = "image_url";
            ocrField = "image_url";
        } else {
            res.status(400).json({ error: "Unsupported file type" });
            return;
        }

        // OCR processing
        const ocrResult = await processWithOCR({
            type: ocrType,
            url: signedUrl,
            field: ocrField
        });
        // console.log("OCR_RESULT****", ocrResult);
        
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

//** Chunking function */
// app.post("/api/ocr", upload.single("file"), async (req: Request, res: Response) => {
//     try {
//         if(!req.file) {
//             res.status(400).json({ error: "No file uploaded" });
//             return;
//         }

//         const mimetype = req.file.mimetype;
//         // 1. Upload file to Mistral storage
//         const uploadResult = await uploadFileToMistral(req.file.path);
//         const fileId = uploadResult.id;
//         if (!fileId) throw new Error("Failed to upload file to Mistral storage");

//         // 2. Get signed URL for OCR
//         const signedUrl = await getSignedUrlFromMistral(fileId);
//         if (!signedUrl) throw new Error("Failed to get signed URL from Mistral");

//         // 3. Remove local file after upload
//         fs.unlinkSync(req.file.path);

//         // Choose OCR type based on file mimetype
//         let ocrType: "document_url" | "image_url";
//         let ocrField: "document_url" | "image_url";
//         if (mimetype.startsWith("application/")) {
//             ocrType = "document_url";
//             ocrField = "document_url";
//         } else if (mimetype.startsWith("image/")) {
//             ocrType = "image_url";
//             ocrField = "image_url";
//         } else {
//             res.status(400).json({ error: "Unsupported file type" });
//             return;
//         }

//         // OCR processing
//         const ocrResult = await processWithOCR({
//             type: ocrType,
//             url: signedUrl,
//             field: ocrField
//         });
//         // console.log("OCR_RESULT****", ocrResult);
        
//         // Add null check for ocrResult
//         if (!ocrResult) throw new Error("OCR processing failed");
//         // 1. Combine all page markdown
//         const allMarkdown = ocrResult.pages?.map((p: any) => p.markdown).join("\n\n");
//         if (!allMarkdown) throw new Error("No markdown extracted from OCR");

//         // 2.Run LLM on markdown in chunks
//         const structuredChunks = await structureLargeMarkdown(allMarkdown);
//         // 3. Return result
//         res.json({ chunks: structuredChunks });
//     }
//     catch(error) {
//         res.status(500).json({ error: (error as Error).message });
//     }
// });

// app.post("/api/convertDocToImagesOcr", upload.single("file"), async (req: Request, res: Response) => {
//   try {
//     if (!req.file) {
//       res.status(400).json({ error: "No file uploaded" });
//       return;
//     }

//     const mimetype = req.file.mimetype;
//     let imagePaths: string[] = [];
//     let tempFiles: string[] = [req.file.path];

//     // Step 1: Convert to images
//     if (mimetype === "application/pdf") {
//       imagePaths = await convertPDFToImages(req.file.path);
//     } else if (mimetype.includes("spreadsheet")) {
//       imagePaths = await convertExcelToImages(req.file.path);
//     } else {
//       res.status(400).json({ error: "Only PDF and Excel files are supported" });
//       return;
//     }
//     tempFiles.push(...imagePaths);

//     // Step 2: OCR and LLM processing
//     let allMarkdown = "";
//     for (const imagePath of imagePaths) {
//       const uploadResult = await uploadFileToMistral(imagePath);
//       const signedUrl = await getSignedUrlFromMistral(uploadResult.id);
//       const ocrResult = await processWithOCR({
//         type: "image_url",
//         url: signedUrl,
//         field: "image_url"
//       });
//       allMarkdown += ocrResult.pages?.map((p: any) => p.markdown).join("\n\n") + "\n\n";
//     }

//     // Cleanup temp files
//     tempFiles.forEach(f => { if (fs.existsSync(f)) fs.unlinkSync(f); });

//     // Step 3: LLM structuring
//     const structured = await structureWithLLM(allMarkdown);
//     res.json({ structured });
//   } catch (error: any) {
//     res.status(500).json({ error: error.message });
//   }
// });

// app.post("/api/convertDocToImagesOcr", upload.single("file"), async (req: Request, res: Response) => {
//   let tempFiles: string[] = [];
//   let tempDirs: string[] = [];
//   try {
//     // Step 0: Validate file
//     if (!req.file) {
//       res.status(400).json({ error: "No file uploaded" });
//       return;
//     }
//     if (req.file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
//       res.status(413).json({ error: `File too large. Max allowed is ${MAX_FILE_SIZE_MB} MB.` });
//       return;
//     }
//     if (!SUPPORTED_MIMETYPES.includes(req.file.mimetype)) {
//       res.status(400).json({ error: "Only PDF and Excel files are supported" });
//       return;
//     }

//     const mimetype = req.file.mimetype;
//     let imagePaths: string[] = [];
//     tempFiles.push(req.file.path);

//     // Step 1: Convert to images
//     if (mimetype === "application/pdf") {
//       imagePaths = await convertPDFToImages(req.file.path);
//       console.log("IMAGE", imagePaths);
      
//     } else if (mimetype.includes("spreadsheet") || mimetype.includes("excel")) {
//       const { images, tempDir } = await convertExcelToImages(req.file.path);
//       imagePaths = images;
//       tempDirs.push(tempDir); // Track temp dir for later cleanup
//     } else {
//       res.status(400).json({ error: "Only PDF and Excel files are supported" });
//       return;
//     }
//     tempFiles.push(...imagePaths);

//     // Step 2: OCR and LLM processing
//     let allMarkdown = "";
//     for (const imagePath of imagePaths) {
//       const uploadResult = await uploadFileToMistral(imagePath);
//       const signedUrl = await getSignedUrlFromMistral(uploadResult.id);
//       const ocrResult = await processWithOCR({
//         type: "image_url",
//         url: signedUrl,
//         field: "image_url"
//       });
//       allMarkdown += ocrResult.pages?.map((p: any) => p.markdown).join("\n\n") + "\n\n";
//     }

//     // Step 3: LLM structuring
//     const structured = await structureWithLLM(allMarkdown);

//     // Cleanup temp files and folders
//     tempFiles.forEach(f => { if (fs.existsSync(f)) fs.unlinkSync(f); });
//     tempDirs.forEach(d => { if (fs.existsSync(d)) fs.rmSync(d, { recursive: true, force: true }); });

//     res.json({ structured });
//   } catch (error: any) {
//     // Cleanup on error
//     tempFiles.forEach(f => { if (fs.existsSync(f)) fs.unlinkSync(f); });
//     tempDirs.forEach(d => { if (fs.existsSync(d)) fs.rmSync(d, { recursive: true, force: true }); });
//     res.status(500).json({ error: error.message });
//   }
// });


const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
    console.log(`Mistral OCR API running on http://localhost:${PORT}`);
});
server.timeout = 10 * 60 * 1000; // 10 minutes


