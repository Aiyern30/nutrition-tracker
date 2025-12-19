import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const ERNIE_API_KEY = process.env.ERNIE_API_KEY;

// Initialize OpenAI client for Baidu Ernie
const client = new OpenAI({
    apiKey: ERNIE_API_KEY || "dummy",
    baseURL: "https://aistudio.baidu.com/llm/lmapi/v3",
});

interface UserProfile {
    daily_calorie_goal?: number;
    daily_protein_goal?: number;
    daily_carbs_goal?: number;
    daily_fats_goal?: number;
    dietary_restrictions?: string[];
    disliked_foods?: string[];
    goal_type?: string;
}

export async function POST(request: NextRequest) {
    try {
        if (!ERNIE_API_KEY) {
            return NextResponse.json(
                { error: "ERNIE_API_KEY is not set" },
                { status: 500 }
            );
        }

        const data = await request.json();

        if (!data) {
            return NextResponse.json(
                { error: "No data provided" },
                { status: 400 }
            );
        }

        const { profile = {}, date = '', language: lang = 'en' } = data;
        const user_profile: UserProfile = profile;

        // Construct prompt based on user profile
        const profile_text = `
        Profile:
        - Daily Calorie Goal: ${user_profile.daily_calorie_goal || 2000} kcal
        - Protein Goal: ${user_profile.daily_protein_goal || 150}g
        - Carbs Goal: ${user_profile.daily_carbs_goal || 200}g
        - Fats Goal: ${user_profile.daily_fats_goal || 65}g
        - Dietary Restrictions: ${(user_profile.dietary_restrictions || []).join(', ')}
        - Disliked Foods: ${(user_profile.disliked_foods || []).join(', ')}
        - Goal: ${user_profile.goal_type || 'maintenance'}
        `;

        let prompt: string;

        if (lang === 'zh') {
            prompt = `你是一位专业的营养师。请根据以下用户档案，为 ${date} 制定一份详细的每日膳食计划。
            
            ${profile_text}

            请生成一份结构化的膳食计划，包含早餐、午餐、晚餐和加餐（可选）。
            
            输出必须是严格的 JSON 格式，如下所示：
            {
                "date": "YYYY-MM-DD",
                "summary": "通过一两句话总结今天的计划（中文）",
                "total_nutrition": {
                    "calories": 总卡路里,
                    "protein": 总蛋白质(g),
                    "carbs": 总碳水(g),
                    "fats": 总脂肪(g)
                },
                "meals": [
                    {
                        "type": "早餐",
                        "name": "餐食名称",
                        "description": "简短描述",
                        "items": ["食物1", "食物2"],
                        "nutrition": {
                            "calories": int,
                            "protein": int,
                            "carbs": int,
                            "fats": int
                        },
                        "tips": "烹饪或食用建议"
                    },
                    // ... 其他餐食 (午餐, 晚餐, 加餐)
                ]
            }
            
            只输出 JSON。不要输出其他文本。
            `;
        } else {
            prompt = `You are a professional nutritionist. Please create a detailed daily meal plan for ${date} based on the following user profile.

            ${profile_text}

            Generate a structured daily meal plan including Breakfast, Lunch, Dinner, and optionally Snacks.

            The output must be in strict JSON format as follows:
            {
                "date": "YYYY-MM-DD",
                "summary": "A brief 1-2 sentence summary of the day's plan",
                "total_nutrition": {
                    "calories": total_calories_int,
                    "protein": total_protein_g,
                    "carbs": total_carbs_g,
                    "fats": total_fats_g
                },
                "meals": [
                    {
                        "type": "Breakfast",
                        "name": "Meal Name",
                        "description": "Short description",
                        "items": ["Item 1", "Item 2"],
                        "nutrition": {
                            "calories": int,
                            "protein": int,
                            "carbs": int,
                            "fats": int
                        },
                        "tips": "Preparation or eating tip"
                    },
                    // ... other meals (Lunch, Dinner, Snack)
                ]
            }

            Output ONLY valid JSON. No markdown formatting or other text.
            `;
        }

        const messages = [
            { role: "user" as const, content: prompt }
        ];

        const response = await client.chat.completions.create({
            model: "ernie-4.0-8k-latest",
            messages: messages,
            max_completion_tokens: 2048,
            stream: false,
        });

        if (response.choices && response.choices.length > 0) {
            let resultText = response.choices[0].message.content || "";

            // Minimal cleanup to extract JSON
            const startIdx = resultText.indexOf('{');
            const endIdx = resultText.lastIndexOf('}') + 1;

            if (startIdx !== -1 && endIdx > startIdx) {
                const jsonStr = resultText.substring(startIdx, endIdx);
                try {
                    const mealPlan = JSON.parse(jsonStr);
                    return NextResponse.json({
                        success: true,
                        plan: mealPlan
                    });
                } catch (je) {
                    console.error("JSON Parse Error:", je, "String:", jsonStr);
                    return NextResponse.json(
                        { error: "Invalid JSON format from AI" },
                        { status: 500 }
                    );
                }
            } else {
                return NextResponse.json(
                    { error: "Could not locate JSON in ERNIE response" },
                    { status: 500 }
                );
            }
        } else {
            return NextResponse.json(
                { error: "No response from ERNIE" },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error("Error in meal planner API:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Internal Server Error" },
            { status: 500 }
        );
    }
}
