import { Component } from '@angular/core';
import { CoreService } from 'src/app/services/core.service';

@Component({
  selector: 'app-branding',
  imports: [],
  template: `
    <a href="/dashboard" class="flex items-center gap-2 px-3 py-3 no-underline">
      <span class="iconify text-primary text-3xl" data-icon="solar:map-point-bold-duotone"></span>
      <span class="text-lg font-bold leading-tight">
        <span class="text-primary">Geo</span><span>Territorial</span>
      </span>
    </a>
  `,
})
export class BrandingComponent {
  options = this.settings.getOptions();
  constructor(private settings: CoreService) {}
}
