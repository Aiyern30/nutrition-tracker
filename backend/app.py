from flask import Flask, request, jsonify
from flask_cors import CORS
from paddleocr import PaddleOCR
import base64
import io
from PIL import Image
import numpy as np
import anthropic
import os
import json

app = Flask(__name__)
CORS(app)

# Initialize PaddleOCR (this will download models on first run)
ocr = PaddleOCR(use_angle_cls=True, lang='en', use_gpu=False)

# Initialize Anthropic client
client = anthropic.Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))

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

def analyze_nutrition_with_ai(text_data, user_description=""):
    """Use Claude to analyze nutrition from extracted text"""
    try:
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

If the image appears to be a nutrition label, extract the exact values. If it's a photo of food, estimate based on visual appearance and typical nutritional values. Be conservative with estimates and indicate confidence level accordingly."""

        message = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=2000,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )
        
        # Extract JSON from response
        response_text = message.content[0].text
        
        # Try to find JSON in the response
        start_idx = response_text.find('{')
        end_idx = response_text.rfind('}') + 1
        
        if start_idx != -1 and end_idx > start_idx:
            json_str = response_text[start_idx:end_idx]
            nutrition_data = json.loads(json_str)
            return nutrition_data
        else:
            raise Exception("Could not parse AI response")
            
    except Exception as e:
        raise Exception(f"AI Analysis Error: {str(e)}")

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "service": "PaddleOCR API"}), 200

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
            
            # Analyze with AI
            nutrition_data = analyze_nutrition_with_ai(ocr_results, user_description)
            
            return jsonify({
                "success": True,
                "ocr_results": ocr_results,
                "nutrition": nutrition_data
            }), 200
        
        # Handle text-only description
        elif 'description' in data:
            description = data['description']
            
            # Create a simple prompt for AI
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

Provide realistic estimates based on typical nutritional values for this food."""

            message = client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=2000,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )
            
            response_text = message.content[0].text
            start_idx = response_text.find('{')
            end_idx = response_text.rfind('}') + 1
            
            if start_idx != -1 and end_idx > start_idx:
                json_str = response_text[start_idx:end_idx]
                nutrition_data = json.loads(json_str)
                
                return jsonify({
                    "success": True,
                    "nutrition": nutrition_data
                }), 200
            else:
                return jsonify({"error": "Could not parse AI response"}), 500
        
        else:
            return jsonify({"error": "No image or description provided"}), 400
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print("Starting PaddleOCR API Server...")
    print("Make sure to set ANTHROPIC_API_KEY environment variable")
    app.run(host='0.0.0.0', port=5000, debug=True)