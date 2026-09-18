from rest_framework.throttling import UserRateThrottle


class ChatUserMinuteThrottle(UserRateThrottle):
    scope = 'chat_user_minute'
    rate = '30/minute'


class ChatUserDailyThrottle(UserRateThrottle):
    scope = 'chat_user_daily'
    rate = '100/day'