import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Accès à localStorage sans risque en SSR : côté serveur, chaque méthode est un no-op
 * (et getItem renvoie null), car localStorage n'existe pas dans Node.
 */
@Injectable({
    providedIn: 'root',
})
export class LocalStorageService {
    private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

    setItem(key: string, value: unknown) {
        if (!this.isBrowser) return;
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error('Error saving to local storage', e);
        }
    }

    getItem<T = unknown>(key: string): T | null {
        if (!this.isBrowser) return null;
        try {
            const item = localStorage.getItem(key);
            return item ? (JSON.parse(item) as T) : null;
        } catch (e) {
            console.error('Error reading from local storage', e);
            return null;
        }
    }

    removeItem(key: string) {
        if (!this.isBrowser) return;
        try {
            localStorage.removeItem(key);
        } catch (e) {
            console.error('Error removing from local storage', e);
        }
    }

    clear(): void {
        if (!this.isBrowser) return;
        try {
            localStorage.clear();
        } catch (e) {
            console.error('Error clearing local storage', e);
        }
    }
}
