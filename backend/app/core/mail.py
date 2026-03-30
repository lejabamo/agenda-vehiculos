import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings

def send_email(subject: str, recipient: str, body_html: str):
    """Enviador universal de correos vía SMTP."""
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        print(f"DEBUG: Email simulating send to {recipient}. Subject: {subject}")
        return True

    msg = MIMEMultipart()
    msg['From'] = f"{settings.EMAIL_FROM_NAME} <{settings.EMAIL_FROM}>"
    msg['To'] = recipient
    msg['Subject'] = subject

    msg.attach(MIMEText(body_html, 'html'))

    try:
        server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
        server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.send_message(msg)
        server.quit()
        return True
    except Exception as e:
        print(f"ERROR: No se pudo enviar el correo: {str(e)}")
        return False

def send_forgot_password_email(recipient: str, token: str):
    """Correo específico para recuperar contraseña."""
    link = f"{settings.FRONTEND_URL}/vehiculos/admin/reset-password?token={token}"
    html = f"""
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #2563eb;">Recuperación de Contraseña - SEDC</h2>
            <p>Hola,</p>
            <p>Has solicitado restablecer tu contraseña para el sistema de Agenda de Vehículos de la SEDC.</p>
            <p>Por favor, haz clic en el siguiente botón para continuar:</p>
            <a href="{link}" style="background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Restablecer Contraseña
            </a>
            <p style="margin-top: 20px; font-size: 0.8rem; color: #666;">
                Si no realizaste esta solicitud, puedes ignorar este correo.
            </p>
        </div>
    """
    return send_email("Recuperación de Contraseña - SEDC", recipient, html)
