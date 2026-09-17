from django.db import models


class Partnership(models.Model):
    name = models.CharField(max_length=150)
    email = models.EmailField()
    message = models.TextField()
    attachment = models.FileField(
        upload_to='partnerships/', null=True, blank=True, max_length=500
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Partnership Proposal from {self.name}"
