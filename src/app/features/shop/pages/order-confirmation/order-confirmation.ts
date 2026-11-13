
import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

import { Sales } from '../../services/sales';

@Component({
  selector: 'app-order-confirmation',
  imports: [RouterLink],
  templateUrl: './order-confirmation.html',
  styleUrl: './order-confirmation.css',
})
export class OrderConfirmation {
  private readonly route = inject(ActivatedRoute);
  private readonly salesService = inject(Sales);

  private readonly saleId = toSignal(
    this.route.paramMap.pipe(
      map(params => Number(params.get('id')))
    )
  );

  readonly sale = computed(() => {
    const id = this.saleId();

    if (!id || !Number.isInteger(id)) {
      return undefined;
    }

    return this.salesService.getSaleById(id);
  });
}
