import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings


def _send(to: list[str], subject: str, html: str):
    """
    Envío de email adaptado para Mailpit (dev, puerto 1025, sin TLS)
    y SMTP real con STARTTLS (producción, puerto 587).
    Si SMTP_USER está vacío, lo omite completamente.
    """
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{settings.EMAIL_FROM_NAME} <{settings.EMAIL_FROM}>"
    msg["To"] = ", ".join(to)
    msg.attach(MIMEText(html, "html"))

    try:
        if settings.SMTP_PORT == 465:
            # SSL directo (producción con SSL)
            import ssl as _ssl
            ctx = _ssl.create_default_context()
            with smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, context=ctx) as server:
                if settings.SMTP_USER:
                    server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.sendmail(settings.EMAIL_FROM, to, msg.as_string())
        elif settings.SMTP_PORT == 587:
            # STARTTLS (Gmail / producción)
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                server.starttls()
                if settings.SMTP_USER:
                    server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.sendmail(settings.EMAIL_FROM, to, msg.as_string())
        else:
            # Puerto 1025 — Mailpit local, sin TLS ni auth
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                server.sendmail(settings.EMAIL_FROM, to, msg.as_string())
    except Exception as e:
        print(f"[EMAIL] Error al enviar a {to}: {e}")


_STYLE = """
  font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a2e; max-width: 600px; margin: auto;
  border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden;
"""
_HEADER = """
  background: linear-gradient(135deg, #0d3b66 0%, #1a6bb5 100%);
  color: white; padding: 24px 32px;
"""
_BODY = "padding: 24px 32px;"
_FOOTER = "background: #f5f7fa; padding: 16px 32px; font-size: 12px; color: #888; text-align: center;"


def _base_template(title: str, body_html: str, color: str = "#1a6bb5") -> str:
    return f"""
<div style="{_STYLE}">
  <div style="{_HEADER}">
    <h2 style="margin:0; font-size:20px;">Sistema de Vehículos SEDC</h2>
    <p style="margin:4px 0 0; opacity:.85; font-size:14px;">Secretaría de Educación y Cultura del Cauca</p>
  </div>
  <div style="{_BODY}">
    <h3 style="color:{color}; margin-top:0;">{title}</h3>
    {body_html}
  </div>
  <div style="{_FOOTER}">
    Este mensaje es generado automáticamente. No responder a este correo.<br>
    Consultas: gestionadministrativa.educación@cauca.gov.co
  </div>
</div>
"""


def send_solicitud_received(solicitud, dependencia_nombre: str):
    html = _base_template(
        "✅ Solicitud Recibida",
        f"""
        <p>Su solicitud de vehículo ha sido recibida exitosamente.</p>
        <table style="width:100%; border-collapse:collapse; font-size:14px;">
          <tr><td style="padding:6px; color:#555;">Código:</td><td><b>#{solicitud.id}</b></td></tr>
          <tr><td style="padding:6px; color:#555;">Dependencia:</td><td>{dependencia_nombre}</td></tr>
          <tr><td style="padding:6px; color:#555;">Destino:</td><td>{solicitud.municipio_destino}</td></tr>
          <tr><td style="padding:6px; color:#555;">Fecha salida:</td><td>{solicitud.fecha_salida}</td></tr>
          <tr><td style="padding:6px; color:#555;">Fecha regreso:</td><td>{solicitud.fecha_regreso}</td></tr>
        </table>
        <p style="margin-top:16px;">Le notificaremos por este medio cuando su solicitud sea procesada.</p>
        """,
    )
    _send([solicitud.email_respuesta], f"[SEDC Vehículos] Solicitud #{solicitud.id} recibida", html)


def send_aprobacion(solicitud, vehiculo, conductor):
    html = _base_template(
        "🚗 Solicitud APROBADA",
        f"""
        <p>Su solicitud de vehículo ha sido <b style="color:#2e7d32;">aprobada</b>.</p>
        <table style="width:100%; border-collapse:collapse; font-size:14px;">
          <tr><td style="padding:6px; color:#555;">Código:</td><td><b>#{solicitud.id}</b></td></tr>
          <tr><td style="padding:6px; color:#555;">Destino:</td><td>{solicitud.municipio_destino} — {solicitud.lugar_destino_detalle}</td></tr>
          <tr><td style="padding:6px; color:#555;">Fecha salida:</td><td>{solicitud.fecha_salida}</td></tr>
          <tr><td style="padding:6px; color:#555;">Fecha regreso:</td><td>{solicitud.fecha_regreso}</td></tr>
          <tr><td style="padding:6px; color:#555;">Vehículo asignado:</td><td><b>{vehiculo.placa}</b> — {vehiculo.marca} {vehiculo.modelo}</td></tr>
          <tr><td style="padding:6px; color:#555;">Conductor:</td><td><b>{conductor.nombre}</b> — Tel: {conductor.telefono}</td></tr>
        </table>
        <p style="margin-top:16px; background:#e8f5e9; padding:12px; border-radius:8px;">
          📞 Por favor contacte al conductor con suficiente antelación para coordinar la salida:
          <br><b>{conductor.nombre} — {conductor.telefono}</b>
        </p>
        {"<p><b>Observaciones:</b> " + solicitud.observaciones_admin + "</p>" if solicitud.observaciones_admin else ""}
        """,
        color="#2e7d32",
    )
    recipients = [solicitud.email_respuesta]
    _send(recipients, f"[SEDC Vehículos] Solicitud #{solicitud.id} APROBADA", html)


