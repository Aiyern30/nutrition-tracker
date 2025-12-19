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
      basePrompt = `你是一位专业的营养分析专家，擅长解读中国食品包装标签。请仔细分析这张食品图片，从营养成分表中提取准确的营养数据。`;

      if (additionalContext) {
        basePrompt += `\n\n用户补充说明：${additionalContext}`;
      }

      prompt =
        basePrompt +
        `

📋 分析步骤：
1. 在包装上找到"营养成分表"区域
2. 定位"每100克"或"每份"的标注
3. 精确提取以下营养成分的数值：
   • 能量（千焦kJ）→ 需换算为千卡kcal（除以4.184）
   • 蛋白质（克）
   • 脂肪（克）
   • 碳水化合物（克）
   • 钠（毫克）
   • 膳食纤维（克，如有标注）
   • 糖（克，如有标注）

4. 识别产品信息：
   • 产品中文名称
   • 食品类别（调味料/零食/饮料/主食等）
   • 包装上的所有可见文字

📤 输出要求：
请严格按照以下JSON格式返回，所有字段必须用中文填写：

{
  "name": "产品完整中文名称",
  "category": "食品类别",
  "calories": 整数（千卡，从能量字段换算），
  "protein": 整数（克），
  "carbs": 整数（克），
  "fats": 整数（克），
  "fiber": 整数（克，无标注则填0），
  "sugar": 整数（克，无标注则填0），
  "sodium": 整数（毫克），
  "serving_size": "每100克 或 实际标注的份量",
  "confidence": "高/中/低",
  "benefits": ["健康益处1", "健康益处2", "健康益处3"],
  "considerations": ["注意事项1", "注意事项2"],
  "explanation": "你的分析依据和计算说明",
  "detected_text": "包装上所有可见的中文文字"
}

⚠️ 重要规则：
• 必须从营养成分表中读取数值，不可估算
• 能量单位如为千焦（kJ），必须换算为千卡（kcal = kJ ÷ 4.184）
• 所有数值四舍五入为整数
• 如果营养成分表中没有膳食纤维或糖的数据，填写0
• 只输出JSON格式，不要添加任何其他文字或符号`;
    } else {
      basePrompt = `You are a professional nutrition analysis expert specializing in reading Chinese food packaging labels. Carefully analyze this food image and extract accurate nutritional data from the nutrition facts table.`;

      if (additionalContext) {
        basePrompt += `\n\nUser Context: ${additionalContext}`;
      }

      prompt =
        basePrompt +
        `

📋 Analysis Steps:
1. Locate the "营养成分表" (Nutrition Facts Table) on the package
2. Find the section marked "每100克" (per 100g) or "每份" (per serving)
3. Extract exact values for these nutritional components:
   • 能量 (Energy in kJ) → Convert to kcal by dividing by 4.184
   • 蛋白质 (Protein in grams)
   • 脂肪 (Fat in grams)
   • 碳水化合物 (Carbohydrates in grams)
   • 钠 (Sodium in mg)
   • 膳食纤维 (Dietary Fiber in grams, if listed)
   • 糖 (Sugar in grams, if listed)

4. Identify product information:
   • Product name (translate to English)
   • Food category
   • All visible text on the packaging

📤 Output Format:
Provide your response in this exact JSON structure:

{
  "name": "Product name in English",
  "category": "Food category (Seasoning/Snack/Beverage/Meal/etc.)",
  "calories": integer (kcal - converted from 能量/kJ),
  "protein": integer (grams from 蛋白质),
  "carbs": integer (grams from 碳水化合物),
  "fats": integer (grams from 脂肪),
  "fiber": integer (grams from 膳食纤维, use 0 if not listed),
  "sugar": integer (grams from 糖, use 0 if not listed),
  "sodium": integer (mg from 钠),
  "serving_size": "per 100g or the actual serving size stated",
  "confidence": "high/medium/low",
  "benefits": ["health benefit 1", "health benefit 2", "health benefit 3"],
  "considerations": ["dietary consideration 1", "consideration 2"],
  "explanation": "Your analysis rationale and calculation details",
  "detected_text": "All Chinese text visible on the packaging"
}

⚠️ Critical Rules:
• Extract values ONLY from the nutrition facts table, do not estimate
• If energy is in kJ (千焦), convert to kcal by dividing by 4.184
• Round all numerical values to the nearest integer
• If fiber or sugar is not listed in the table, use 0
• Output ONLY valid JSON with no additional text or formatting`;
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
