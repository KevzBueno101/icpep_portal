from django.db import models


class BugReport(models.Model):
    SEVERITY_CHOICES = [
        ('Low', 'Low'),
        ('Medium', 'Medium'),
        ('High', 'High'),
        ('Critical', 'Critical'),
    ]

    name = models.CharField(max_length=150)
    email = models.EmailField()
    page = models.CharField(max_length=500, blank=True, default='')
    severity = models.CharField(
        max_length=20, choices=SEVERITY_CHOICES, default='Medium'
    )
    summary = models.CharField(max_length=500)
    steps = models.TextField(blank=True, default='')
    screenshot = models.ImageField(
        upload_to='bug_reports/', null=True, blank=True, max_length=500
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.summary} ({self.name})"

    class Meta:
        ordering = ['-created_at']
