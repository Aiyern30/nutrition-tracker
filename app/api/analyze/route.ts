import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const ERNIE_API_KEY = process.env.ERNIE_API_KEY;
if (!ERNIE_API_KEY) {
  throw new Error("ERNIE_API_KEY is not set in environment variables");
}

const client = new OpenAI({
  apiKey: ERNIE_API_KEY,
  baseURL: "https://aistudio.baidu.com/llm/lmapi/v3",
});

interface NutritionData {
  name: string;
  category: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
  sugar: number;
  sodium: number;
  serving_size?: string;
  confidence: "high" | "medium" | "low";
  benefits: string[];
  considerations: string[];
  explanation?: string;
  detected_text?: string;
}

async function analyzeImageWithErnie(
  imageBase64: string,
  additionalContext: string = "",
  lang: string = "en"
): Promise<NutritionData> {
  try {
    let basePrompt: string;
    let prompt: string;

    if (lang === "zh") {
      basePrompt = `你是一位顶尖的营养分析专家。请仔细分析这张图片中的食物。它可以是带包装的食品（有营养成分表），也可以是餐厅或家中准备好的菜肴（如海南鸡饭、拉面等）。`;

      if (additionalContext) {
        basePrompt += `\n\n用户提供的额外信息：${additionalContext}`;
      }

      prompt =
        basePrompt +
        `

📋 分析指南：
1. **识别类型**：判断图片是带包装的食品还是准备好的菜肴。
2. **带包装食品**：
   • 优先从"营养成分表"中提取精确数据。
   • 如果数值是每100g，请根据图片显示的包装大小估算总能量。
   • 能量(kJ)需换算为千卡(kcal)：kcal = kJ / 4.184。
3. **准备好的菜肴**（如：鸡肉饭、披萨、炒面）：
   • 识别菜肴名称及其主要组成部分。
   • 根据标准的份量大小（Serving Size）估算各项营养数值。
   • 在"explanation"中说明你是基于何种菜肴和份量进行估算的。

📤 输出要求：
请严格按照以下JSON格式返回，所有字段必须用中文填写：

{
  "name": "食物名称",
  "category": "食品类别（如：主食/调味品/零食/饮料等）",
  "calories": 整数（单位：千卡kcal）,
  "protein": 整数（单位：克g）,
  "carbs": 整数（单位：克g）,
  "fats": 整数（单位：克g）,
  "fiber": 整数（单位：克g，未知填0）,
  "sugar": 整数（单位：克g，未知填0）,
  "sodium": 整数（单位：毫克mg）,
  "serving_size": "估算的份量描述（如：1份、250克等）",
  "confidence": "high/medium/low（根据图片清晰度和识别难度判定）",
  "benefits": ["健康益处1", "健康益处2", "健康益处3"],
  "considerations": ["注意事项1", "注意事项2"],
  "explanation": "你的分析依据：如果是标签，说明提取的数据；如果是菜肴，说明识别出的成分和份量参考",
  "detected_text": "如果是包装，列出可见的文字；如果是餐食，列出识别出的主要食材"
}

⚠️ 重要规则：
• 数值必须为整数。
• 只输出JSON格式，不要添加任何其他文字或符号。`;
    } else {
      basePrompt = `You are a world-class nutrition analysis expert. Please analyze the food in this image. It could be packaged food (with a nutrition facts table) or a prepared meal (like Chicken Rice, Ramen, Tacos, etc.).`;

      if (additionalContext) {
        basePrompt += `\n\nUser Context: ${additionalContext}`;
      }

      prompt =
        basePrompt +
        `

📋 Analysis Guidelines:
1. **Identify Type**: Determine if the image shows a packaged product or a prepared dish.
2. **Packaged Food**:
   • Prioritize extracting exact data from the "Nutrition Facts" table if visible.
   • If values are per 100g, estimate the total based on the package size shown.
   • Convert Energy (kJ) to kcal: kcal = kJ / 4.184.
3. **Prepared Dishes** (e.g., Chicken Rice, Burger, Stir-fry):
   • Identify the dish name and its main ingredients.
   • Estimate nutritional values based on standard portion sizes.
   • In the "explanation" field, describe the dish and the portion size you used for the estimate.

📤 Output Format:
Provide your response in this exact JSON structure:

{
  "name": "Food name in English",
  "category": "Food category (Meal/Snack/Beverage/etc.)",
  "calories": integer (kcal),
  "protein": integer (grams),
  "carbs": integer (grams),
  "fats": integer (grams),
  "fiber": integer (grams, use 0 if unknown),
  "sugar": integer (grams, use 0 if unknown),
  "sodium": integer (mg),
  "serving_size": "Estimated serving size description (e.g., 1 plate, 300g)",
  "confidence": "high/medium/low",
  "benefits": ["health benefit 1", "health benefit 2", "health benefit 3"],
  "considerations": ["dietary consideration 1", "consideration 2"],
  "explanation": "Your analysis rationale: If a label was found, what data was extracted. If a dish, what ingredients were identified and the portion reference used.",
  "detected_text": "If a package, list visible text. If a meal, list identified main ingredients."
}

⚠️ Critical Rules:
• All nutritional values must be integers.
• Output ONLY valid JSON with no additional text or formatting.`;
    }

    const messages = [
      {
        role: "user" as const,
        content: [
          {
            type: "text" as const,
            text: prompt,
          },
          {
            type: "image_url" as const,
            image_url: {
              url: `data:image/jpeg;base64,${imageBase64}`,
            },
          },
        ],
      },
    ];

    const response = await client.chat.completions.create({
      model: "ernie-5.0-thinking-preview",
      messages: messages,
      max_completion_tokens: 4096,
      stream: false,
    });

    if (response.choices && response.choices.length > 0) {
      const resultText = response.choices[0].message.content?.trim() || "";

      const startIdx = resultText.indexOf("{");
      const endIdx = resultText.lastIndexOf("}") + 1;

      if (startIdx !== -1 && endIdx > startIdx) {
        const jsonStr = resultText.substring(startIdx, endIdx);
        const nutritionData = JSON.parse(jsonStr) as NutritionData;
        return nutritionData;
      } else {
        throw new Error("Could not parse JSON from ERNIE response");
      }
    } else {
      throw new Error("No response from ERNIE");
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`ERNIE Vision Analysis Error: ${error.message}`);
    }
    throw new Error("ERNIE Vision Analysis Error: Unknown error");
  }
}

