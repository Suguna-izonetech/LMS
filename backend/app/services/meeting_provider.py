from typing import Optional, Dict

class MeetingProvider:
    def create_meeting(self, title: str, start_time: str, duration_mins: int) -> Dict[str, str]:
        raise NotImplementedError

class ZoomProvider(MeetingProvider):
    def create_meeting(self, title: str, start_time: str, duration_mins: int) -> Dict[str, str]:
        # Mock Zoom API integration
        return {
            "join_url": f"https://zoom.us/j/mock{abs(hash(title))}",
            "start_url": f"https://zoom.us/s/mock{abs(hash(title))}",
            "meeting_id": f"mock{abs(hash(title))}"
        }

class GoogleMeetProvider(MeetingProvider):
    def create_meeting(self, title: str, start_time: str, duration_mins: int) -> Dict[str, str]:
        # Mock Google Meet API integration
        return {
            "join_url": f"https://meet.google.com/mock-{abs(hash(title))}",
            "start_url": f"https://meet.google.com/mock-{abs(hash(title))}",
            "meeting_id": f"mock-{abs(hash(title))}"
        }

class MeetingProviderFactory:
    @staticmethod
    def get_provider(provider_name: str) -> MeetingProvider:
        if provider_name.lower() == "zoom":
            return ZoomProvider()
        elif provider_name.lower() == "google_meet":
            return GoogleMeetProvider()
        else:
            # Fallback or generic provider
            return ZoomProvider()
