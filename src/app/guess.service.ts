import { Injectable } from "@angular/core";

@Injectable({ providedIn: 'root' })
export class GuessService {
    validateGuess(solution: string, guess: string) {
        const guessParts = guess.split('');
        const solutionParts = solution.split('');

        const digits: GuessResult['digits'] = guessParts.map(digit => ({
            status: 'WRONG',
            digit,
        }));

        // Step 1: Mark correct ones
        solutionParts.forEach((digit, idx) => {
            if (digits[idx].digit === digit) {
                digits[idx].status = 'CORRECT';
            }
        });

        // Step 2: Mark correct ones on wrong positions
        solutionParts.forEach((digit, idx) => {
            if (digits[idx].status === 'CORRECT') {
                return;
            }

            digits.find((guess) => {
                if (guess.status === 'WRONG' && guess.digit === digit) {
                    guess.status = 'OCCURENCE';
                    return true;
                }
                return false;
            });
        });

        return {
            finished: digits.every(d => d.status === 'CORRECT'),
            digits,
        };
    }
}

export interface GuessResult {
    finished: boolean;
    digits: {
        status: 'CORRECT' | 'OCCURENCE' | 'WRONG' | 'UNDEFINED';
        digit: string;
    }[];
}