def send_rechazo(solicitud, motivo: str):
    html = _base_template(
        "❌ Solicitud Rechazada",
        f"""
        <p>Su solicitud de vehículo ha sido <b style="color:#c62828;">rechazada</b>.</p>
        <table style="width:100%; border-collapse:collapse; font-size:14px;">
          <tr><td style="padding:6px; color:#555;">Código:</td><td><b>#{solicitud.id}</b></td></tr>
          <tr><td style="padding:6px; color:#555;">Destino:</td><td>{solicitud.municipio_destino}</td></tr>
          <tr><td style="padding:6px; color:#555;">Fecha solicitada:</td><td>{solicitud.fecha_salida} → {solicitud.fecha_regreso}</td></tr>
        </table>
        <p style="margin-top:16px; background:#ffebee; padding:12px; border-radius:8px;">
          <b>Motivo del rechazo:</b><br>{motivo}
        </p>
        <p>Para mayor información contáctese con gestión administrativa.</p>
        """,
        color="#c62828",
    )
    _send([solicitud.email_respuesta], f"[SEDC Vehículos] Solicitud #{solicitud.id} rechazada", html)


def send_cancelacion(solicitud, observaciones: str):
    html = _base_template(
        "⚠️ Solicitud Cancelada",
        f"""
        <p>Su solicitud de vehículo ha sido <b>cancelada</b>.</p>
        <table style="width:100%; border-collapse:collapse; font-size:14px;">
          <tr><td style="padding:6px; color:#555;">Código:</td><td><b>#{solicitud.id}</b></td></tr>
          <tr><td style="padding:6px; color:#555;">Destino:</td><td>{solicitud.municipio_destino}</td></tr>
          <tr><td style="padding:6px; color:#555;">Fechas:</td><td>{solicitud.fecha_salida} → {solicitud.fecha_regreso}</td></tr>
        </table>
        {"<p style='margin-top:12px;'><b>Observaciones:</b> " + observaciones + "</p>" if observaciones else ""}
        """,
        color="#e65100",
    )
    _send([solicitud.email_respuesta], f"[SEDC Vehículos] Solicitud #{solicitud.id} cancelada", html)


def send_reagendamiento(nueva, original, vehiculo, conductor):
    html = _base_template(
        "📅 Solicitud Reagendada",
        f"""
        <p>Su solicitud ha sido <b>reagendada</b> con nuevas fechas y vehículo asignado.</p>
        <table style="width:100%; border-collapse:collapse; font-size:14px;">
          <tr><td style="padding:6px; color:#555;">Nueva solicitud:</td><td><b>#{nueva.id}</b> (original #{original.id})</td></tr>
          <tr><td style="padding:6px; color:#555;">Destino:</td><td>{nueva.municipio_destino}</td></tr>
          <tr><td style="padding:6px; color:#555;">Nuevas fechas:</td><td><b>{nueva.fecha_salida} → {nueva.fecha_regreso}</b></td></tr>
          <tr><td style="padding:6px; color:#555;">Vehículo:</td><td>{vehiculo.placa} — {vehiculo.marca} {vehiculo.modelo}</td></tr>
          <tr><td style="padding:6px; color:#555;">Conductor:</td><td>{conductor.nombre} — {conductor.telefono}</td></tr>
        </table>
        {"<p style='margin-top:12px;'><b>Observaciones:</b> " + nueva.observaciones_admin + "</p>" if nueva.observaciones_admin else ""}
        """,
        color="#1565c0",
    )
    _send([nueva.email_respuesta], f"[SEDC Vehículos] Solicitud reagendada — Nueva #{nueva.id}", html)


def send_notification(to: list[str], subject: str, body: str):
    """Envío genérico para casos especiales."""
    _send(to, subject, _base_template(subject, f"<p>{body}</p>"))
