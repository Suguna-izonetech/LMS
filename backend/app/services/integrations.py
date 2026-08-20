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
        
class IntegrationFactory:
    @staticmethod
    def dispatch_welcome_email(student_name: str, course_name: str, amount: float, join_date: str):
        # In a real system, this would instantiate the institute's active EmailProvider and send
        print(f"[Mock Email] Welcome {student_name} to {course_name}. You paid {amount} on {join_date}.")
