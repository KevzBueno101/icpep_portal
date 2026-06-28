import os
from django.core.mail import send_mail
from django.conf import settings


def send_password_reset_email(user, reset_link):
    subject = "ICpEP Portal — Password Reset Request"

    plain_message = f"""
Hi {user.first_name or user.email},

Reset your ICpEP Portal password here:
{reset_link}

This link expires in 24 hours.
If you didn't request this, ignore this email.

— ICpEP.SE | Catanduanes State University
    """.strip()

    html_message = f"""
    <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto;">
        <div style="background: #03152B; padding: 24px 32px; border-radius: 12px 12px 0 0;">
            <h2 style="color: #ffffff; margin: 0; font-size: 18px; letter-spacing: 0.05em;">
                ICpEP.SE Portal
            </h2>
            <p style="color: #7E91A6; margin: 4px 0 0; font-size: 12px;">
                Catanduanes State University
            </p>
        </div>

        <div style="padding: 32px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px; background: #ffffff;">
            <p style="color: #1e293b; font-size: 15px; margin: 0 0 8px;">
                Hi <strong>{user.first_name or user.email}</strong>,
            </p>
            <p style="color: #475569; font-size: 14px; margin: 0 0 24px;">
                We received a request to reset your ICpEP Portal password.
                Click the button below to set a new one.
            </p>

            <div style="text-align: center; margin: 32px 0;">
                <a href="{reset_link}"
                   style="background: #03152B; color: #ffffff; padding: 14px 36px;
                          border-radius: 8px; text-decoration: none;
                          font-weight: bold; font-size: 14px; letter-spacing: 0.03em;">
                    Reset My Password
                </a>
            </div>

            <p style="color: #64748b; font-size: 13px; text-align: center;">
                This link expires in <strong>24 hours</strong>.
            </p>

            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">

            <p style="color: #94a3b8; font-size: 11px; text-align: center; margin: 0;">
                If you didn't request a password reset, you can safely ignore this email.
                Your password will not change.
            </p>
        </div>
    </div>
    """

    send_mail(
        subject=subject,
        message=plain_message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        html_message=html_message,
        fail_silently=False,
    )