import { Component, OnInit } from "@angular/core";
import { MatSnackBar } from "@angular/material/snack-bar";
import { ActivatedRoute, Router } from "@angular/router";
import { first } from "rxjs";
import { GuessResult, GuessResultStatus, GuessService } from "../guess.service";
import { OffersService } from "../offers.service";

@Component({
    templateUrl: './rate.component.html',
    styleUrls: [ './rate.component.scss' ],
})
export class RateComponent implements OnInit {
    private static readonly MAX_GUESSES = 6;

    hotelId!: string;
    roomId!: string;
    rateId!: string;
    startDate?: string;
    endDate?: string;

    offerPriceCent!: string;
    extraPoints: number = Math.floor(Math.random() * 400 + 100);

    currentGuessIdx = 0;
    guesses: GuessResult[] = [];
    gameStatus: 'NOTSTARTED' | 'RUNNING' | 'SUCCESS' | 'FAILURE' = 'NOTSTARTED';


    loading: boolean = true;

    constructor(
        private route: ActivatedRoute,
        private router: Router,

        private offersService: OffersService,
        private guessService: GuessService,
        private snackbar: MatSnackBar,
    ) { }

    ngOnInit(): void {
        this.hotelId = this.route.snapshot.paramMap.get('hotelId') ?? '';
        this.roomId = this.route.snapshot.paramMap.get('roomId') ?? '';
        this.rateId = this.route.snapshot.paramMap.get('rateId') ?? '';
        this.startDate = this.route.snapshot.queryParamMap.get('startDate') ?? '';
        this.endDate = this.route.snapshot.queryParamMap.get('endDate') ?? '';

        this.getPrice();

        window.addEventListener('keyup', ev => {
            this.handleKeyup(ev.key);
            // TODO Unsub?
        });
    }

    share() {
        const getStatusEmoji = (status: GuessResultStatus) => {
            if (status === 'CORRECT') {
                return '🟩';
            } else if (status === 'OCCURENCE') {
                return '🟨';
            } else if (status === 'WRONG') {
                return '⬛';
            }
            return '';
        }
        const result = this.guesses
            .filter(g => g.digits.every(d => d.status !== 'UNDEFINED'))
            .map(g => g.digits.map(d => getStatusEmoji(d.status)).join(''))
            .join('\n');

        const shareText = `I guessed the correct price in ${this.currentGuessIdx} tries and booked my dream vacation!\n\n${result}\n\nDo you think you can do better? Try it here: ${window.location.href}`;

        navigator.clipboard.writeText(shareText).then(() => {
            this.snackbar.open('Copied to clipboard!', 'Close');
        }, () => {
            this.snackbar.open('Error copying', 'Close');
        })
    }

    private getPrice(): void {
        this.loading = true;

        if (!this.startDate || !this.endDate) {
            this.goToMainPage();
            return;
        }

        this.offersService.getOffers(this.hotelId, this.startDate, this.endDate, 2).subscribe(offers => {
            if (!offers.success) {
                this.goToMainPage();
                return;
            }

            offers.result[this.hotelId].room_offers.forEach(ro => {
                ro.forEach(offer => {
                    if (offer.room_code === this.roomId && offer.primary_item_code === this.rateId) {
                        this.offerPriceCent = Math.floor(offer.total * 100).toString();
                    }
                });
            });

            if (!this.offerPriceCent) {
                this.goToMainPage();
                return;
            }

            this.loading = false;
            this.startGame();
        });
    }

    private startGame() {
        this.gameStatus = 'RUNNING';
        this.guesses = [];
        for (let i = 0; i < RateComponent.MAX_GUESSES; i++) {
            this.guesses.push({
                finished: false,
                digits: new Array(this.offerPriceCent.length).fill('').map(_ => ({
                    digit: '',
                    status: 'UNDEFINED',
                })),
            });
        }
        this.currentGuessIdx = 0;
    }

    private handleKeyup(key: string) {
        if (this.gameStatus !== 'RUNNING') {
            return;
        }

        if (!/[0-9]|Enter|Backspace/.test(key)) {
            return;
        }

        if (key === 'Enter') {
            const guess = this.guesses[this.currentGuessIdx].digits.map(d => d.digit).join('');
            this.guess(guess);
            return;
        }

        const firstEmptyDigit = this.guesses[this.currentGuessIdx].digits.findIndex(d => d.digit === '');

        if (key == 'Backspace') {
            if (firstEmptyDigit === -1) {
                // Full string, remove last one
                this.guesses[this.currentGuessIdx].digits[this.offerPriceCent.length - 1].digit = '';
            } else if (firstEmptyDigit !== 0) {
                this.guesses[this.currentGuessIdx].digits[firstEmptyDigit - 1].digit = '';
            }
            return;
        }

        if (firstEmptyDigit !== -1 && firstEmptyDigit < this.offerPriceCent.length) {
            this.guesses[this.currentGuessIdx].digits[firstEmptyDigit].digit = key;
            return;
        }
    }

    private guess(guess: string) {
        if (this.gameStatus !== 'RUNNING') {
            console.warn('Game not running!');
            return;
        }

        if (guess.length !== this.offerPriceCent.length) {
            console.log('not enough digits');
            return;
        }

        const guessResult = this.guessService.validateGuess(this.offerPriceCent, guess);

        if (guessResult.finished) {
            this.gameStatus = 'SUCCESS';
        }

        this.guesses[this.currentGuessIdx] = guessResult;
        this.currentGuessIdx++;

        if (this.currentGuessIdx >= RateComponent.MAX_GUESSES && this.gameStatus == 'RUNNING') {
            this.gameStatus = 'FAILURE';
        }
    }

    private goToMainPage(): void {
        this.router.navigate([ '/', this.hotelId]);
    }
}
