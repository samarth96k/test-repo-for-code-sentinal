import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import {buildReviewPrompt} from "./prompt.js";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing from .env");
}

const ai = new GoogleGenAI({ apiKey });

const llmReviewSchema = z.object({
    reviews: z.array(
        z.object({
            filename: z.string(),
            line: z.number(),
            severity: z.enum(["low", "medium", "high"]),
            category: z.enum([
                "bug",
                "security",
                "performance",
                "maintainability",
                "error_handling",
                "logic",
                "other",
            ]),
            issue: z.string(),
            suggestion: z.string(),
            githubComment: z.object({
                path: z.string(),
                line: z.number(),
                side: z.literal("RIGHT"),
                body: z.string(),
            }),
        })
    ),
});

type LLMReviewResponse = z.infer<typeof llmReviewSchema>;

const geminiResponseSchema = {
    type: "object",
    properties: {
        reviews: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    filename: { type: "string" },
                    line: { type: "number" },
                    severity: {
                        type: "string",
                        enum: ["low", "medium", "high"],
                    },
                    category: {
                        type: "string",
                        enum: [
                            "bug",
                            "security",
                            "performance",
                            "maintainability",
                            "error_handling",
                            "logic",
                            "other",
                        ],
                    },
                    issue: { type: "string" },
                    suggestion: { type: "string" },
                    githubComment: {
                        type: "object",
                        properties: {
                            path: { type: "string" },
                            line: { type: "number" },
                            side: {
                                type: "string",
                                enum: ["RIGHT"],
                            },
                            body: { type: "string" },
                        },
                        required: ["path", "line", "side", "body"],
                    },
                },
                required: [
                    "filename",
                    "line",
                    "severity",
                    "category",
                    "issue",
                    "suggestion",
                    "githubComment",
                ],
            },
        },
    },
    required: ["reviews"],
};



export async function reviewChunksWithLLM(
    reviewChunks: any[]
): Promise<LLMReviewResponse> {
    if (reviewChunks.length === 0) {
        return { reviews: [] };
    }

    const prompt = buildReviewPrompt(reviewChunks);

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-lite",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: geminiResponseSchema,
        },
    });

    const rawText = response.text ?? '{"reviews":[]}';

    let parsed: unknown;

    try {
        parsed = JSON.parse(rawText);
    } catch {
        console.log("Gemini returned invalid JSON:");
        console.log(rawText);
        return { reviews: [] };
    }

    const validated = llmReviewSchema.safeParse(parsed);

    if (!validated.success) {
        console.log("Gemini JSON did not match expected schema:");
        console.log(validated.error);
        return { reviews: [] };
    }
    console.log("sccess from llm")
    return validated.data;
}