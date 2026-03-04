import logging
import logging.handlers
import os
from datetime import datetime

def setup_logging():
    """Configure production-grade logging"""
    
    # Create logs directory
    os.makedirs("logs", exist_ok=True)
    
    # Logger instance
    logger = logging.getLogger("interview_gym")
    logger.setLevel(logging.DEBUG)
    
    # Format
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # File handler (rotate every day, keep 7 days)
    file_handler = logging.handlers.RotatingFileHandler(
        f"logs/app_{datetime.now().strftime('%Y%m%d')}.log",
        maxBytes=10_000_000,  # 10MB
        backupCount=7
    )
    file_handler.setLevel(logging.ERROR)
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)
    
    # Console handler (development)
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)
    
    return logger

logger = setup_logging()