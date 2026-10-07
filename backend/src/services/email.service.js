'use strict';

const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendWelcomeEmail({ to, name }) {
  if (!to) {
    throw new Error('No se proporcionó un correo destinatario.');
  }

  const recipientName = name || 'Usuario';

  const { data, error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
    to: [to],
    subject: 'Bienvenido a S-TUN CODEX',
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>¡Bienvenido a S-TUN CODEX!</h2>

        <p>Hola <strong>${recipientName}</strong>,</p>

        <p>
          Tu usuario ha sido creado correctamente en
          <strong>S-TUN CODEX ERP</strong>.
        </p>

        <p>
          Ya puedes acceder al sistema con las credenciales
          proporcionadas por el administrador.
        </p>

        <p>
          Saludos,<br>
          <strong>Equipo S-TUN CODEX</strong>
        </p>
      </div>
    `,
  });

  if (error) {
    throw new Error(error.message || 'No se pudo enviar el correo.');
  }

  return data;
}

module.exports = {
  sendWelcomeEmail,
};