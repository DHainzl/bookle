import { Injectable } from "@angular/core";
import { HttpClient } from '@angular/common/http';
import { Observable } from "rxjs";

@Injectable({ providedIn: 'root' })
export class OffersService {
    private static readonly BASE_ENDPOINT_URL = 'https://switch-dev.seekda.com/switch/latest/json/offers.json';

    constructor(
        private http: HttpClient,
    ) { }

    getOffers(hotelId: string, startDate: string, endDate: string, numberOfAdults: number):  Observable<Offers> {
        const url = this.createUrl(OffersService.BASE_ENDPOINT_URL, {
            property_code: hotelId,
            token: 42,
            checkin: startDate,
            checkout: endDate,
            language_code: 'en',
            channel_id: 'ibe',
            currency_code: 'EUR',
            exclude_packages: true,
            exclude_rates: false,
            price_type: 'asInPricelist',
            adult_room1: numberOfAdults,
        });

        return this.http.get<Offers>(url);
    }

    private createUrl(baseUrl: string, params: { [ key: string ]: unknown }) {
        const url = new URL(baseUrl);

        Object.entries(params).forEach(([ key, value ]) => {
            url.searchParams.append(key, `${value}`);
        });

        return url.href;
    }
}

export interface Offers {
    success: boolean;
    result: { [ hotelId: string ]: OfferData };
}

export interface OfferData {
    currency_code: string;
    room_offers: RoomOffer[][];
    metadata: OfferMetadata;
}

export interface RoomOffer {
    total: number;
    room_code: string;
    primary_item_code: string;
}

export interface OfferMetadata {
    rooms: OfferRoomMetadata[];
    rates: OfferRateMetdata[];
}

export interface OfferRoomMetadata {
    code: string;
    title: string;
    description: string;
    minOccupancy: string;
    stdOccupancy: string;
    maxOccupancy: string;
    size: number;
    sizeUnit: string;
    images: OfferImage[];
}

export interface OfferRateMetdata {
    code: string;
    type: 'DayRate' | 'Package';
    title: string;
    teaser: string;
    description: string;
}

export interface OfferImage {
    url: string;
}
