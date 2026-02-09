import os
from dotenv import load_dotenv
from groq import Groq
import json
import edge_tts
import random
# 1. Load the secret key from .env
load_dotenv()
FALLBACK_QUESTIONS = [
    "I'm having a slight connection blip, but let's keep going. Could you tell me about a time you had to learn a new technology quickly?",
    "I missed the last part due to a glitch. Let's pivot slightly—what is your favorite project you've worked on recently?",
    "Apologies, I didn't quite catch that. Could you walk me through your problem-solving process for a difficult bug?",
    "My audio cut out for a second. Why don't we discuss your teamwork experience? Tell me about a time you disagreed with a coworker.",
    "I'm having trouble processing that last answer. Let's move on. What are you looking for in your next role?"
]

class InterviewCoach:
    def __init__(self):
        self.api_key= os.getenv("GROQ_API_KEY")
        if not self.api_key:
            print("Error: GROQ_API_KEY not found. Check your .env file.")
            exit()
        self.client = Groq(api_key=self.api_key)
    async def generate_Response(self, resource_context: str, job_description: str, user_message: str, chat_history, job_title:str):
        is_start = len(chat_history) == 0

        # 2. Dynamic Prompting
        if is_start:
            # 🟢 MODE 1: THE WELCOME (Warm, Professional, Ice-Breaker)
            system_prompt = f"""
            You are Alex, a Senior Recruiter at a top tech company.
            You are starting an interview for the {job_title} position.

            YOUR GOAL RIGHT NOW:
            - Introduce yourself briefly ("Hi, I'm Alex...").
            - Mention you have reviewed their resume and are excited to chat.
            - Ask a simple, open-ended icebreaker question to start (e.g., "Tell me a little about your background" or "Walk me through your resume").
            
            TONE:
            - Warm, professional, and inviting.
            - DO NOT ask technical questions yet. Just start the conversation.
            - Keep it short (2 sentences max).
            """
        else:
            system_prompt = f"""
            You are Alex, a Senior {job_title} interviewer.
            
            CONTEXT:
            - Job: {job_description}
            - Candidate Resume info: {resource_context}
            
            YOUR GOAL:
            - The candidate just answered your last question.
            - Acknowledge their answer briefly (e.g., "That makes sense," or "I see.").
            - Ask a relevant follow-up question based on the Job Description or their Resume.
            - Focus on assessing their skills for {job_title}.
            
            TONE:
            - Professional but conversational.
            - Be concise (1-3 sentences).
            - Do not repeat "I am an AI".
            """
        try:
            chat_completion = self.client.chat.completions.create(
                messages=[
                    
                        {"role": "system", "content": system_prompt},
                        *chat_history,
                        {"role": "user", "content": user_message},
                    
                ],
                model="llama-3.3-70b-versatile",
                temperature=0.7,
                max_tokens=256,
            )
            ai_response = chat_completion.choices[0].message.content
            return ai_response
        except Exception as e:
            print(f"AI Error: {e}")
            return random.choice(FALLBACK_QUESTIONS)
    async def tts_response(self, response_text:str, output_file:str):
        try:
            audio = edge_tts.Communicate(response_text, "en-US-AndrewNeural")
            await audio.save(output_file)
            return True
        except Exception as e:
            print(f"TTS Error: {e}")
            return False
interview_coach = InterviewCoach()
        
