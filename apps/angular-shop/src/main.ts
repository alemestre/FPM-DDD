import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import '@angular/common/locales/global/fr';
import { App } from './app/app';


bootstrapApplication(App, appConfig).catch((err) =>
  console.error(err)
);
