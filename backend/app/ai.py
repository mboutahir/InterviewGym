import os
from dotenv import load_dotenv
from groq import Groq
import json
# 1. Load the secret key from .env
load_dotenv()
api_key = os.getenv("GROQ_API_KEY")

if not api_key:
    print("Error: GROQ_API_KEY not found. Check your .env file.")
    exit()

client = Groq(api_key=api_key)

print("sending request to Groq...")

def analyze_resume(resume_text: str) -> dict:
    system_prompt = """You are an expert AI Recruiter. 
        Extract the following details from the resume text provided:
      REQUIRED JSON STRUCTURE:
    {
        "first_name": "The candidate's first name",
        "last_name": "The candidate's last name (include middle names if part of surname)",
        "email": "candidate email",
        "skills": ["skill1", "skill2"],
        "rating": 8,
        "summary": "2 sentence summary"
    }
        Return ONLY raw JSON. Do not write markdown blocks (```json).
        Structure: {"name": "...", "years_experience": 0, "skills": [], "rating": 0, "summary": "..."}"""

    try:
        chat_completion = client.chat.completions.create(
            messages=[
                
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Resume Text:\n{resume_text}"}
                
            ],
            model="llama-3.3-70b-versatile",
            temperature=0,
        )
        raw_response = chat_completion.choices[0].message.content
        clean_json = raw_response.replace("```json", "").replace("```", "").strip()
        return json.loads(clean_json)
    except Exception as e:
        print(f"AI Error: {e}")
        return {"error": "Failed to analyze resume"}