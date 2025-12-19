import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const ERNIE_API_KEY = process.env.ERNIE_API_KEY;

// Initialize OpenAI client for Baidu Ernie
const client = new OpenAI({
    apiKey: ERNIE_API_KEY || "dummy", // Prevent crash if key is missing, validated below
    baseURL: "https://aistudio.baidu.com/llm/lmapi/v3",
});

export async function POST(request: NextRequest) {
    try {
        if (!ERNIE_API_KEY) {
            return NextResponse.json(
                { error: "ERNIE_API_KEY is not set" },
                { status: 500 }
            );
        }

        const data = await request.json();

        if (!data || !data.messages) {
            return NextResponse.json(
                { error: "No messages provided" },
                { status: 400 }
            );
        }

        const { messages, language = "en" } = data;

        let systemPromptContent = `You are a professional nutrition assistant. 
            Your goal is to provide clear, structured, and easy-to-read advice.
            
            Guidelines:
            1. Use clear section headings (e.g., **Key Recommendations**, **Top Food Choices**, **Things to Avoid**).
            2. Use bullet points for lists.
            3. Bold important keywords.
            4. Keep paragraphs short and concise.
            5. Avoid long blocks of text.
            6. Use a professional yet friendly tone.
            7. DO NOT answer questions that are not related to nutrition.
            8. If you receive a question regarding what to eat today or meal plan of the day, please direct the user to the meal planner tab and append the tag [ACTION:NavigateToMealPlanner] at the end of your response.`;

        if (language === 'zh') {
            systemPromptContent = `你是一位专业的营养助手。
            你的目标是提供清晰、结构化且易于阅读的建议。
            
            指南：
            1. 使用清晰的章节标题（例如：**关键建议**、**首选食物**、**避免事项**）。
            2. 使用项目符号列出清单。
            3. 加粗重要的关键词。
            4. 保持段落简短精炼。
            5. 避免大段的文字。
            6. 使用专业且友好的语气。
            7. 不要回答与营养无关的问题。
            8. 如果收到关于今天吃什么或每日膳食计划的问题，请引导用户去膳食计划标签页，并在回复末尾附加标签 [ACTION:NavigateToMealPlanner]。`;
        }

        const systemPrompt = {
            role: "system" as const,
            content: systemPromptContent
        };

        // Prepend system prompt to the messages list
        const formattedMessages = [systemPrompt, ...messages];

        const response = await client.chat.completions.create({
            model: "ernie-5.0-thinking-preview",
            messages: formattedMessages,
            max_completion_tokens: 2048,
            stream: false,
        });

        if (response.choices && response.choices.length > 0) {
            return NextResponse.json({
                success: true,
                message: response.choices[0].message.content
            });
        } else {
            return NextResponse.json(
                { error: "No response from ERNIE" },
                { status: 500 }
            );
        }

    } catch (error) {
        console.error("Error in chat API:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Internal Server Error" },
            { status: 500 }
        );
    }
}
