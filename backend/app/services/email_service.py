import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import aiosmtplib

from app.core.config import settings

logger = logging.getLogger("email_service")


class EmailService:
    @staticmethod
    async def send_otp_email(recipient_email: str, otp_code: str) -> bool:
        """
        Dispatches a 6-digit OTP code to a staff member's email via SMTP.
        Falls back gracefully with detailed logs if SMTP is not configured in local dev.
        """
        subject = f"[{settings.APP_NAME}] Kode Verifikasi OTP Masuk Staff: {otp_code}"
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {{ font-family: 'Plus Jakarta Sans', Arial, sans-serif; background-color: #FAFAFA; color: #111827; padding: 24px; }}
                .card {{ background-color: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 12px; max-width: 500px; margin: 0 auto; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }}
                .logo {{ font-size: 20px; font-weight: bold; color: #4F46E5; margin-bottom: 24px; }}
                .otp-box {{ background-color: #EEF2FF; border: 2px dashed #4F46E5; border-radius: 8px; padding: 16px; text-align: center; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #4F46E5; margin: 24px 0; }}
                .footer {{ font-size: 12px; color: #6B7280; margin-top: 24px; line-height: 1.5; }}
            </style>
        </head>
        <body>
            <div class="card">
                <div class="logo">Web Baca Novel Publik — Portal Staff</div>
                <p>Halo,</p>
                <p>Gunakan kode OTP di bawah ini untuk menyelesaikan proses autentikasi masuk ke Portal Staff Anda:</p>
                <div class="otp-box">{otp_code}</div>
                <p>Kode ini berlaku selama <strong>5 menit</strong>. Jangan bagikan kode ini kepada siapapun demi keamanan akun Anda.</p>
                <div class="footer">
                    Jika Anda tidak merasa melakukan permintaan masuk ini, harap abaikan email ini atau segera hubungi Administrator sistem.
                </div>
            </div>
        </body>
        </html>
        """

        message = MIMEMultipart("alternative")
        message["Subject"] = subject
        message["From"] = settings.SMTP_FROM
        message["To"] = recipient_email

        # Attach HTML body
        part = MIMEText(html_content, "html", "utf-8")
        message.attach(part)

        # In development if SMTP_USER is blank or localhost, log OTP to console
        if not settings.SMTP_USER or settings.SMTP_HOST == "localhost":
            logger.info(f"==> [DEV EMAIL MOCK] OTP for {recipient_email}: {otp_code}")
            print(f"\n[DEV EMAIL OTP] Destination: {recipient_email} | OTP: {otp_code}\n")
            return True

        try:
            await aiosmtplib.send(
                message,
                hostname=settings.SMTP_HOST,
                port=settings.SMTP_PORT,
                username=settings.SMTP_USER if settings.SMTP_USER else None,
                password=settings.SMTP_PASSWORD if settings.SMTP_PASSWORD else None,
                start_tls=settings.SMTP_PORT == 587,
            )
            return True
        except Exception as exc:
            logger.error(f"Failed to deliver OTP email to {recipient_email}: {exc}")
            # Still log in terminal during dev so login workflow does not get blocked
            print(f"\n[DEV FALLBACK OTP] Destination: {recipient_email} | OTP: {otp_code} (SMTP failed: {exc})\n")
            return False


email_service = EmailService()
