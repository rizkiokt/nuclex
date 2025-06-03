from pydantic_settings import BaseSettings
from typing import Optional
import os
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    PROJECT_NAME: str = "NucLex API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY")
    DATA_DIR: str = "/anvil/projects/pur230006/data/rizki/nucl-reg-datasets/data/processed"
    
    class Config:
        case_sensitive = True

settings = Settings()
