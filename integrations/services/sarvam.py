import os
import httpx
import base64
from typing import Optional

def get_api_key():
    return os.environ.get("SARVAM_API_KEY")

async def speech_to_text(audio_content: bytes) -> Optional[str]:
    """
    Converts audio bytes to text using Sarvam Saaras v3 API.
    """
    api_key = get_api_key()
    if not api_key:
        return "Error: SARVAM_API_KEY not configured."
    
    url = "https://api.sarvam.ai/speech-to-text"
    headers = {"api-subscription-key": api_key}
    
    files = {
        "file": ("audio.webm", audio_content, "audio/webm")
    }
    data = {
        "language_code": "en-IN",
        "model": "saaras:v3"
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, headers=headers, files=files, data=data)
            if response.status_code != 200:
                print(f"Sarvam API Error ({response.status_code}): {response.text}")
                return None
            result = response.json()
            return result.get("transcript")
        except Exception as e:
            print(f"Sarvam STT Network Error: {e}")
            return None

async def text_to_speech(text: str) -> Optional[str]:
    """
    Converts text to speech base64 string using Sarvam Bulbul v3 API (Streaming).
    """
    api_key = get_api_key()
    if not api_key:
        return None
        
    url = "https://api.sarvam.ai/text-to-speech/stream"
    headers = {
        "api-subscription-key": api_key,
        "Content-Type": "application/json"
    }
    
    payload = {
        "text": text,
        "target_language_code": "en-IN",
        "speaker": "meera", 
        "model": "bulbul:v3",
        "pace": 1.1,
        "speech_sample_rate": 22050,
        "output_audio_codec": "mp3",
        "enable_preprocessing": True
    }
    
    async with httpx.AsyncClient() as client:
        try:
            # We use the streaming endpoint but collect it into one base64 string
            response = await client.post(url, headers=headers, json=payload)
            if response.status_code != 200:
                print(f"Sarvam TTS Error ({response.status_code}): {response.text}")
                return None
            
            # The streaming endpoint returns raw binary audio
            audio_content = response.content
            return base64.b64encode(audio_content).decode('utf-8')
        except Exception as e:
            print(f"Sarvam TTS Network Error: {e}")
            return None
