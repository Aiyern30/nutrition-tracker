from flask import Flask, request, jsonify
from flask_cors import CORS
from openai import OpenAI
import json

app = Flask(__name__)
CORS(app)

# Initialize OpenAI-compatible client for Baidu Studio
client = OpenAI(
    api_key="333e7636d5248dbf9dc3f237e4bc9e5c69157228",
    base_url="https://aistudio.baidu.com/llm/lmapi/v3"
)

def analyze_image_with_ernie(image_base64, additional_context="", lang="en"):
    """Analyze food image directly using ERNIE vision model"""
    try:
        if lang == "zh":
            # Pure Chinese prompt
            base_prompt = """你是一位专业的营养分析专家，擅长解读中国食品包装标签。请仔细分析这张食品图片，从营养成分表中提取准确的营养数据。"""
            
            if additional_context:
                base_prompt += f"\n\n用户补充说明：{additional_context}"
            
            prompt = base_prompt + """

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
• 只输出JSON格式，不要添加任何其他文字或符号"""

        else:
            # Pure English prompt
            base_prompt = """You are a professional nutrition analysis expert specializing in reading Chinese food packaging labels. Carefully analyze this food image and extract accurate nutritional data from the nutrition facts table."""
            
            if additional_context:
                base_prompt += f"\n\nUser Context: {additional_context}"
            
            prompt = base_prompt + """

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
• Output ONLY valid JSON with no additional text or formatting"""

        messages = [
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": prompt
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{image_base64}"
                        }
                    }
                ]
            }
        ]
        
        response = client.chat.completions.create(
            model="ernie-5.0-thinking-preview",
            messages=messages,
            max_completion_tokens=4096,
            stream=False
        )

        if response.choices and len(response.choices) > 0:
            result_text = response.choices[0].message.content.strip()
            
            # Extract JSON from response
            start_idx = result_text.find('{')
            end_idx = result_text.rfind('}') + 1
            
            if start_idx != -1 and end_idx > start_idx:
                json_str = result_text[start_idx:end_idx]
                nutrition_data = json.loads(json_str)
                return nutrition_data
            else:
                raise Exception("Could not parse JSON from ERNIE response")
        else:
            raise Exception("No response from ERNIE")
            
    except json.JSONDecodeError as e:
        raise Exception(f"JSON parsing error: {str(e)}")
    except Exception as e:
        raise Exception(f"ERNIE Vision Analysis Error: {str(e)}")

def analyze_text_with_ernie(description, lang="en"):
    """Analyze food description using ERNIE text model"""
    try:
        if lang == "zh":
            prompt = f"""你是一位专业的营养分析专家。请根据以下食物描述，提供详细的营养信息估算。

📝 食物描述：
{description}

📤 请严格按照以下JSON格式返回：

{{
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
}}

⚠️ 只输出JSON格式，不要添加任何其他内容。"""

        else:
            prompt = f"""You are a professional nutrition analysis expert. Based on the following food description, provide detailed nutritional information estimates.

📝 Food Description:
{description}

📤 Provide your response in this exact JSON format:

{{
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
}}

⚠️ Output ONLY valid JSON with no additional text."""

        messages = [
            {"role": "user", "content": prompt}
        ]
        
        response = client.chat.completions.create(
            model="ernie-5.0-thinking-preview",
            messages=messages,
            max_completion_tokens=2048,
            stream=False
        )

        if response.choices and len(response.choices) > 0:
            result_text = response.choices[0].message.content.strip()
            
            start_idx = result_text.find('{')
            end_idx = result_text.rfind('}') + 1
            
            if start_idx != -1 and end_idx > start_idx:
                json_str = result_text[start_idx:end_idx]
                nutrition_data = json.loads(json_str)
                return nutrition_data
            else:
                raise Exception("Could not parse JSON from ERNIE response")
        else:
            raise Exception("No response from ERNIE")
            
    except json.JSONDecodeError as e:
        raise Exception(f"JSON parsing error: {str(e)}")
    except Exception as e:
        raise Exception(f"ERNIE Analysis Error: {str(e)}")
    
@app.route('/analyze', methods=['POST'])
def analyze_food():
    """Analyze food from image or description using ERNIE"""
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400

        lang = data.get("lang", "en") 

        # If image is provided - use ERNIE vision
        if 'image' in data:
            image_data = data['image']
            # Remove data URL prefix if present
            if ',' in image_data:
                image_data = image_data.split(',')[1]
            
            additional_context = data.get('description', '')
            
            nutrition_data = analyze_image_with_ernie(image_data, additional_context, lang=lang)
            
            # Extract detected text if available
            detected_text = nutrition_data.get('detected_text', '')
            ocr_results = []
            if detected_text:
                # Split text into lines for display
                lines = detected_text.split('\n')
                ocr_results = [
                    {"text": line.strip(), "confidence": 0.95} 
                    for line in lines if line.strip()
                ]
            
            return jsonify({
                "success": True,
                "ocr_results": ocr_results,
                "nutrition": nutrition_data
            }), 200

        # If only description is provided - use ERNIE text model
        elif 'description' in data:
            # Pass lang here too!
            nutrition_data = analyze_text_with_ernie(data['description'], lang=lang)
            return jsonify({
                "success": True,
                "nutrition": nutrition_data
            }), 200

        else:
            return jsonify({"error": "No image or description provided"}), 400

    except Exception as e:
        print(f"Error in analyze_food: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/chat', methods=['POST'])
def chat():
    """General chat with ERNIE"""
    try:
        data = request.json
        if not data or 'messages' not in data:
            return jsonify({"error": "No messages provided"}), 400
        
        messages = data['messages']
        
        # Ensure messages are in the correct format for the API
        # The frontend should send {role: 'user'|'assistant', content: '...'}
        
        system_prompt = {
            "role": "system", 
            "content": """You are a professional nutrition assistant. 
            Your goal is to provide clear, structured, and easy-to-read advice.
            
            Guidelines:
            1. Use clear section headings (e.g., **Key Recommendations**, **Top Food Choices**, **Things to Avoid**).
            2. Use bullet points for lists.
            3. Bold important keywords.
            4. Keep paragraphs short and concise.
            5. Avoid long blocks of text.
            6. Use a professional yet friendly tone.
            7. DO NOT answer questions that are not related to nutrition."""
        }
        
        formatted_messages = [system_prompt] + messages
        
        response = client.chat.completions.create(
            model="ernie-5.0-thinking-preview",
            messages=formatted_messages,
            max_completion_tokens=2048,
            stream=False
        )

        if response.choices and len(response.choices) > 0:
            return jsonify({
                "success": True,
                "message": response.choices[0].message.content
            }), 200
        else:
            return jsonify({"error": "No response from ERNIE"}), 500

    except Exception as e:
        print(f"Error in chat: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy"}), 200

