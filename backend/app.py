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

def analyze_image_with_ernie(image_base64, additional_context=""):
    """Analyze food image directly using ERNIE vision model"""
    try:
        prompt = f"""You are a nutrition expert specializing in reading Chinese food packaging labels. Analyze this food image and extract EXACT nutritional information from the nutrition facts table.

{f"Additional Context: {additional_context}" if additional_context else ""}

CRITICAL INSTRUCTIONS:
1. Look for "营养成分表" (Nutrition Facts Table) on the package
2. Find values for "每100克" (per 100g) or "每份" (per serving)
3. Extract EXACT numbers from these fields:
   - 能量 (Energy) - convert kJ to kcal (divide by 4.184)
   - 蛋白质 (Protein) in grams
   - 脂肪 (Fat) in grams
   - 碳水化合物 (Carbohydrates) in grams
   - 钠 (Sodium) in mg
   - 膳食纤维 (Dietary Fiber) in grams if present
   - 糖 (Sugar) in grams if present

4. Also identify:
   - Product name (translate to English)
   - Product category
   - Serving size information
   - All visible text on packaging

Provide a JSON response with this EXACT structure:
{{
  "name": "Product name in English (e.g., Green Sichuan Pepper Pickled Fish Seasoning)",
  "category": "Food category (Sauce/Snack/Beverage/Seasoning/etc.)",
  "calories": integer (kcal - converted from 能量/kJ value),
  "protein": integer (grams - from 蛋白质 value),
  "carbs": integer (grams - from 碳水化合物 value),
  "fats": integer (grams - from 脂肪 value),
  "fiber": integer (grams - from 膳食纤维, use 0 if not listed),
  "sugar": integer (grams - from 糖, use 0 if not listed),
  "sodium": integer (mg - from 钠 value),
  "serving_size": "per 100g or actual serving size mentioned",
  "confidence": "high/medium/low",
  "benefits": ["health benefit 1", "health benefit 2", "health benefit 3"],
  "considerations": ["dietary consideration 1", "consideration 2"],
  "explanation": "Summary of what you see and how you calculated the values",
  "detected_text": "All Chinese text visible on the packaging"
}}

IMPORTANT RULES:
- ALWAYS extract values from the 营养成分表 (nutrition table) if visible
- If energy is in kJ, convert to kcal by dividing by 4.184
- Round all numbers to nearest integer
- If per 100g is shown, mention that in serving_size
- If fiber/sugar not listed, use 0
- Be PRECISE with numbers from the table
- Respond ONLY with valid JSON, no other text"""

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

def analyze_text_with_ernie(description):
    """Analyze food description using ERNIE text model"""
    try:
        full_prompt = f"""Analyze the following food description and provide nutritional information.

Food Description:
{description}

Provide a JSON response with the following structure:
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
  "explanation": "Brief explanation of the nutritional analysis"
}}

Respond ONLY with valid JSON, no other text."""

        messages = [
            {"role": "user", "content": full_prompt}
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

        # If image is provided - use ERNIE vision
        if 'image' in data:
            image_data = data['image']
            # Remove data URL prefix if present
            if ',' in image_data:
                image_data = image_data.split(',')[1]
            
            additional_context = data.get('description', '')
            
            # Analyze with ERNIE vision model
            nutrition_data = analyze_image_with_ernie(image_data, additional_context)
            
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
            nutrition_data = analyze_text_with_ernie(data['description'])
            return jsonify({
                "success": True,
                "nutrition": nutrition_data
            }), 200

        else:
            return jsonify({"error": "No image or description provided"}), 400

    except Exception as e:
        print(f"Error in analyze_food: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy"}), 200

if __name__ == '__main__':
    print("="*60)
    print("Starting ERNIE Vision API Server...")
    print("="*60)
    app.run(host='0.0.0.0', port=5000, debug=True)
