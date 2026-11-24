import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
    {
        path: '', // This renders the "/" route on the client (CSR)
        renderMode: RenderMode.Client,
    },
    {
        path: 'a-propos', // This page is static, so we prerender it (SSG)
        renderMode: RenderMode.Prerender,
    },
    {
        path: 'produits/:slug', // This page requires specific data, so we use SSR
        renderMode: RenderMode.Server,
    },
    {
        path: 'profil', // Private data behind the session cookie: browser only (the server request would not carry it)
        renderMode: RenderMode.Client,
    },
    {
        path: 'profil/commandes/:id', // Same as 'profil': the order belongs to the logged-in customer
        renderMode: RenderMode.Client,
    },
    {
        path: 'checkout', // Session, cart (localStorage) and guest choice (sessionStorage) live in the browser
        renderMode: RenderMode.Client,
    },
    {
        path: 'checkout/identification',
        renderMode: RenderMode.Client,
    },
    {
        path: 'checkout/confirmation', // Shows the order kept in memory after it was placed
        renderMode: RenderMode.Client,
    },
    {
        path: 'verifier-email', // Reads the token from the URL and calls the API: browser only, never prerendered
        renderMode: RenderMode.Client,
    },
    {
        path: 'reinitialiser-mot-de-passe', // Reads the token from the URL and calls the API
        renderMode: RenderMode.Client,
    },
    {
        path: 'admin', // Admin area: behind the session cookie, so browser only
        renderMode: RenderMode.Client,
    },
    {
        path: 'admin/**',
        renderMode: RenderMode.Client,
    },
    {
        path: '**',
        renderMode: RenderMode.Prerender,
    },
];
