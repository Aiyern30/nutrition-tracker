from flask import Flask, request, jsonify
from flask_cors import CORS
from paddleocr import PaddleOCR
from openai import OpenAI
import base64
import io
from PIL import Image
import numpy as np
import json
import cv2

app = Flask(__name__)
CORS(app)

# Initialize PaddleOCR for both English and Chinese (remove show_log)
ocr_en = PaddleOCR(
    use_angle_cls=True,
    lang='en',
    det_db_thresh=0.3,
    det_db_box_thresh=0.5,
    text_recognition_batch_size=6
)
ocr_ch = PaddleOCR(
    use_angle_cls=True,
    lang='ch',
    det_db_thresh=0.3,
    det_db_box_thresh=0.5,
    text_recognition_batch_size=6
)

# Initialize OpenAI-compatible client for Baidu Studio
client = OpenAI(
    api_key="333e7636d5248dbf9dc3f237e4bc9e5c69157228",
    base_url="https://aistudio.baidu.com/llm/lmapi/v3"
)

def preprocess_image(image_data):
    """Preprocess image for better OCR results"""
    try:
        # Convert to PIL Image
        img = Image.open(io.BytesIO(image_data))
        
        # Convert to numpy array
        img_array = np.array(img)
        
        # Convert RGB to BGR for OpenCV
        if len(img_array.shape) == 3 and img_array.shape[2] == 3:
            img_array = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
        
        # Resize if image is too large
        height, width = img_array.shape[:2]
        max_dimension = 2000
        if max(height, width) > max_dimension:
            scale = max_dimension / max(height, width)
            new_width = int(width * scale)
            new_height = int(height * scale)
            img_array = cv2.resize(img_array, (new_width, new_height))
        
        # Enhance contrast
        lab = cv2.cvtColor(img_array, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
        l = clahe.apply(l)
        enhanced = cv2.merge([l, a, b])
        enhanced = cv2.cvtColor(enhanced, cv2.COLOR_LAB2BGR)
        
        return enhanced
    except Exception as e:
        print(f"Preprocessing error: {str(e)}")
        # Return original if preprocessing fails
        img = Image.open(io.BytesIO(image_data))
        return np.array(img)

def extract_text_from_image(image_data):
    """Extract text from image using PaddleOCR (both EN and CH)"""
    try:
        img_array = preprocess_image(image_data)

        # Remove cls=True, use default API
        result_en = ocr_en.ocr(img_array)
        result_ch = ocr_ch.ocr(img_array)

        def extract_lines(result):
            lines = []
            if result and len(result) > 0:
                for line in result[0]:
                    if line:
                        text = line[1][0]
                        confidence = line[1][1]
                        if confidence > 0.5 and len(text.strip()) > 0:
                            lines.append({
                                "text": text,
                                "confidence": round(confidence, 2)
                            })
            return lines

        # Combine and deduplicate results
        lines_en = extract_lines(result_en)
        lines_ch = extract_lines(result_ch)
        seen = set()
        combined = []
        for item in lines_en + lines_ch:
            key = (item["text"], item["confidence"])
            if key not in seen:
                seen.add(key)
                combined.append(item)

        return combined
    except Exception as e:
        print(f"OCR Error: {str(e)}")
        raise Exception(f"OCR Error: {str(e)}")

def analyze_with_ernie(prompt_text, ocr_data=None):
    """Analyze text using Baidu Studio ERNIE model"""
    try:
        # Create a more detailed prompt for Chinese food packages
        if ocr_data:
            ocr_text = "\n".join([f"{item['text']} (confidence: {item['confidence']})" for item in ocr_data])
            full_prompt = f"""You are a nutrition expert analyzing food packaging information. The following text was extracted from a food package (may contain Chinese text):

OCR Extracted Text:
{ocr_text}

Additional Context:
{prompt_text if prompt_text else "No additional context provided"}

Please analyze this food product and provide comprehensive nutritional information. If the text is in Chinese, translate and analyze it. Look for:
- Product name
- Nutritional facts table (每100克/per 100g)
- Ingredients list
- Serving size information
- Any health claims or warnings

Provide a JSON response with the following structure:
{{
  "name": "Food name (in English)",
  "category": "Food category (e.g., Sauce, Snack, Beverage, etc.)",
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
  "explanation": "Brief explanation of the nutritional analysis and any notable ingredients"
}}

Important: 
- Convert all nutritional values to per serving amounts
- If nutritional table shows "per 100g", calculate serving size based on typical portions
- Be accurate with the nutritional values extracted from the label
- Respond ONLY with valid JSON, no other text."""
        else:
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
            
            # Extract text with confidence scores
            ocr_results = extract_text_from_image(image_bytes)
            
            # Combine OCR text for analysis
            prompt_text = " ".join([item['text'] for item in ocr_results])
            if 'description' in data and data['description']:
                prompt_text += f"\nUser description: {data['description']}"
            
            # Analyze with ERNIE, passing OCR data for better context
            nutrition_data = analyze_with_ernie(prompt_text, ocr_results)
            
            return jsonify({
                "success": True,
                "ocr_results": ocr_results,  # Now includes confidence scores
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

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy"}), 200

if __name__ == '__main__':
    print("="*60)
    print("Starting PaddleOCR + Baidu Studio ERNIE API Server...")
    print("="*60)
    app.run(host='0.0.0.0', port=5000, debug=True)
