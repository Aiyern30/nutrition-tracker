import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";

const ERNIE_API_KEY = process.env.ERNIE_API_KEY;
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY; // Add this to your .env

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

// Function to get food image from Unsplash
async function getUnsplashFoodImage(
  mealName: string,
  items: string[],
  mealType: string
): Promise<string | null> {
  try {
    // Try specific search first with main ingredients
    const mainIngredients = items.slice(0, 3).join(" ");
    let searchQuery = `${mainIngredients} ${mealType} food dish meal`;

    let response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
        searchQuery
      )}&per_page=5&orientation=landscape&content_filter=high`,
      {
        headers: {
          Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
        },
      }
    );

    if (!response.ok) {
      console.error(`Unsplash API error: ${response.status}`);
      return null;
    }

    let data = await response.json();

    // If no results, try generic meal type search
    if (!data.results || data.results.length === 0) {
      searchQuery = `${mealType} food healthy meal`;
      response = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
          searchQuery
        )}&per_page=5&orientation=landscape&content_filter=high`,
        {
          headers: {
            Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
          },
        }
      );
      data = await response.json();
    }

    // Return a random image from top 5 results for variety
    if (data.results && data.results.length > 0) {
      const randomIndex = Math.floor(
        Math.random() * Math.min(data.results.length, 5)
      );
      return data.results[randomIndex]?.urls?.regular || null;
    }

    return null;
  } catch (error) {
    console.error("Unsplash image fetch error:", error);
    return null;
  }
}

// Improved placeholder with food emoji and better styling
function getPlaceholderImage(mealName: string, mealType: string): string {
  const emoji =
    mealType.includes("早餐") || mealType.toLowerCase().includes("breakfast")
      ? "🍳"
      : mealType.includes("午餐") || mealType.toLowerCase().includes("lunch")
      ? "🍱"
      : mealType.includes("晚餐") || mealType.toLowerCase().includes("dinner")
      ? "🍽️"
      : "🥗";

  return `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1024&h=576&fit=crop&q=80`;
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
      return NextResponse.json({ error: "No data provided" }, { status: 400 });
    }

    const { profile = {}, date = "", language: lang = "en" } = data;
    const user_profile: UserProfile = profile;

    // Construct prompt based on user profile
    const profile_text = `
        Profile:
        - Daily Calorie Goal: ${user_profile.daily_calorie_goal || 2000} kcal
        - Protein Goal: ${user_profile.daily_protein_goal || 150}g
        - Carbs Goal: ${user_profile.daily_carbs_goal || 200}g
        - Fats Goal: ${user_profile.daily_fats_goal || 65}g
        - Dietary Restrictions: ${(
          user_profile.dietary_restrictions || []
        ).join(", ")}
        - Disliked Foods: ${(user_profile.disliked_foods || []).join(", ")}
        - Goal: ${user_profile.goal_type || "maintenance"}
        `;

    let prompt: string;

    if (lang === "zh") {
      prompt = `你是一位专业的营养师。请根据以下用户档案，为 ${date} 制定一份**完全不同且富有创意**的每日膳食计划。
            
            ${profile_text}

            请生成一份结构化的膳食计划，包含早餐、午餐、晚餐和加餐（可选）。
            
            **关键要求：**
            1. **多样性**：请确保今天的餐食组合具有独特性，不要使用千篇一律的通用食谱。
            2. **避免重复**：如果这是一次重新生成，请尝试提供与常规建议完全不同的选择。
            
            输出必须是严格的 JSON 格式，如下所示：
            {
                "date": "YYYY-MM-DD",
                "summary": "通过一两句话总结今天的计划（中文），强调其特色",
                "total_nutrition": {
                    "calories": 总卡路里,
                    "protein": 总蛋白质(g),
                    "carbs": 总碳水(g),
                    "fats": 总脂肪(g)
                },
                "meals": [
                    {
                        "type": "早餐",
                        "name": "创意餐食名称",
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
      prompt = `You are a professional nutritionist. Please create a **unique and creative** daily meal plan for ${date} based on the following user profile.

            ${profile_text}

            Generate a structured daily meal plan including Breakfast, Lunch, Dinner, and optionally Snacks.

            **Key Requirements:**
            1. **Variety**: Ensure the meals are distinct and interesting. Do not output generic default plans.
            2. **Uniqueness**: Try to suggest meals that are different from typical automated suggestions.

            The output must be in strict JSON format as follows:
            {
                "date": "YYYY-MM-DD",
                "summary": "A brief 1-2 sentence summary of the day's unique plan",
                "total_nutrition": {
                    "calories": total_calories_int,
                    "protein": total_protein_g,
                    "carbs": total_carbs_g,
                    "fats": total_fats_g
                },
                "meals": [
                    {
                        "type": "Breakfast",
                        "name": "Creative Meal Name",
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

    const messages = [{ role: "user" as const, content: prompt }];

    const response = await client.chat.completions.create({
      model: "ernie-4.0-turbo-8k",
      messages: messages,
      temperature: 0.85,
      max_completion_tokens: 2048,
      stream: false,
    });

    if (response.choices && response.choices.length > 0) {
      const resultText = response.choices[0].message.content || "";

      // Minimal cleanup to extract JSON
      const startIdx = resultText.indexOf("{");
      const endIdx = resultText.lastIndexOf("}") + 1;

      if (startIdx !== -1 && endIdx > startIdx) {
        const jsonStr = resultText.substring(startIdx, endIdx);
        try {
          const mealPlan = JSON.parse(jsonStr);

          // ---------------------------------------------------------
          // Image Generation Logic - Using Unsplash
          // ---------------------------------------------------------
          try {
            // Add images to each meal
            await Promise.all(
              mealPlan.meals.map(async (meal: any, index: number) => {
                try {
                  let imageUrl = null;

                  // Try to get image from Unsplash if API key is available
                  if (UNSPLASH_ACCESS_KEY) {
                    imageUrl = await getUnsplashFoodImage(
                      meal.name,
                      meal.items,
                      meal.type
                    );
                  }

                  // Fallback to placeholder if Unsplash fails or no API key
                  if (!imageUrl) {
                    imageUrl = getPlaceholderImage(meal.name, meal.type);
                  }

                  meal.image_url = imageUrl;
                } catch (innerErr) {
                  console.error(
                    `Failed to get image for meal ${index}:`,
                    innerErr
                  );
                  // Use placeholder as final fallback
                  meal.image_url = getPlaceholderImage(meal.name, meal.type);
                }
              })
            );
          } catch (imgError) {
            console.error(
              "Image generation process failed (non-critical):",
              imgError
            );
            // Add placeholder images for all meals
            mealPlan.meals.forEach((meal: any) => {
              meal.image_url = getPlaceholderImage(meal.name, meal.type);
            });
          }

          return NextResponse.json({
            success: true,
            plan: mealPlan,
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
      {
        error: error instanceof Error ? error.message : "Internal Server Error",
      },
      { status: 500 }
    );
  }
}
