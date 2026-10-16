import os
from dotenv import load_dotenv
from openai import AsyncOpenAI
import json
import edge_tts
import random

load_dotenv()
FALLBACK_QUESTIONS = [
    "I'm having a slight connection blip, but let's keep going. Could you tell me about a time you had to learn a new technology quickly?",
    "I missed the last part due to a glitch. Let's pivot slightly—what is your favorite project you've worked on recently?",
    "Apologies, I didn't quite catch that. Could you walk me through your problem-solving process for a difficult bug?",
    "My audio cut out for a second. Why don't we discuss your teamwork experience? Tell me about a time you disagreed with a coworker.",
    "I'm having trouble processing that last answer. Let's move on. What are you looking for in your next role?",
]


# Groq and Ollama both expose an OpenAI-compatible API, so one client works for both.
# Pick with LLM_PROVIDER in .env; LLM_MODEL overrides the default model.
LLM_PROVIDERS = {
    "groq": {
        "base_url": "https://api.groq.com/openai/v1",
        "api_key_env": "GROQ_API_KEY",
        "model": "llama-3.3-70b-versatile",
    },
    "ollama": {
        "base_url": os.getenv("OLLAMA_BASE_URL", "http://localhost:11434/v1"),
        "api_key_env": None,  # local server, no key needed
        "model": "qwen2.5:3b",
    },
}


class InterviewCoach:
    def __init__(self):
        provider = os.getenv("LLM_PROVIDER", "groq").lower()
        if provider not in LLM_PROVIDERS:
            raise ValueError(f"Unknown LLM_PROVIDER '{provider}'. Use one of: {list(LLM_PROVIDERS)}")
        config = LLM_PROVIDERS[provider]

        api_key = "ollama"  # the OpenAI client requires a non-empty key
        if config["api_key_env"]:
            api_key = os.getenv(config["api_key_env"])
            if not api_key:
                raise ValueError(f"{config['api_key_env']} not found. Check your .env file.")

        self.model = os.getenv("LLM_MODEL", config["model"])
        self.client = AsyncOpenAI(base_url=config["base_url"], api_key=api_key)
        print(f"LLM provider: {provider} ({self.model})")

    async def generate_Response(
        self,
        resource_context: str,
        job_description: str,
        user_message: str,
        chat_history,
        job_title: str,
    ):
        # Check if this is the very first message (before user message is saved to DB)
        # is_start = True only when chat_history is empty AND user message is the greeting
        is_start = len(chat_history) == 0 or (
            len(chat_history) == 1
            and chat_history[0]["content"] == "Hello, I am ready."
        )

        # 2. Dynamic Prompting
        if is_start:
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
            chat_completion = await self.client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_prompt},
                    *chat_history,
                    {"role": "user", "content": user_message},
                ],
                model=self.model,
                temperature=0.7,
                max_tokens=256,
            )
            ai_response = chat_completion.choices[0].message.content
            return ai_response
        except Exception as e:
            print(f"AI Error: {e}")
            return random.choice(FALLBACK_QUESTIONS)

    async def tts_response(self, response_text: str, output_file: str):
        try:
            audio = edge_tts.Communicate(response_text, "en-US-AndrewNeural")
            await audio.save(output_file)
            return True
        except Exception as e:
            print(f"TTS Error: {e}")
            return False

    async def generate_feedback(self, chat_history: list, job_description: str):
        from app.logging_config import logger

        system_prompt = f"""
        You are an expert Hiring Manager. You have just finished interviewing a candidate.
        
        JOB DESCRIPTION:
        {job_description}
        
        TASK:
        Review the conversation history below and generate a structured performance report.
        
        OUTPUT FORMAT (JSON ONLY):
        Return a single JSON object with these exact keys:
        {{
            "score": (integer 0-10),
            "feedback": (string, 2-3 sentences summary),
            "strengths": (list of strings, top 3),
            "improvements": (list of strings, top 3)
        }}
        """
        conversations = ""
        for msg in chat_history:
            role = "Candidate" if msg["role"] == "user" else "interviewer"
            conversations += f"{role}: {msg['content']}\n"
        message = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Interview Transcript:\n\n{conversations}"},
        ]
        try:
            logger.info(
                f"Generating feedback for interview with {len(chat_history)} messages"
            )
            response = await self.client.chat.completions.create(
                messages=message,
                model=self.model,
                temperature=0.5,
                response_format={"type": "json_object"},
            )
            # turns it into a python dict
            feedback_data = json.loads(response.choices[0].message.content)
            logger.info(
                f"Feedback generated successfully: score={feedback_data.get('score')}"
            )
            return feedback_data

        except Exception as e:
            logger.error(f"Error generating feedback: {e}", exc_info=True)
            return {
                "score": 0,
                "feedback": "Error generating feedback.",
                "strengths": [],
                "improvements": [],
            }

    async def analyze_resume(self, jobDescription: str, resume: str):
        from app.logging_config import logger

        system_prompt = f"""
            You are an expert ATS (Applicant Tracking System) and Resume Coach.
            
            JOB DESCRIPTION:
            {jobDescription}
            
            RESUME TEXT:
            {resume}
            
            TASK:
            Analyze how well this resume matches the job description.
            
            OUTPUT FORMAT (JSON ONLY):
            {{
                "score": (integer 0-100),
                "feedback": (string, 2 sentences on main gaps),
                "keywords_missing": (list of strings, important keywords found in JD but missing in Resume)
            }}
            """
        message = [
            {"role": "system", "content": system_prompt},
        ]
        try:
            logger.info("Analyzing resume against job description")
            ai_response = await self.client.chat.completions.create(
                messages=message,
                model=self.model,
                temperature=0.3,
                response_format={"type": "json_object"},
            )
            resume_data = json.loads(ai_response.choices[0].message.content)
            logger.info(f"Resume analysis complete: score={resume_data.get('score')}")
            return resume_data
        except Exception as e:
            logger.error(f"Error analyzing resume: {e}", exc_info=True)
            return {
                "score": 0,
                "feedback": "Could not analyze.",
                "keywords_missing": [],
            }


interview_coach = InterviewCoach()
