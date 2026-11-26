import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';

/** Page provisoire des rubriques admin, en attendant leurs vrais écrans CRUD. */
@Component({
  selector: 'app-admin-placeholder',
  template: `
    <div class="card rounded-4 border-0 shadow-sm">
      <div class="card-body p-4">
        <h1 class="fs-4 fw-semibold mb-1">{{ title() }}</h1>
        <p class="text-secondary mb-0">Bientôt disponible.</p>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminPlaceholder {
  protected readonly title = toSignal(inject(ActivatedRoute).data.pipe(map((data) => data['breadcrumb'] as string)));
}
