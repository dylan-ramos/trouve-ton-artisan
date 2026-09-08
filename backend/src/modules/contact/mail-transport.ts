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
