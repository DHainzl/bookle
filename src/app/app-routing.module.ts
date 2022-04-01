import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HotelComponent } from './hotel/hotel.component';
import { RateComponent } from './rate/rate.component';

const routes: Routes = [
    {
        path: ':hotelId',
        component: HotelComponent,
    },
    {
        path: ':hotelId/:roomId/:rateId',
        component: RateComponent,
    }
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule { }
