from flask import Flask, request, jsonify
from flask_cors import CORS
from paddleocr import PaddleOCR
import base64
import io
from PIL import Image
import numpy as np
import requests
import json
import os

app = Flask(__name__)
CORS(app)

# Initialize PaddleOCR (this will download models on first run)
ocr = PaddleOCR(use_angle_cls=True, lang='en', use_gpu=False)

# ERNIE API Configuration
ERNIE_API_KEY = os.getenv('ERNIE_API_KEY')
ERNIE_SECRET_KEY = os.getenv('ERNIE_SECRET_KEY')
ERNIE_ACCESS_TOKEN = None

def get_ernie_access_token():
    """Get access token for ERNIE API"""
    global ERNIE_ACCESS_TOKEN
    
    if not ERNIE_API_KEY or not ERNIE_SECRET_KEY:
        raise Exception("ERNIE_API_KEY and ERNIE_SECRET_KEY must be set")
    
    url = f"https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id={ERNIE_API_KEY}&client_secret={ERNIE_SECRET_KEY}"
    
    response = requests.post(url)
    if response.status_code == 200:
        ERNIE_ACCESS_TOKEN = response.json().get("access_token")
        return ERNIE_ACCESS_TOKEN
    else:
        raise Exception(f"Failed to get access token: {response.text}")

def extract_text_from_image(image_data):
    """Extract text from image using PaddleOCR"""
    try:
        # Convert base64 to image
        img = Image.open(io.BytesIO(image_data))
        img_array = np.array(img)
        
        # Perform OCR
        result = ocr.ocr(img_array, cls=True)
        
        # Extract text
        extracted_text = []
        if result and result[0]:
            for line in result[0]:
                text = line[1][0]
                confidence = line[1][1]
                extracted_text.append({
                    'text': text,
                    'confidence': confidence
                })
        
        return extracted_text
    except Exception as e:
        raise Exception(f"OCR Error: {str(e)}")

def analyze_nutrition_with_ernie(text_data, user_description=""):
    """Use ERNIE to analyze nutrition from extracted text"""
    try:
        # Get access token if not already obtained
        if not ERNIE_ACCESS_TOKEN:
            get_ernie_access_token()
        
        # Combine OCR text
        ocr_text = "\n".join([item['text'] for item in text_data])
        
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

If the image appears to be a nutrition label, extract the exact values. If it's a photo of food, estimate based on visual appearance and typical nutritional values. Be conservative with estimates and indicate confidence level accordingly.

IMPORTANT: Return ONLY valid JSON, no other text."""

        # ERNIE-4.5-8K endpoint
        url = f"https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/ernie-4.5-8k?access_token={ERNIE_ACCESS_TOKEN}"
        
        payload = {
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "temperature": 0.3,
            "top_p": 0.8,
            "penalty_score": 1.0,
            "disable_search": False,
            "enable_citation": False
        }
        
        headers = {
            'Content-Type': 'application/json'
        }
        
        response = requests.post(url, headers=headers, json=payload)
        
        if response.status_code != 200:
            raise Exception(f"ERNIE API error: {response.text}")
        
        result = response.json()
        
        if 'error_code' in result:
            raise Exception(f"ERNIE error: {result.get('error_msg', 'Unknown error')}")
        
        # Extract response
        response_text = result.get('result', '')
        
        # Try to find JSON in the response
        start_idx = response_text.find('{')
        end_idx = response_text.rfind('}') + 1
        
        if start_idx != -1 and end_idx > start_idx:
            json_str = response_text[start_idx:end_idx]
            nutrition_data = json.loads(json_str)
            return nutrition_data
        else:
            raise Exception("Could not parse ERNIE response as JSON")
            
    except Exception as e:
        raise Exception(f"ERNIE Analysis Error: {str(e)}")

def analyze_description_with_ernie(description):
    """Use ERNIE to analyze food from text description only"""
    try:
        if not ERNIE_ACCESS_TOKEN:
            get_ernie_access_token()
        
        prompt = f"""Analyze this food description and provide nutritional estimates.

Food Description: {description}

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

Provide realistic estimates based on typical nutritional values for this food.

IMPORTANT: Return ONLY valid JSON, no other text."""

        url = f"https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/ernie-4.5-8k?access_token={ERNIE_ACCESS_TOKEN}"
        
        payload = {
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "temperature": 0.3,
            "top_p": 0.8
        }
        
        headers = {'Content-Type': 'application/json'}
        response = requests.post(url, headers=headers, json=payload)
        
        if response.status_code != 200:
            raise Exception(f"ERNIE API error: {response.text}")
        
        result = response.json()
        
        if 'error_code' in result:
            raise Exception(f"ERNIE error: {result.get('error_msg', 'Unknown error')}")
        
        response_text = result.get('result', '')
        start_idx = response_text.find('{')
        end_idx = response_text.rfind('}') + 1
        
        if start_idx != -1 and end_idx > start_idx:
            json_str = response_text[start_idx:end_idx]
            nutrition_data = json.loads(json_str)
            return nutrition_data
        else:
            raise Exception("Could not parse ERNIE response")
            
    except Exception as e:
        raise Exception(f"ERNIE Analysis Error: {str(e)}")

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "PaddleOCR + ERNIE API",
        "ernie_configured": bool(ERNIE_API_KEY and ERNIE_SECRET_KEY)
    }), 200

@app.route('/analyze', methods=['POST'])
def analyze_food():
    """Main endpoint to analyze food from image or text"""
    try:
        data = request.json
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        # Handle image upload
        if 'image' in data:
            # Remove base64 header if present
            image_data = data['image']
            if ',' in image_data:
                image_data = image_data.split(',')[1]
            
            # Decode base64
            image_bytes = base64.b64decode(image_data)
            
            # Extract text using OCR
            ocr_results = extract_text_from_image(image_bytes)
            
            if not ocr_results:
                return jsonify({"error": "No text detected in image"}), 400
            
            # Get user description if provided
            user_description = data.get('description', '')
            
            # Analyze with ERNIE
            nutrition_data = analyze_nutrition_with_ernie(ocr_results, user_description)
            
            return jsonify({
                "success": True,
                "ocr_results": ocr_results,
                "nutrition": nutrition_data
            }), 200
        
        # Handle text-only description
        elif 'description' in data:
            description = data['description']
            nutrition_data = analyze_description_with_ernie(description)
            
            return jsonify({
                "success": True,
                "nutrition": nutrition_data
            }), 200
        
        else:
            return jsonify({"error": "No image or description provided"}), 400
            
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print("=" * 60)
    print("Starting PaddleOCR + ERNIE API Server...")
    print("=" * 60)
    print(f"ERNIE API Key configured: {bool(ERNIE_API_KEY)}")
    print(f"ERNIE Secret Key configured: {bool(ERNIE_SECRET_KEY)}")
    print("=" * 60)
    
    if not ERNIE_API_KEY or not ERNIE_SECRET_KEY:
        print("WARNING: ERNIE credentials not found!")
        print("Please set ERNIE_API_KEY and ERNIE_SECRET_KEY environment variables")
    
    app.run(host='0.0.0.0', port=5000, debug=True)