async function analyzeTextWithErnie(
  description: string,
  lang: string = "en"
): Promise<NutritionData> {
  try {
    let prompt: string;

    if (lang === "zh") {
      prompt = `你是一位专业的营养分析专家。请根据以下食物描述，提供详细的营养信息估算。

📝 食物描述：
${description}

📤 请严格按照以下JSON格式返回：

{
  "name": "食物名称",
  "category": "食品类别",
  "calories": 整数（每份千卡）,
  "protein": 整数（每份克）,
  "carbs": 整数（每份克）,
  "fats": 整数（每份克）,
  "fiber": 整数（每份克）,
  "sugar": 整数（每份克）,
  "sodium": 整数（每份毫克）,
  "serving_size": "份量描述",
  "confidence": "高/中/低",
  "benefits": ["健康益处1", "健康益处2", "健康益处3"],
  "considerations": ["注意事项1", "注意事项2"],
  "explanation": "营养分析的依据和说明"
}

⚠️ 只输出JSON格式，不要添加任何其他内容。`;
    } else {
      prompt = `You are a professional nutrition analysis expert. Based on the following food description, provide detailed nutritional information estimates.

📝 Food Description:
${description}

📤 Provide your response in this exact JSON format:

{
  "name": "Food name",
  "category": "Food category",
  "calories": integer (kcal per serving),
  "protein": integer (grams per serving),
  "carbs": integer (grams per serving),
  "fats": integer (grams per serving),
  "fiber": integer (grams per serving),
  "sugar": integer (grams per serving),
  "sodium": integer (mg per serving),
  "serving_size": "serving size description",
  "confidence": "high/medium/low",
  "benefits": ["health benefit 1", "health benefit 2", "health benefit 3"],
  "considerations": ["dietary consideration 1", "consideration 2"],
  "explanation": "Brief rationale for the nutritional analysis"
}

⚠️ Output ONLY valid JSON with no additional text.`;
    }

    const messages = [{ role: "user" as const, content: prompt }];

    const response = await client.chat.completions.create({
      model: "ernie-5.0-thinking-preview",
      messages: messages,
      max_completion_tokens: 2048,
      stream: false,
    });

    if (response.choices && response.choices.length > 0) {
      const resultText = response.choices[0].message.content?.trim() || "";

      const startIdx = resultText.indexOf("{");
      const endIdx = resultText.lastIndexOf("}") + 1;

      if (startIdx !== -1 && endIdx > startIdx) {
        const jsonStr = resultText.substring(startIdx, endIdx);
        const nutritionData = JSON.parse(jsonStr) as NutritionData;
        return nutritionData;
      } else {
        throw new Error("Could not parse JSON from ERNIE response");
      }
    } else {
      throw new Error("No response from ERNIE");
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`ERNIE Analysis Error: ${error.message}`);
    }
    throw new Error("ERNIE Analysis Error: Unknown error");
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    if (!data) {
      return NextResponse.json({ error: "No data provided" }, { status: 400 });
    }

    const lang = data.lang || "en";

    // If image is provided - use ERNIE vision
    if (data.image) {
      let imageData = data.image;
      // Remove data URL prefix if present
      if (imageData.includes(",")) {
        imageData = imageData.split(",")[1];
      }

      const additionalContext = data.description || "";

      const nutritionData = await analyzeImageWithErnie(
        imageData,
        additionalContext,
        lang
      );

      // Extract detected text if available
      const detectedText = nutritionData.detected_text || "";
      const ocrResults = [];
      if (detectedText) {
        // Split text into lines for display
        const lines = detectedText.split("\n");
        for (const line of lines) {
          if (line.trim()) {
            ocrResults.push({ text: line.trim(), confidence: 0.95 });
          }
        }
      }

      return NextResponse.json({
        success: true,
        ocr_results: ocrResults,
        nutrition: nutritionData,
      });
    }

    // If only description is provided - use ERNIE text model
    if (data.description) {
      const nutritionData = await analyzeTextWithErnie(data.description, lang);
      return NextResponse.json({
        success: true,
        nutrition: nutritionData,
      });
    }

    return NextResponse.json(
      { error: "No image or description provided" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error in analyze API:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Analysis failed" },
      { status: 500 }
    );
  }
}
