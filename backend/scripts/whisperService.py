import whisper
import sys
import os
import json
import warnings

# Suppress FP16 CPU warnings
warnings.filterwarnings("ignore", message="FP16 is not supported on CPU")

# Force UTF-8 for Windows
if sys.platform == "win32":
    import io
    sys.stdin = io.TextIOWrapper(sys.stdin.buffer, encoding='utf-8')
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def transcribe(audio_path):
    try:
        # Using base model for speed and bilingual support
        model = whisper.load_model("base")
        
        # Force English/Telugu only and disable "smart" translations to stop hallucinations
        result = model.transcribe(
            audio_path, 
            task="transcribe",
            language="en", # Default to English to prevent nonsense
            initial_prompt="English and Telugu only. No other languages.",
            condition_on_previous_text=False
        )
        
        print(json.dumps({
            "success": True,
            "text": result["text"].strip(),
            "language": result["language"]
        }))
    except Exception as e:
        print(json.dumps({
            "success": False,
            "error": str(e)
        }))

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "No audio path provided"}))
        sys.exit(1)
        
    transcribe(sys.argv[1])
