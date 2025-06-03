import { readFileSync } from "fs";
import { extname } from "path";
import { structureWithLLM } from "./llm";

export function fileToBase64(filePath: string): { base64: string, mime: string 
} {
    const data = readFileSync(filePath);
    const ext = extname(filePath).toLowerCase();
    console.log(filePath, ext, "Extension");
    
    let mime = "application/octet-stream";
    if (ext === '.pdf') mime = "application/pdf";
    if (ext === '.png') mime = "image/png";
    if (ext === '.jpg' || ext === ".jpeg") mime = "image/jpeg";
    return { base64: data.toString("base64"), mime };
}

export function splitMarkdown(markdown: string, maxTokens = 3000): string[] {
    const paragraphs = markdown.split(/\n\s*\n/);
    const chunks: string[] = [];
    let currentChunk = "";
    let currentTokenCount = 0;

    for (const para of paragraphs) {
        const tokenEstimate = para.split(/\s+/).length;

        if (currentTokenCount + tokenEstimate > maxTokens) {
            chunks.push(currentChunk.trim());
            currentChunk = para + "\n\n";
            currentTokenCount = tokenEstimate;
        } else {
            currentChunk += para + "\n\n";
            currentTokenCount += tokenEstimate;
        }
    }

    if (currentChunk) {
        chunks.push(currentChunk.trim());
    }
    console.log("CHUNKS####: ", chunks );
    
    return chunks;
}

// export async function structureLargeMarkdown(markdown: string): Promise<any[]> {
//     const chunks = splitMarkdown(markdown);
//     const results: any[] = [];

//     console.log(`Processing ${chunks.length} chunks`);

//     for (let i = 0; i < chunks.length; i++) {
//         const structured = await structureWithLLM(chunks[i]);
//         if (structured) results.push(structured);
//     }

//     return results;
// }

export async function structureLargeMarkdown(markdown: string): Promise<any[]> {
    const chunks = splitMarkdown(markdown);
    console.log(`Processing ${chunks.length} chunks in parallel`);

    const results = await Promise.allSettled(
        chunks.map((chunk, i) => {
            console.log(`Dispatching chunk ${i + 1}`);
            return structureWithLLM(chunk);
        })
    );

    const successfulResults = results
        .filter(r => r.status === "fulfilled")
        .map(r => (r as PromiseFulfilledResult<any>).value);

    return successfulResults;
}