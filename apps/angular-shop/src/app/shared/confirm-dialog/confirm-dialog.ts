import { ChangeDetectionStrategy, Component, inject, Injectable, InjectionToken, Injector } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';

export interface ConfirmOptions {
  title: string;
  message: string;
  /** Libellé du bouton de confirmation. « Supprimer » par défaut. */
  confirmLabel?: string;
}

// NgbModalRef ne sait pas renseigner des inputs signal : les options passent par l'injecteur de la fenêtre.
const CONFIRM_OPTIONS = new InjectionToken<ConfirmOptions>('CONFIRM_OPTIONS');

/** Fenêtre de confirmation d'une action destructive. S'ouvre avec ConfirmDialogService. */
@Component({
  selector: 'app-confirm-dialog',
  template: `
    <div class="modal-header border-0">
      <h2 class="modal-title fs-5" id="confirm-dialog-title">{{ options.title }}</h2>
      <button type="button" class="btn-close" aria-label="Fermer" (click)="modal.dismiss()"></button>
    </div>
    <div class="modal-body py-0">
      <p class="mb-0">{{ options.message }}</p>
    </div>
    <div class="modal-footer border-0">
      <button type="button" class="btn btn-outline-secondary" (click)="modal.dismiss()">Annuler</button>
      <button type="button" class="btn btn-danger d-flex align-items-center gap-2" (click)="modal.close(true)">
        <i class="bi bi-trash" aria-hidden="true"></i>
        {{ options.confirmLabel ?? 'Supprimer' }}
      </button>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConfirmDialog {
  protected readonly modal = inject(NgbActiveModal);
  protected readonly options = inject(CONFIRM_OPTIONS);
}

@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  private readonly modalService = inject(NgbModal);
  private readonly injector = inject(Injector);

  /** `true` si l'utilisateur confirme, `false` s'il annule ou ferme la fenêtre. */
  confirm(options: ConfirmOptions): Promise<boolean> {
    const modalRef = this.modalService.open(ConfirmDialog, {
      centered: true,
      ariaLabelledBy: 'confirm-dialog-title',
      injector: Injector.create({ providers: [{ provide: CONFIRM_OPTIONS, useValue: options }], parent: this.injector })
    });
    return modalRef.result.then(
      (confirmed: unknown) => confirmed === true,
      () => false
    );
  }
}
