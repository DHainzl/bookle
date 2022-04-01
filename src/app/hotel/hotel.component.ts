import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, ActivatedRouteSnapshot } from "@angular/router";
import { OfferRateMetdata, OfferRoomMetadata, Offers, OffersService, RoomOffer } from "../offers.service";

@Component({
    templateUrl: './hotel.component.html',
    styleUrls: [ './hotel.component.scss' ],
})
export class HotelComponent implements OnInit {
    hotelId!: string;
    startDate: Date = new Date('2022-04-08');
    endDate: Date = new Date('2022-04-15');

    get startDateString() {
        return this.startDate.toISOString().substring(0, 10);
    }
    get endDateString() {
        return this.endDate.toISOString().substring(0, 10);
    }

    errorMessage: string = '';
    searchResults: (OfferRoomMetadata & { roomOffers: (RoomOffer & { rate: OfferRateMetdata | undefined; })[]; })[] = [];

    constructor(
        private route: ActivatedRoute,

        private offersService: OffersService,
    ) { }

    ngOnInit() {
        this.hotelId = this.route.snapshot.paramMap.get('hotelId') ?? '';
        this.search();
    }

    search() {
        this.errorMessage = '';
        this.searchResults = [];

        if (!this.startDate || !this.endDate) {
            this.errorMessage = 'Please enter your travel dates!';
            return;
        }
        
        if (new Date(this.startDate) >= new Date(this.endDate)) {
            this.errorMessage = 'Your departure date has to be later than your arrival date';
            return;
        }

        this.offersService.getOffers(this.hotelId, this.startDateString, this.endDateString, 2).subscribe(offers => {
            this.searchResults = this.parseSearchResults(offers);
        });
    }

    private parseSearchResults(offers: Offers) {
        if (!offers.success) {
            return [];
        }

        return offers.result[this.hotelId].metadata.rooms
            .map(room => {
                const roomOffers: (RoomOffer & { rate: OfferRateMetdata | undefined })[] = [];

                offers.result[this.hotelId].room_offers.forEach(ro => {
                    ro
                        .filter(offer => offer.room_code === room.code)
                        .map(offer => {
                            const rate = offers.result[this.hotelId].metadata.rates
                                .find(r => r.code === offer.primary_item_code);

                            return Object.assign({}, offer, { rate });
                        })
                        .filter(offer => offer.rate?.type === 'DayRate')
                        .forEach(offer => roomOffers.push(offer));
                });

                return Object.assign({}, room, { roomOffers });
            })
            .filter(room => room.roomOffers.length);
    }
}
