import json
from abc import ABC, abstractmethod

# Masking logic
def mask_credentials(creds_json: str) -> dict:
    if not creds_json:
        return {}
    creds = json.loads(creds_json)
    masked = {}
    for k, v in creds.items():
        if k in ["password", "key_secret", "auth_token", "secret", "client_secret"]:
            masked[k] = "********"
        else:
            masked[k] = v
    return masked

class PaymentProvider(ABC):
    @abstractmethod
    def verify_credentials(self) -> bool:
        pass
        
    @abstractmethod
    def process_webhook(self, payload: dict) -> dict:
        pass

class NotificationProvider(ABC):
    @abstractmethod
    def verify_credentials(self) -> bool:
        pass
        
    @abstractmethod
    def send_message(self, recipient: str, message: str) -> bool:
        pass
        
import logging

logger = logging.getLogger(__name__)

class IntegrationFactory:
    @staticmethod
    def dispatch_welcome_email(student_name: str, course_name: str, amount: float, join_date: str):
        logger.info(f"[Email Notification] Welcome {student_name} to {course_name}. Amount: {amount}, Date: {join_date}.")
