import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const ERNIE_API_KEY = process.env.ERNIE_API_KEY;

const client = new OpenAI({
  apiKey: ERNIE_API_KEY || "dummy",
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
    const { messages, language = "en" } = data;

    if (!messages || messages.length === 0) {
      return NextResponse.json({ suggestions: [] });
    }

    const systemPrompt =
      language === "zh"
        ? `你是一个专业的营养助手。根据用户最近的对话记录，生成4个简短、相关的后续问题或新的营养话题，供用户选择提问。与最新的话题保持关联性。
               请严格按照以下JSON格式返回结果（只有JSON数组，不要Markdown标记和其他文字）：
               ["问题1", "问题2", "问题3", "问题4"]`
        : `You are a professional nutrition assistant. Based on the user's recent conversation history, generate 4 short, relevant follow-up questions or new nutrition topics for the user to ask next. Keep them related to the latest context.
               Return STRICTLY a JSON array of strings (no markdown, no extra text):
               ["Question 1", "Question 2", "Question 3", "Question 4"]`;

    const response = await client.chat.completions.create({
      model: "ernie-5.0-thinking-preview",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
        {
          role: "user",
          content:
            language === "zh"
              ? "请生成4个建议问题。"
              : "Please generate 4 suggested questions.",
        },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 500,
    });

    const content = response.choices[0].message.content || "[]";

    let suggestions: string[] = [];
    try {
      // Attempt to clean markdown if present (e.g. ```json ... ```)
      const cleanContent = content
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
      suggestions = JSON.parse(cleanContent);
      if (!Array.isArray(suggestions)) {
        suggestions = [];
      }
    } catch (e) {
      console.error("Failed to parse suggestions JSON:", content);
      suggestions = [];
    }

    return NextResponse.json({ suggestions: suggestions.slice(0, 4) });
  } catch (error) {
    console.error("Error generating suggestions:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal Server Error",
      },
      { status: 500 }
    );
  }
}
