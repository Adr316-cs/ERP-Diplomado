'use strict';

const path = require('path');
const dotenv = require('dotenv');

dotenv.config({
  path: path.resolve(__dirname, '../../../.env'),
});

const { sendWelcomeEmail } = require('../services/email.service');

const recipient = process.argv[2];

if (!recipient) {
  console.error(
    'Uso: node src/scripts/test-welcome-email.js tu-correo@ejemplo.com'
  );
  process.exit(1);
}

async function main() {
  console.log('Enviando correo de bienvenida...');

  const result = await sendWelcomeEmail({
    to: recipient,
    name: 'Usuario de prueba',
  });

  console.log('Correo de bienvenida enviado correctamente.');
  console.log('ID del correo:', result.id);
}

main().catch((error) => {
  console.error('Error al enviar el correo de bienvenida:');
  console.error(error);
  process.exit(1);
});