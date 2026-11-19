import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { FormField, type FieldTree } from '@angular/forms/signals';
import type { BillingFieldConfig } from '../billing-fields';

/** Champ texte du formulaire de checkout, avec son libellé et ses erreurs. */
@Component({
    selector: 'app-billing-field',
    imports: [FormField],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { '[class]': 'config().columnClass' },
    template: `
        @let state = field()();
        @let showErrors = state.touched() && state.invalid();
        <label [for]="fieldId()" class="form-label fw-medium text-secondary">{{
            config().label
        }}</label>
        <input
            [id]="fieldId()"
            [type]="config().type"
            class="form-control"
            [attr.autocomplete]="config().autocomplete"
            [attr.placeholder]="config().placeholder ?? null"
            [formField]="field()"
            [class.is-invalid]="showErrors"
            [attr.aria-describedby]="showErrors ? fieldId() + '-errors' : null"
        />
        @if (showErrors) {
            <div [id]="fieldId() + '-errors'" class="invalid-feedback d-block">
                @for (error of state.errors(); track error.kind) {
                    <div>{{ error.message }}</div>
                }
            </div>
        }
    `,
})
export class BillingField {
    readonly field = input.required<FieldTree<string>>();
    readonly config = input.required<BillingFieldConfig>();

    protected readonly fieldId = computed(() => `checkout-${this.config().key}`);
}
