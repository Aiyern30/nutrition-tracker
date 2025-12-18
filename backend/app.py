from flask import Flask, request, jsonify
from flask_cors import CORS
from paddleocr import PaddleOCR
import base64
import io
from PIL import Image
import numpy as np
import requests
import json

app = Flask(__name__)
CORS(app)

# Initialize PaddleOCR (adjusted for new version)
ocr = PaddleOCR(use_textline_orientation=True, lang='en')

# Fixed ERNIE access token from Baidu Studio
ERNIE_ACCESS_TOKEN = "333e7636d5248dbf9dc3f237e4bc9e5c69157228"

def extract_text_from_image(image_data):
    """Extract text from image using PaddleOCR safely"""
    try:
        img = Image.open(io.BytesIO(image_data))
        img_array = np.array(img)

        result = ocr.predict(img_array)  # predict() returns a list of dicts

        extracted_text = []

        for line in result:
            # Each line is a dict with 'text' and 'confidence'
            text = line.get('text', '')
            confidence = float(line.get('confidence', 0))
            if text:  # Only add non-empty text
                extracted_text.append({
                    'text': text,
                    'confidence': confidence
                })

        return extracted_text
    except Exception as e:
        raise Exception(f"OCR Error: {str(e)}")


def analyze_with_ernie(prompt):
    """Use ERNIE API with fixed access token"""
    try:
        url = f"https://wenxin.baidu.com/v1/chat/completions?access_token={ERNIE_ACCESS_TOKEN}"

        payload = {
            "model": "ernie-4.5-8k",
            "messages": [
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.3
        }

        headers = {"Content-Type": "application/json"}

        response = requests.post(url, headers=headers, json=payload)
        if response.status_code != 200:
            raise Exception(f"ERNIE API error: {response.text}")

        result = response.json()
        response_text = result["choices"][0]["message"]["content"]

        # Try to extract JSON from ERNIE's response
        start_idx = response_text.find("{")
        end_idx = response_text.rfind("}") + 1
        if start_idx != -1 and end_idx > start_idx:
            json_str = response_text[start_idx:end_idx]
            nutrition_data = json.loads(json_str)
            return nutrition_data
        else:
            raise Exception("Could not parse ERNIE response as JSON")
    except Exception as e:
        raise Exception(f"ERNIE Analysis Error: {str(e)}")

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "healthy",
        "service": "PaddleOCR + ERNIE API",
        "ernie_configured": bool(ERNIE_ACCESS_TOKEN)
    }), 200

@app.route('/analyze', methods=['POST'])
def analyze_food():
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400

        # Handle image upload
        if "image" in data:
            image_data = data["image"]
            if "," in image_data:
                image_data = image_data.split(",")[1]
            image_bytes = base64.b64decode(image_data)

            ocr_results = extract_text_from_image(image_bytes)
            if not ocr_results:
                return jsonify({"error": "No text detected in image"}), 400

            user_description = data.get("description", "")

            # Build prompt for ERNIE
            ocr_text = "\n".join([item['text'] for item in ocr_results])
            prompt = f"""Analyze the following food information and extract nutritional data.

OCR Extracted Text:
{ocr_text}

Additional User Description: {user_description}

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

Return ONLY valid JSON."""

            nutrition_data = analyze_with_ernie(prompt)

            return jsonify({
                "success": True,
                "ocr_results": ocr_results,
                "nutrition": nutrition_data
            }), 200

        # Handle text-only description
        elif "description" in data:
            description = data["description"]
            prompt = f"""Analyze this food description and provide nutritional estimates.

Food Description: {description}

Please provide a JSON response with the same structure as above.

Return ONLY valid JSON."""

            nutrition_data = analyze_with_ernie(prompt)
            return jsonify({"success": True, "nutrition": nutrition_data}), 200

        else:
            return jsonify({"error": "No image or description provided"}), 400

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print("="*60)
    print("Starting PaddleOCR + ERNIE API Server...")
    print("="*60)
    print(f"Using fixed ERNIE access token: {ERNIE_ACCESS_TOKEN[:8]}***")
    print("="*60)
    app.run(host='0.0.0.0', port=5000, debug=True)
