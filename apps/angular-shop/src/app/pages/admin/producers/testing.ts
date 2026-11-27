import { ConfirmDialogService } from '../../../shared/confirm-dialog/confirm-dialog';
import { NotificationService } from '../../../services/notification.service';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../../environments/environment';
import type { ProducerResponseDto } from '@fpm/contracts';
import { provideHttpClient } from '@angular/common/http';
import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';

/** Outils communs aux specs des pages admin des producteurs. */
export const ADMIN_PRODUCERS_URL = `${environment.apiUrl}/admin/producers`;
export const FERME_DU_BOIS: ProducerResponseDto = {
    id: 'c4f2a8d1-3b6e-4f7a-9d2c-1e5b8a7f6c30',
    name: 'Ferme du Bois',
    email: 'contact@fermedubois.fr',
    phone: '06 12 34 56 78',
    vatNumber: 'FR40303265045',
    addressLine1: '12 chemin des Prés',
    addressLine2: '',
    postalCode: '29200',
    city: 'Brest',
    isActive: true,
};

// Fichier compilé avec l'app (il n'est pas en .spec.ts) : pas de `vi` ici, les specs passent leurs mocks.
export const producerPageProviders = (
    confirmDialog: Pick<ConfirmDialogService, 'confirm'>,
    notifications: Pick<NotificationService, 'showSuccess' | 'showError'>,
) => [
    provideHttpClient(),
    provideHttpClientTesting(),
    { provide: ConfirmDialogService, useValue: confirmDialog },
    { provide: NotificationService, useValue: notifications },
];

export const settle = () => TestBed.inject(ApplicationRef).whenStable();
