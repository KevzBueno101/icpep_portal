from rest_framework.throttling import UserRateThrottle


class GeminiUserMinuteThrottle(UserRateThrottle):
    scope = 'gemini_user_minute'
    rate = '30/minute'


class GeminiUserDailyThrottle(UserRateThrottle):
    scope = 'gemini_user_daily'
    rate = '100/day'