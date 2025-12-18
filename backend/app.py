from flask import Flask, request, jsonify
from flask_cors import CORS
from paddleocr import PaddleOCR
from openai import OpenAI
import base64
import io
from PIL import Image
import numpy as np
import json

app = Flask(__name__)
CORS(app)

# Initialize PaddleOCR
ocr = PaddleOCR(use_textline_orientation=True, lang='en')

# Initialize OpenAI-compatible client for Baidu Studio
client = OpenAI(
    api_key="333e7636d5248dbf9dc3f237e4bc9e5c69157228",
    base_url="https://aistudio.baidu.com/llm/lmapi/v3"
)

def extract_text_from_image(image_data):
    """Extract text from image using PaddleOCR"""
    try:
        img = Image.open(io.BytesIO(image_data))
        img_array = np.array(img)
        result = ocr.predict(img_array)
        extracted_text = []
        for line in result:
            for word_info in line:
                text = word_info[-1]
                extracted_text.append(text)
        return extracted_text
    except Exception as e:
        raise Exception(f"OCR Error: {str(e)}")

def analyze_with_ernie(prompt_text):
    """Analyze text using Baidu Studio ERNIE model"""
    try:
        # Create a structured prompt
        full_prompt = f"""Analyze the following food information and extract nutritional data.

Food Information:
{prompt_text}

Please provide a JSON response with the following structure:
{{
  "name": "Food name",
  "category": "Food category",
  "calories": integer,
  "protein": integer (in grams),
  "carbs": integer (in grams),
  "fats": integer (in grams),
  "fiber": integer (in grams),
  "sugar": integer (in grams),
  "sodium": integer (in mg),
  "serving_size": "serving size description",
  "confidence": "high/medium/low",
  "benefits": ["benefit 1", "benefit 2", "benefit 3"],
  "considerations": ["consideration 1", "consideration 2"],
  "explanation": "Brief explanation of the analysis"
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
            
            # Try to extract JSON from response
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
    """Analyze food from image or description"""
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400

        # If image is provided
        if 'image' in data:
            image_data = data['image']
            if ',' in image_data:
                image_data = image_data.split(',')[1]
            image_bytes = base64.b64decode(image_data)
            ocr_results = extract_text_from_image(image_bytes)
            
            # Format OCR results for frontend
            formatted_ocr = [{"text": text, "confidence": 0.9} for text in ocr_results]
            
            prompt_text = " ".join(ocr_results)
            if 'description' in data:
                prompt_text += f"\nUser description: {data['description']}"
            
            nutrition_data = analyze_with_ernie(prompt_text)
            
            return jsonify({
                "success": True,
                "ocr_results": formatted_ocr,
                "nutrition": nutrition_data
            }), 200

        # If only description is provided
        elif 'description' in data:
            nutrition_data = analyze_with_ernie(data['description'])
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
            6. Use a professional yet friendly tone."""
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

if __name__ == '__main__':
    print("="*60)
    print("Starting PaddleOCR + Baidu Studio ERNIE API Server...")
    print("="*60)
    app.run(host='0.0.0.0', port=5000, debug=True)
