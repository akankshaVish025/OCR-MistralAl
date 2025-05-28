import { readFileSync } from "fs";
import { extname } from "path";

export function fileToBase64(filePath: string): { base64: string, mime: string 
} {
    const data = readFileSync(filePath);
    const ext = extname(filePath).toLowerCase();
    let mime = "application/octet-stream";
    if (ext === '.pdf') mime = "application/pdf";
    if (ext === '.png') mime = "image/png";
    if (ext === '.jpg' || ext === ".jpeg") mime = "image/jpeg";
    return { base64: data.toString("base64"), mime };
}

