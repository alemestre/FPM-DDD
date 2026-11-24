import { FileTemplateEngine, InMemoryMailTransport, MailModule, Mailer } from '@nestjs/mail';
import { ForgotPasswordEmail } from './forgot-password.mail';
import { MAIL_LAYOUT } from './mail-options.factory';
import { Test } from '@nestjs/testing';
import { join } from 'node:path';

/** In the build, the templates are copied next to main.js; here they are read from the sources. */
const SOURCE_TEMPLATES_DIR = join(__dirname, '../../../../assets/mail/templates');
const URL = 'http://localhost:4200/reinitialisation-mot-de-passe?token=a.b.c';

describe('ForgotPasswordEmail', () => {
  let mailer: Mailer;
  let transport: InMemoryMailTransport;

  beforeAll(async () => {
    transport = new InMemoryMailTransport();
    const moduleRef = await Test.createTestingModule({
      imports: [
        MailModule.forRoot({
          transport,
          templates: new FileTemplateEngine({ dir: SOURCE_TEMPLATES_DIR, layout: MAIL_LAYOUT }),
          from: 'FPM <no-reply@fpm.local>',
        }),
      ],
      providers: [ForgotPasswordEmail],
    }).compile();
    mailer = moduleRef.get(Mailer);
  });

  const render = (firstName: string, url = URL) => mailer.render(ForgotPasswordEmail, { data: { firstName, url } });

  it('rend le template forgot-password dans le layout, avec le lien et sa durée de validité', async () => {
    const message = await render('Marie');

    expect(message.subject).toBe('Réinitialisation de votre mot de passe');
    expect(message.html).toContain('<html lang="fr">');
    expect(message.html).toContain('Bonjour Marie,');
    expect(message.html).toContain(`href="${URL}"`);
    expect(message.html).toContain('Réinitialiser mon mot de passe');
    expect(message.html).toContain('valable 60 minutes');
  });

  it('utilise la version texte du template', async () => {
    const { text } = await render('Marie');

    expect(text).toContain('Bonjour Marie,');
    expect(text).toContain(URL);
    expect(text).toContain('valable 60 minutes');
    expect(text).not.toContain('inscription');
  });

  it('échappe les valeurs insérées dans le HTML', async () => {
    const { html } = await render('<script>alert(1)</script>', 'http://x.test/?a="><b>');

    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).not.toContain('"><b>');
  });

  it("s'envoie au destinataire", async () => {
    await mailer.send(ForgotPasswordEmail, {
      to: { name: 'Marie Durand', address: 'marie.durand@example.fr' },
      data: { firstName: 'Marie', url: URL },
    });

    transport.assertSent((mail) => mail.subject === 'Réinitialisation de votre mot de passe');
  });
});
