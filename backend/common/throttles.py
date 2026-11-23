from rest_framework.throttling import AnonRateThrottle


class PublicStatsAnonThrottle(AnonRateThrottle):
    scope = 'public_stats'
