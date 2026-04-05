import { Component, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { JitFormService } from '@jitforms/angular';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule, CommonModule],
  template: `
    <ng-container *ngIf="state.isSuccess; else formTpl">
      <div class="success">✓ Submitted successfully.</div>
      <pre style="font-size:0.75rem;overflow:auto">{{ state.submission | json }}</pre>
      <button (click)="form.reset()">Submit again</button>
    </ng-container>
    <ng-template #formTpl>
      <form (ngSubmit)="onSubmit()" #ngForm="ngForm">
        <div *ngIf="state.isError" class="fail">Something went wrong.</div>
        <div>
          <label for="name">Name</label>
          <input id="name" name="name" [(ngModel)]="data.name" />
          <div class="error" *ngIf="form.fieldError('name')">{{ form.fieldError('name') }}</div>
        </div>
        <div>
          <label for="email">Email</label>
          <input id="email" name="email" type="email" [(ngModel)]="data.email" />
          <div class="error" *ngIf="form.fieldError('email')">{{ form.fieldError('email') }}</div>
        </div>
        <div>
          <label for="message">Message</label>
          <textarea id="message" name="message" [(ngModel)]="data.message"></textarea>
          <div class="error" *ngIf="form.fieldError('message')">{{ form.fieldError('message') }}</div>
        </div>
        <button type="submit" [disabled]="state.isLoading">
          {{ state.isLoading ? 'Sending…' : 'Send' }}
        </button>
      </form>
    </ng-template>
  `,
})
export class AppComponent implements OnDestroy {
  form = new JitFormService('Jve1ZElW', {
    baseUrl: 'https://jitforms.test',
    honeypot: true,
  });
  state = this.form.snapshot;
  data = { name: '', email: '', message: '' };
  private sub = this.form.state.subscribe((s) => (this.state = s));

  async onSubmit() {
    await this.form.submit({ ...this.data });
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
    this.form.destroy();
  }
}
