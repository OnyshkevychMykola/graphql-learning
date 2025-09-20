import { Session } from './types';

export const sessions: Session[] = [];

export const categories: Record<string, Record<string, string[]>> = {
    'olx-service': {
        elektronika: ['telefony-i-aksesuary', 'kompyutery-ta-noutbuky', 'igry-ta-prystroyi'],
    },
    'prom-service': {
        'telefony-ta-aksesuary': ['5090301'],
    },
};
