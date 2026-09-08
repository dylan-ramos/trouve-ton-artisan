import { ApiError } from '../../http/api-error.js';
import type { ContactInput } from '../../http/validation.js';
import type { ArtisanService } from '../artisans/artisan.service.js';
import type { MailTransport } from './mail-transport.js';

const escapeHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
      })[character] ?? character,
  );

export class ContactService {
  constructor(
    private readonly artisanService: ArtisanService,
    private readonly transport: MailTransport,
    private readonly from: string,
  ) {}

  async send(slug: string, input: ContactInput) {
    if (input.website) return;
    const artisan = await this.artisanService.findContactBySlug(slug);
    if (!artisan?.contactEmail) throw new ApiError(404, 'Artisan introuvable.');

    const safeName = escapeHtml(input.name);
    const safeEmail = escapeHtml(input.email);
    const safeSubject = escapeHtml(input.subject);
    const safeMessage = escapeHtml(input.message).replaceAll('\n', '<br>');
    try {
      await this.transport.sendMail({
        from: this.from,
        to: artisan.contactEmail,
        replyTo: input.email,
        subject: `[Trouve ton artisan] ${input.subject}`,
        text: `Nom : ${input.name}\nE-mail : ${input.email}\nObjet : ${input.subject}\n\n${input.message}`,
        html: `<p><strong>Nom :</strong> ${safeName}</p><p><strong>E-mail :</strong> ${safeEmail}</p><p><strong>Objet :</strong> ${safeSubject}</p><p>${safeMessage}</p>`,
      });
    } catch {
      throw new ApiError(
        503,
        "Le message n'a pas pu être envoyé. Veuillez réessayer plus tard.",
      );
    }
  }
}
