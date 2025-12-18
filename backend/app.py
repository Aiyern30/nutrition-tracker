from flask import Flask, request, jsonify
from flask_cors import CORS
from paddleocr import PaddleOCR
from openai import OpenAI
import base64
import io
from PIL import Image
import numpy as np

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
        messages = [
            {"role": "user", "content": prompt_text}
        ]
        response = client.chat.completions.create(
            model="ernie-5.0-thinking-preview",
            messages=messages,
            max_completion_tokens=2048
        )

        # Extract text from streamed response
        result_text = ""
        for chunk in response:
            if not chunk.choices or len(chunk.choices) == 0:
                continue
            if hasattr(chunk.choices[0].delta, "content") and chunk.choices[0].delta.content:
                result_text += chunk.choices[0].delta.content
        return result_text.strip()
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
            prompt_text = " ".join(ocr_results)
            if 'description' in data:
                prompt_text += f"\nUser description: {data['description']}"
            ernie_result = analyze_with_ernie(prompt_text)
            return jsonify({
                "success": True,
                "ocr_results": ocr_results,
                "ernie_result": ernie_result
            }), 200

        # If only description is provided
        elif 'description' in data:
            ernie_result = analyze_with_ernie(data['description'])
            return jsonify({
                "success": True,
                "ernie_result": ernie_result
            }), 200

        else:
            return jsonify({"error": "No image or description provided"}), 400

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy"}), 200

if __name__ == '__main__':
    print("="*60)
    print("Starting PaddleOCR + Baidu Studio ERNIE API Server...")
    print("="*60)
    app.run(host='0.0.0.0', port=5000, debug=True)
