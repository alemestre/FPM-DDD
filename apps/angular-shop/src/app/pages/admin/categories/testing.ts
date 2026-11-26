import { ConfirmDialogService } from '../../../shared/confirm-dialog/confirm-dialog';
import { NotificationService } from '../../../services/notification.service';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../../environments/environment';
import { provideHttpClient } from '@angular/common/http';
import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';

/** Outils communs aux specs des pages admin des catégories. */
export const ADMIN_CATEGORIES_URL = `${environment.apiUrl}/admin/categories`;
export const FRUITS = { id: 'b3bb189e-8bf9-4888-9912-ace4e6543002', name: 'Fruits', slug: 'fruits' };

// Fichier compilé avec l'app (il n'est pas en .spec.ts) : pas de `vi` ici, les specs passent leurs mocks.
export const categoryPageProviders = (
  confirmDialog: Pick<ConfirmDialogService, 'confirm'>,
  notifications: Pick<NotificationService, 'showSuccess' | 'showError'>
) => [
  provideHttpClient(),
  provideHttpClientTesting(),
  { provide: ConfirmDialogService, useValue: confirmDialog },
  { provide: NotificationService, useValue: notifications }
];

export const settle = () => TestBed.inject(ApplicationRef).whenStable();
