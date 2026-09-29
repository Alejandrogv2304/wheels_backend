import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { type Transporter } from 'nodemailer';

type ReservationEmailData = {
  reservationId: string;
  conductorEmail: string;
  conductorNombre?: string;
  pasajeroNombre?: string;
  rutaNombre?: string;
  fechaSalida?: Date;
};

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: Transporter;
  private readonly sentKeys = new Set<string>();
  private readonly pendingKeys = new Map<string, Promise<void>>();

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('BREVO_SMTP_HOST');
    const port = Number(
      this.configService.get<string>('BREVO_SMTP_PORT', '587'),
    );
    const user = this.configService.get<string>('BREVO_SMTP_USER');
    const password = this.configService.get<string>('BREVO_SMTP_PASSWORD');

    if (!host || !user || !password) {
      throw new Error('Falta la configuración SMTP de Brevo');
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass: password },
    });
  }

  async enviarNuevaReserva(data: ReservationEmailData): Promise<void> {
    const nombreConductor = data.conductorNombre || 'conductor';
    const nombrePasajero = data.pasajeroNombre || 'Un pasajero';

    await this.enviarUnaVez(`reservation-created:${data.reservationId}`, {
      to: data.conductorEmail,
      subject: 'Nueva reserva para tu viaje | Wheels',
      html: this.plantillaReserva({
        titulo: 'Tienes una nueva reserva',
        saludo: `Hola ${nombreConductor},`,
        mensaje: `${nombrePasajero} ha reservado un cupo en tu viaje.`,
        data,
      }),
    });
  }

  async enviarCancelacionReserva(data: ReservationEmailData): Promise<void> {
    const nombreConductor = data.conductorNombre || 'conductor';
    const nombrePasajero = data.pasajeroNombre || 'Un pasajero';

    await this.enviarUnaVez(`reservation-cancelled:${data.reservationId}`, {
      to: data.conductorEmail,
      subject: 'Reserva cancelada | Wheels',
      html: this.plantillaReserva({
        titulo: 'Una reserva fue cancelada',
        saludo: `Hola ${nombreConductor},`,
        mensaje: `${nombrePasajero} ha cancelado su reserva para tu viaje.`,
        data,
      }),
    });
  }

  private async enviarUnaVez(
    key: string,
    message: { to: string; subject: string; html: string },
  ): Promise<void> {
    if (this.sentKeys.has(key)) {
      return;
    }

    const pending = this.pendingKeys.get(key);
    if (pending) {
      return pending;
    }

    const promise = this.transporter
      .sendMail({
        from: {
          name: this.configService.get<string>('BREVO_FROM_NAME', 'Wheels'),
          address: this.configService.getOrThrow<string>('BREVO_FROM_EMAIL'),
        },
        to: message.to,
        subject: message.subject,
        html: message.html,
      })
      .then(() => {
        this.sentKeys.add(key);
        this.logger.log(`Correo enviado: ${key}`);
      })
      .catch((error: unknown) => {
        const detail =
          error instanceof Error ? error.message : 'Error desconocido';
        this.logger.error(`No se pudo enviar el correo ${key}: ${detail}`);
        throw error;
      })
      .finally(() => {
        this.pendingKeys.delete(key);
      });

    this.pendingKeys.set(key, promise);
    return promise;
  }

  private plantillaReserva(data: {
    titulo: string;
    saludo: string;
    mensaje: string;
    data: ReservationEmailData;
  }): string {
    const esCancelacion = data.titulo.includes('cancelada');
    const colores = esCancelacion
      ? {
          principal: '#a8323a',
          degradado: '#c75b5b',
          fondoAviso: '#fff4f3',
          bordeAviso: '#f1d3d1',
        }
      : {
          principal: '#126346',
          degradado: '#16855e',
          fondoAviso: '#f3f8f5',
          bordeAviso: '#dce8e1',
        };

    const ruta = this.escapeHtml(data.data.rutaNombre || 'Tu ruta');
    const pasajero = this.escapeHtml(data.data.pasajeroNombre || 'Un pasajero');
    const fecha = data.data.fechaSalida
      ? new Intl.DateTimeFormat('es-CO', {
          dateStyle: 'long',
          timeStyle: 'short',
          timeZone: 'America/Bogota',
        }).format(data.data.fechaSalida)
      : 'No disponible';

    return `
      <!doctype html>
      <html lang="es">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <meta name="x-apple-disable-message-reformatting" />
          <style>
            @media screen and (max-width: 600px) {
              .page-padding { padding: 20px 12px !important; }
              .card-header { padding: 28px 24px !important; }
              .card-content { padding: 30px 24px !important; }
              .card-footer { padding: 0 24px 30px !important; }
              .title { font-size: 26px !important; }
            }
          </style>
        </head>
        <body style="margin:0;padding:0;background-color:#fbfdfb">
          <div style="display:none;max-height:0;overflow:hidden;opacity:0">
            ${this.escapeHtml(data.titulo)} en Wheels.
          </div>

          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" class="page-padding" style="width:100%;margin:0;padding:32px 16px;background-color:#fbfdfb">
            <tr>
              <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:640px;background-color:#ffffff;border:1px solid #cddbd4;border-radius:20px;overflow:hidden">
                  <tr>
                    <td class="card-header" style="padding:32px 40px;text-align:left;background-color:${colores.principal};background:linear-gradient(135deg,${colores.principal} 0%,${colores.degradado} 100%)">
                      <div style="display:inline-block;padding:8px 14px;color:#ffffff;background-color:rgba(255,255,255,.14);border-radius:999px;font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase">
                        Wheels
                      </div>
                      <h1 class="title" style="margin:18px 0 0;color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:30px;line-height:1.2;font-weight:700">
                        ${this.escapeHtml(data.titulo)}
                      </h1>
                    </td>
                  </tr>

                  <tr>
                    <td class="card-content" style="padding:40px">
                      <p style="margin:0 0 16px;color:#4b6258;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.7">
                        ${this.escapeHtml(data.saludo)}
                      </p>
                      <p style="margin:0 0 24px;color:#4b6258;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.7">
                        ${this.escapeHtml(data.mensaje)}
                      </p>

                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:28px 0 32px">
                        <tr>
                          <td style="padding:16px 18px;background-color:${colores.fondoAviso};border:1px solid ${colores.bordeAviso};border-radius:12px;color:#4b6258;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.8">
                            <strong>Ruta:</strong> ${ruta}<br />
                            <strong>Pasajero:</strong> ${pasajero}<br />
                            <strong>Salida:</strong> ${this.escapeHtml(fecha)}
                          </td>
                        </tr>
                      </table>

                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:32px">
                        <tr>
                          <td style="padding:16px 18px;background-color:${colores.fondoAviso};border:1px solid ${colores.bordeAviso};border-radius:12px">
                            <p style="margin:0;color:#4b6258;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.7">
                              ${data.titulo.includes('cancelada') ? 'El cupo ha quedado disponible nuevamente para tu viaje.' : 'Puedes revisar los detalles de tus reservas desde la aplicación Wheels.'}
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <tr>
                    <td class="card-footer" style="padding:0 40px 40px">
                      <div style="height:1px;margin-bottom:20px;background-color:#cddbd4"></div>
                      <p style="margin:0;color:#6c7f76;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6">
                        Wheels · Viajes compartidos y coordinados de manera eficiente.
                      </p>
                      <p style="margin:6px 0 0;color:#8a9992;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6">
                        Este es un mensaje automático. Por favor, no respondas a este correo.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;
  }

  private escapeHtml(value: string): string {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }
}
