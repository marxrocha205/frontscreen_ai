from app.services.llm_service import llm_service
import asyncio

async def test():
    gen = llm_service.generate_response_stream(
        user_id=1, 
        plan_id=3, 
        user_message="Você se chama ScreenAI, correto? E qual modelo exato (GPT, Claude, Gemini, DeepSeek) de LLM você é neste momento?", 
        model_override="openrouter/deepseek/deepseek-r1"
    )
    
    resp = ""
    async for chunk in gen:
        resp += chunk
    
    print("\n\nRESPOSTA DA IA:\n", resp)

asyncio.run(test())
