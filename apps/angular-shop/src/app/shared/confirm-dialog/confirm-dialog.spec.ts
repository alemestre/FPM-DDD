import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NgbConfig } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmDialogService } from './confirm-dialog';

describe('ConfirmDialogService', () => {
  let service: ConfirmDialogService;

  beforeEach(() => {
    // Sans animation, la fenêtre est retirée du DOM avant la fin du test.
    TestBed.inject(NgbConfig).animation = false;
    service = TestBed.inject(ConfirmDialogService);
  });

  // Renvoie la promesse dans un objet : `await` attendrait sinon la réponse de l'utilisateur.
  const open = async () => {
    const result = service.confirm({ title: 'Supprimer la catégorie', message: 'Supprimer « Fruits » ?' });
    await TestBed.inject(ApplicationRef).whenStable();
    return { result };
  };

  const button = (label: string) =>
    [...document.querySelectorAll<HTMLButtonElement>('ngb-modal-window button')].find((b) => b.textContent?.includes(label));

  it('affiche le titre et le message, et renvoie true sur « Supprimer »', async () => {
    const { result } = await open();

    const dialog = document.querySelector('ngb-modal-window')?.textContent;
    expect(dialog).toContain('Supprimer la catégorie');
    expect(dialog).toContain('Supprimer « Fruits » ?');
    button('Supprimer')?.click();

    await expect(result).resolves.toBe(true);
    await vi.waitFor(() => expect(document.querySelector('ngb-modal-window')).toBeNull());
  });

  it('renvoie false sur « Annuler »', async () => {
    const { result } = await open();

    button('Annuler')?.click();

    await expect(result).resolves.toBe(false);
    await vi.waitFor(() => expect(document.querySelector('ngb-modal-window')).toBeNull());
  });
});
