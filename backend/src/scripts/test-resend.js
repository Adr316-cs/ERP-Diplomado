'use strict';

const path = require('path');
const dotenv = require('dotenv');
const { Resend } = require('resend');

dotenv.config({
  path: path.resolve(__dirname, '../../../.env'),
});

const resend = new Resend(process.env.RESEND_API_KEY);

const recipient = process.argv[2];

if (!recipient) {
  console.error('Debes indicar un correo destinatario.');
  console.error('Ejemplo: node src/scripts/test-resend.js tu-correo@ejemplo.com');
  process.exit(1);
}

async function main() {
  console.log('Enviando correo de prueba...');

  const { data, error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
    to: [recipient],
    subject: 'Prueba de Resend - S-TUN CODEX',
    html: `
      <div style="font-family: Arial, sans-serif;">
        <h2>Prueba de Resend</h2>
        <p>Este correo confirma que Resend está funcionando correctamente.</p>
        <p><strong>S-TUN CODEX ERP</strong></p>
      </div>
    `,
  });

  if (error) {
    console.error('Error al enviar el correo:');
    console.error(error);
    process.exit(1);
  }

  console.log('Correo enviado correctamente.');
  console.log('ID del correo:', data.id);
}

main().catch((error) => {
  console.error('Error inesperado:', error);
  process.exit(1);
});