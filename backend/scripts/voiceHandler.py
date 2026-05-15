import sys
import json
import os
from whisperService import transcribe
from teluguTextExtractor import extract_telugu

# This script can be used to handle full voice processing in one go if needed.
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No audio path provided"}))
        sys.exit(1)
        
    audio_path = sys.argv[1]
    # ... logic ...
    # For now, we use the JS service to call specific scripts.
    print(json.dumps({"message": "Use whisperService.py or teluguTextExtractor.py directly"}))
