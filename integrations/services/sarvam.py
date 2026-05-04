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
        "model": "saaras_v1" # Saaras v1 or v3 based on documentation
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
    Converts text to speech base64 string using Sarvam Bulbul v3 API.
    """
    api_key = get_api_key()
    if not api_key:
        return None
        
    url = "https://api.sarvam.ai/text-to-speech"
    headers = {
        "api-subscription-key": api_key,
        "Content-Type": "application/json"
    }
    
    payload = {
        "inputs": [text],
        "target_language_code": "en-IN",
        "speaker": "meera", # A popular English-IN voice
        "pitch": 0,
        "pace": 1.0,
        "loudness": 1.5,
        "speech_sample_rate": 16000,
        "enable_preprocessing": True,
        "model": "bulbul:v1"
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, headers=headers, json=payload)
            response.raise_for_status()
            result = response.json()
            # Sarvam returns audio_content as a base64 string
            return result.get("audios", [None])[0]
        except Exception as e:
            print(f"Sarvam TTS Error: {e}")
            return None
