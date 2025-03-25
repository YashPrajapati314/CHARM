import re, cv2
from flask import Flask, request, jsonify
from paddleocr import PaddleOCR
import os
from werkzeug.utils import secure_filename

app = Flask(__name__)

UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

@app.route('/process-image', methods=['POST'])
def process_image():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400

    file = request.files['file']
    filename = secure_filename(file.filename)
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(file_path)

    ocr = PaddleOCR(use_angle_cls=True, lang='en')

    image = cv2.imread(file_path)

    result = ocr.ocr(img=image, cls=True, bin=True)

    if result==[None]:
        return jsonify({'list': []})

    extracted_text = []
    for line in result:
        for word_info in line:
            extracted_text.append(word_info[1][0])

    os.remove(file_path)

    extract = '\n'.join(extracted_text)

    SAPID_REGEX = r'[0-9]{11}'

    sapid_list = list(map(int, re.findall(SAPID_REGEX, extract)))

    print('SAP ID List')
    print(sapid_list)

    return jsonify({'list': sapid_list})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
