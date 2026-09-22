from typing import Optional, Dict

class MeetingProvider:
    def create_meeting(self, title: str, start_time: str, duration_mins: int) -> Dict[str, str]:
        raise NotImplementedError

class ZoomProvider(MeetingProvider):
    def create_meeting(self, title: str, start_time: str, duration_mins: int) -> Dict[str, str]:
        meeting_hash = abs(hash(title))
        return {
            "join_url": f"https://zoom.us/j/{meeting_hash}",
            "start_url": f"https://zoom.us/s/{meeting_hash}",
            "meeting_id": str(meeting_hash)
        }

class GoogleMeetProvider(MeetingProvider):
    def create_meeting(self, title: str, start_time: str, duration_mins: int) -> Dict[str, str]:
        meeting_hash = abs(hash(title))
        return {
            "join_url": f"https://meet.google.com/meet-{meeting_hash}",
            "start_url": f"https://meet.google.com/meet-{meeting_hash}",
            "meeting_id": f"meet-{meeting_hash}"
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
