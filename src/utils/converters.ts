import fs from "fs";
import path from "path";
import libre from "libreoffice-convert";
import { fromPath } from "pdf2pic";
import { execSync } from "child_process";

const tempDir = path.join(__dirname, "../temp");
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

// Convert PDF to images (1 image per page)
export async function convertPDFToImages(pdfPath: string): Promise<string[]> {
    const options = {
        density: 300,
        format: "png",
        width: 2480,
        height: 3508,
        savePath: tempDir,
        saveFilename: path.parse(pdfPath).name
    };

    console.log("Converting PDF to IMAGE@@@ ");
    
    const convert = fromPath(pdfPath, options);
    console.log(convert, "CONVERT%%%%%");
    
    const result = await convert.bulk(-1); // Convert all pages
    console.log("RESULT", result);
    
    return result.map(page => page.path)
    .filter((p): p is string => typeof p === "string");
}

// Convert Excel to PDF
// export async function convertExcelToImages(excelPath: string): Promise<string[]> {
//     const outputDir = path.join(tempDir, `excel-images-${Date.now()}`);
//     fs.mkdirSync(outputDir);

//     try {
//         console.log("Converting EXCEL to IMAGE@@@ ");

//         // Use LibreOffice to convert Excel directly to PNG images
//         execSync(`libreoffice --headless --convert-to png --outdir "${outputDir}" "${excelPath}"`, { stdio: "ignore" });

//         // Find all PNG files generated in the output directory
//         const imageFiles = fs.readdirSync(outputDir)
//         .filter(file => file.toLowerCase().endsWith(".png"))
//         .map(file => path.join(outputDir, file));

//         if (imageFiles.length === 0) {
//             throw new Error("No images generated from Excel file");
//         }

//         return imageFiles;
//     } catch (error: any) {
//         // Cleanup on error
//         fs.rmSync(outputDir, { recursive: true, force: true });
//         throw new Error(`Excel to image conversion failed: ${error.message}`);
//     }
// }

export async function convertExcelToImages(excelPath: string): Promise<{ images: string[], tempDir: string }> {
    const outputDir = path.join(tempDir, `excel-images-${Date.now()}`);
    fs.mkdirSync(outputDir);

    try {
        console.log("Converting Excel to IMAGE@@@ ");

        // Use LibreOffice or a cloud service (like ConvertAPI[6]) for conversion
        execSync(`libreoffice --headless --convert-to png --outdir "${outputDir}" "${excelPath}"`, { stdio: "ignore" });

        const imageFiles = fs.readdirSync(outputDir)
            .filter(file => file.toLowerCase().endsWith(".png"))
            .map(file => path.join(outputDir, file));

        if (imageFiles.length === 0) {
            throw new Error("No images generated from Excel file");
        }

        return { images: imageFiles, tempDir: outputDir };
    } catch (error: any) {
        fs.rmSync(outputDir, { recursive: true, force: true });
        throw new Error(`Excel to image conversion failed: ${error.message}`);
    }
}