import { type ChangeEvent, type SubmitEvent, useRef, useState } from 'react';

import { apiClient, ApiError } from '../services/api-client';
import type { ContactPayload } from '../types/artisan';

type VisibleField = Exclude<keyof ContactPayload, 'website'>;
type FieldErrors = Partial<Record<VisibleField, string>>;
const initialValues: ContactPayload = {
  name: '',
  email: '',
  subject: '',
  message: '',
  website: '',
};

function validate(values: ContactPayload): FieldErrors {
  const errors: FieldErrors = {};
  if (values.name.trim().length < 2)
    errors.name = 'Saisissez au moins 2 caractères.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email))
    errors.email = 'Saisissez une adresse e-mail valide.';
  if (values.subject.trim().length < 3)
    errors.subject = 'Saisissez au moins 3 caractères.';
  if (values.message.trim().length < 10)
    errors.message = 'Saisissez au moins 10 caractères.';
  return errors;
}

export function ContactForm({ artisanSlug }: { artisanSlug: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<
    'idle' | 'sending' | 'success' | 'error'
  >('idle');
  const [submitError, setSubmitError] = useState('');

  function change(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setValues((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  }

  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === 'sending') return;
    const nextErrors = validate(values);
    setErrors(nextErrors);
    const firstInvalidField = Object.keys(nextErrors)[0];
    if (firstInvalidField) {
      setStatus('idle');
      formRef.current
        ?.querySelector<HTMLElement>(`[name="${firstInvalidField}"]`)
        ?.focus();
      return;
    }
    setStatus('sending');
    setSubmitError('');
    try {
      await apiClient.sendContact(artisanSlug, values);
      setStatus('success');
      setValues(initialValues);
    } catch (error) {
      setSubmitError(
        error instanceof ApiError
          ? error.message
          : 'Une erreur inattendue est survenue.',
      );
      setStatus('error');
    }
  }

  const field = (name: VisibleField) => ({
    'aria-describedby': errors[name]
      ? `${name}-help ${name}-error`
      : `${name}-help`,
    'aria-invalid': Boolean(errors[name]),
  });

  return (
    <form
      ref={formRef}
      className="contact-form"
      noValidate
      onSubmit={(event) => void submit(event)}
    >
      <p className="text-body-secondary">Tous les champs sont obligatoires.</p>
      <div className="form-field">
        <label className="form-label" htmlFor="contact-name">
          Nom
        </label>
        <input
          className="form-control"
          id="contact-name"
          name="name"
          autoComplete="name"
          maxLength={100}
          required
          value={values.name}
          onChange={change}
          {...field('name')}
        />
        <small id="name-help">Votre nom complet.</small>
        {errors.name && (
          <p className="invalid-feedback d-block" id="name-error">
            {errors.name}
          </p>
        )}
      </div>
      <div className="form-field">
        <label className="form-label" htmlFor="contact-email">
          E-mail
        </label>
        <input
          className="form-control"
          id="contact-email"
          name="email"
          type="email"
          autoComplete="email"
          maxLength={254}
          required
          value={values.email}
          onChange={change}
          {...field('email')}
        />
        <small id="email-help">L'artisan répondra à cette adresse.</small>
        {errors.email && (
          <p className="invalid-feedback d-block" id="email-error">
            {errors.email}
          </p>
        )}
      </div>
      <div className="form-field">
        <label className="form-label" htmlFor="contact-subject">
          Objet
        </label>
        <input
          className="form-control"
          id="contact-subject"
          name="subject"
          maxLength={150}
          required
          value={values.subject}
          onChange={change}
          {...field('subject')}
        />
        <small id="subject-help">Résumez votre demande.</small>
        {errors.subject && (
          <p className="invalid-feedback d-block" id="subject-error">
            {errors.subject}
          </p>
        )}
      </div>
      <div className="form-field">
        <label className="form-label" htmlFor="contact-message">
          Message
        </label>
        <textarea
          className="form-control"
          id="contact-message"
          name="message"
          rows={6}
          maxLength={5000}
          required
          value={values.message}
          onChange={change}
          {...field('message')}
        />
        <small id="message-help">
          Décrivez votre besoin sans transmettre de donnée sensible.
        </small>
        {errors.message && (
          <p className="invalid-feedback d-block" id="message-error">
            {errors.message}
          </p>
        )}
      </div>
      <div className="contact-form__honeypot" aria-hidden="true">
        <label htmlFor="contact-website">Site web</label>
        <input
          id="contact-website"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={values.website}
          onChange={change}
        />
      </div>
      <button
        className="btn btn-primary"
        type="submit"
        disabled={status === 'sending'}
      >
        {status === 'sending' ? 'Envoi en cours…' : 'Envoyer le message'}
      </button>
      <div
        className="contact-form__feedback"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {status === 'sending' && <p>Envoi du message en cours…</p>}
        {status === 'success' && (
          <p className="alert alert-success mb-0">
            Votre message a bien été envoyé.
          </p>
        )}
        {status === 'error' && (
          <p className="alert alert-danger mb-0">{submitError}</p>
        )}
      </div>
    </form>
  );
}
