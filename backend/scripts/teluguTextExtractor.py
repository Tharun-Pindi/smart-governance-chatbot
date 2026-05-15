import sys
import re
import json
import io

# Force UTF-8 for Windows
sys.stdin = io.TextIOWrapper(sys.stdin.buffer, encoding='utf-8')
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def extract_telugu(text):
    if not text:
        return ""
    # Telugu Unicode range: \u0C00-\u0C7F
    # We also include common punctuation and spaces
    telugu_pattern = re.compile(r'[\u0C00-\u0C7F\s\.,!\?\(\)]+')
    matches = telugu_pattern.findall(text)
    return "".join(matches).strip()

if __name__ == "__main__":
    try:
        input_data = sys.stdin.read()
        if not input_data:
            sys.exit(0)
            
        data = json.loads(input_data)
        text = data.get('text', '')
        
        telugu_text = extract_telugu(text)
        
        print(json.dumps({
            "teluguText": telugu_text
        }))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