@app.route('/generate-meal-plan', methods=['POST'])
def generate_meal_plan():
    """Generate a structured meal plan using ERNIE"""
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400

        user_profile = data.get('profile', {})
        date = data.get('date', '')
        lang = data.get('language', 'en')

        # Construct prompt based on user profile
        profile_text = f"""
        Profile:
        - Daily Calorie Goal: {user_profile.get('daily_calorie_goal', 2000)} kcal
        - Protein Goal: {user_profile.get('daily_protein_goal', 150)}g
        - Carbs Goal: {user_profile.get('daily_carbs_goal', 200)}g
        - Fats Goal: {user_profile.get('daily_fats_goal', 65)}g
        - Dietary Restrictions: {', '.join(user_profile.get('dietary_restrictions', []))}
        - Disliked Foods: {', '.join(user_profile.get('disliked_foods', []))}
        - Goal: {user_profile.get('goal_type', 'maintenance')}
        """

        if lang == 'zh':
            prompt = f"""你是一位专业的营养师。请根据以下用户档案，为 {date} 制定一份详细的每日膳食计划。
            
            {profile_text}

            请生成一份结构化的膳食计划，包含早餐、午餐、晚餐和加餐（可选）。
            
            输出必须是严格的 JSON 格式，如下所示：
            {{
                "date": "YYYY-MM-DD",
                "summary": "通过一两句话总结今天的计划（中文）",
                "total_nutrition": {{
                    "calories": 总卡路里,
                    "protein": 总蛋白质(g),
                    "carbs": 总碳水(g),
                    "fats": 总脂肪(g)
                }},
                "meals": [
                    {{
                        "type": "早餐",
                        "name": "餐食名称",
                        "description": "简短描述",
                        "items": ["食物1", "食物2"],
                        "nutrition": {{
                            "calories": int,
                            "protein": int,
                            "carbs": int,
                            "fats": int
                        }},
                        "tips": "烹饪或食用建议"
                    }},
                    // ... 其他餐食 (午餐, 晚餐, 加餐)
                ]
            }}
            
            只输出 JSON。不要输出其他文本。
            """
        else:
            prompt = f"""You are a professional nutritionist. Please create a detailed daily meal plan for {date} based on the following user profile.

            {profile_text}

            Generate a structured meal plan including Breakfast, Lunch, Dinner, and optionally Snacks.

            The output must be in strict JSON format as follows:
            {{
                "date": "YYYY-MM-DD",
                "summary": "A brief 1-2 sentence summary of the day's plan",
                "total_nutrition": {{
                    "calories": total_calories_int,
                    "protein": total_protein_g,
                    "carbs": total_carbs_g,
                    "fats": total_fats_g
                }},
                "meals": [
                    {{
                        "type": "Breakfast",
                        "name": "Meal Name",
                        "description": "Short description",
                        "items": ["Item 1", "Item 2"],
                        "nutrition": {{
                            "calories": int,
                            "protein": int,
                            "carbs": int,
                            "fats": int
                        }},
                        "tips": "Preparation or eating tip"
                    }},
                    // ... other meals (Lunch, Dinner, Snack)
                ]
            }}

            Output ONLY valid JSON. No markdown formatting or other text.
            """

        messages = [
            {"role": "user", "content": prompt}
        ]

        response = client.chat.completions.create(
            model="ernie-5.0-thinking-preview",
            messages=messages,
            max_completion_tokens=4096,
            stream=False
        )

        if response.choices and len(response.choices) > 0:
            result_text = response.choices[0].message.content.strip()
            
            # Clean up potential markdown code blocks
            if result_text.startswith("```json"):
                result_text = result_text[7:]
            if result_text.endswith("```"):
                result_text = result_text[:-3]
            
            start_idx = result_text.find('{')
            end_idx = result_text.rfind('}') + 1
            
            if start_idx != -1 and end_idx > start_idx:
                json_str = result_text[start_idx:end_idx]
                meal_plan = json.loads(json_str)
                return jsonify({
                    "success": True,
                    "plan": meal_plan
                }), 200
            else:
                print(f"Failed to parse JSON: {result_text}")
                return jsonify({"error": "Could not parse JSON from ERNIE response"}), 500
        else:
            return jsonify({"error": "No response from ERNIE"}), 500

    except Exception as e:
        print(f"Error in generate_meal_plan: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print("="*60)
    print("Starting ERNIE Vision API Server...")
    print("="*60)
    app.run(host='0.0.0.0', port=5000, debug=True)
