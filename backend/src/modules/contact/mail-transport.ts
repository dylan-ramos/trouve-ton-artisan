import nodemailer from 'nodemailer';

import type { Environment } from '../../config/environment.js';

export interface MailMessage {
  from: string;
  to: string;
  replyTo: string;
  subject: string;
  text: string;
  html: string;
}

export interface MailTransport {
  sendMail(message: MailMessage): Promise<unknown>;
}

export function createMailTransport(environment: Environment): MailTransport {
  const transport = createBaseTransport(environment);
  const recipient = environment.SMTP_TEST_RECIPIENT;
  return {
    sendMail(message) {
      return transport.sendMail({ ...message, to: recipient ?? message.to });
    },
  };
}

function createBaseTransport(environment: Environment): MailTransport {
  if (!environment.SMTP_HOST) {
    if (environment.NODE_ENV === 'production')
      throw new Error('SMTP_HOST est obligatoire en production.');
    return nodemailer.createTransport({ jsonTransport: true });
  }
  if (Boolean(environment.SMTP_USER) !== Boolean(environment.SMTP_PASSWORD))
    throw new Error(
      'SMTP_USER et SMTP_PASSWORD doivent être définis ensemble.',
    );

  return nodemailer.createTransport({
    host: environment.SMTP_HOST,
    port: environment.SMTP_PORT,
    secure: environment.SMTP_SECURE,
    requireTLS: environment.NODE_ENV === 'production',
    disableFileAccess: true,
    disableUrlAccess: true,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
    ...(environment.SMTP_USER && environment.SMTP_PASSWORD
      ? {
          auth: {
            user: environment.SMTP_USER,
            pass: environment.SMTP_PASSWORD,
          },
        }
      : {}),
  });
}
