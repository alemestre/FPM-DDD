import type { CrudLoadComponent } from '../admin.routes';

export const producersComponent: CrudLoadComponent = {
  list: () => import('./list/admin-producer-list').then((m) => m.AdminProducerList),
  create: () => import('./form/admin-producer-form').then((m) => m.AdminProducerForm),
  read: () => import('./detail/admin-producer-detail').then((m) => m.AdminProducerDetail),
  update: () => import('./form/admin-producer-form').then((m) => m.AdminProducerForm)
};
