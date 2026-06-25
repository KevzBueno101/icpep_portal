from django.db import models


class Milestone(models.Model):
    class Category(models.TextChoices):
        FOUNDING = 'founding', 'Founding'
        ACHIEVEMENT = 'achievement', 'Achievement'
        RECOGNITION = 'recognition', 'Recognition'
        EVENT = 'event', 'Event'
        COMMUNITY = 'community', 'Community'
        FEATURE = 'feature', 'Feature'

    title = models.CharField(max_length=200)
    headline = models.CharField(max_length=200)
    description = models.TextField()
    content = models.TextField()
    date = models.DateField()
    category = models.CharField(
        max_length=20,
        choices=Category.choices,
        default=Category.ACHIEVEMENT
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date', '-created_at']
        verbose_name = 'Milestone'
        verbose_name_plural = 'Milestones'

    def __str__(self):
        return f"{self.title} - {self.date}"


class MilestoneImage(models.Model):
    milestone = models.ForeignKey(
        Milestone,
        on_delete=models.CASCADE,
        related_name='images'
    )
    image = models.ImageField(upload_to='milestone_images/')
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['order']
        verbose_name = 'Milestone Image'
        verbose_name_plural = 'Milestone Images'

    def __str__(self):
        return f"{self.milestone.title} - Image {self.order}"
