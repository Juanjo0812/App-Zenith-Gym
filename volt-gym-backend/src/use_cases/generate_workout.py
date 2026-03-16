from uuid import UUID
from typing import Dict, Any

class GenerateWorkoutUseCase:
    """
    Use Case: Generates an AI-tailored workout routine utilizing the LLMGateway.
    """
    def __init__(self, llm_gateway, user_repo):
        self.llm_gateway = llm_gateway
        self.user_repo = user_repo

    async def execute(self, user_id: UUID, goals: str, equipment: str, level: str) -> Dict[str, Any]:
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise ValueError("User not found")
            
        prompt = f"Generate a JSON workout routine for a {level} user named {user.name}." \
                 f" Goal: {goals}. Available equipment: {equipment}."
                 
        # Calling external gateway
        ai_response = await self.llm_gateway.generate_json(prompt)
        
        return ai_response
