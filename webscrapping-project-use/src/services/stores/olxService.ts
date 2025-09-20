import puppeteer from 'puppeteer';
import { Item, Session } from '../../common/types';
import { SearchService } from '../utils/search.service';

export class OlxService implements SearchService {
    async search(session: Session): Promise<Item[]> {
        const { query, category, priceRange } = session;
        const mainCategory = category?.name || 'elektronika';
        const subCategory = category?.children?.name || 'telefony-i-aksesuary';
        const pageNum = 1;

        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });

        const page = await browser.newPage();

        let searchUrl = `https://www.olx.ua/uk/${mainCategory}/${subCategory}/q-${encodeURIComponent(query)}/?currency=UAH&search%5Border%5D=created_at:desc&page=${pageNum}`;

        if (priceRange?.[0]) {
            searchUrl += `&search%5Bfilter_float_price:from%5D=${priceRange[0]}`;
        }
        if (priceRange?.[1]) {
            searchUrl += `&search%5Bfilter_float_price:to%5D=${priceRange[1]}`;
        }

        await page.goto(searchUrl, { waitUntil: 'domcontentloaded' });
        await page.waitForSelector('#courier');

        const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

        let response: any;
        for (let attempt = 1; attempt <= 2; attempt++) {
            try {
                await delay(1500);
                await page.click('label[for="courier"]');
                response = await page.waitForResponse(
                    (res) =>
                        res.url().startsWith('https://www.olx.ua/api/v1/offers/') &&
                        res.request().method() === 'GET',
                    { timeout: 5000 }
                );
                break;
            } catch (err) {
                console.warn(`Спроба #${attempt} не вдалася:`, err);
                if (attempt === 2) throw new Error('Не вдалося отримати відповідь від OLX API');
                await delay(3000);
            }
        }

        const data = await response.json();
        let offers = (data?.data || [])
            .sort(
                (a: any, b: any) =>
                    new Date(b.last_refresh_time).getTime() -
                    new Date(a.last_refresh_time).getTime()
            )
            .map((item: any): Item => {
                const priceParam = item.params?.find((p: any) => p.key === 'price');
                const stateParam = item.params?.find((p: any) => p.key === 'state');
                const rawDescription = item.description || '';
                const cleanDescription = rawDescription
                    .replace(/<[^>]+>/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim();
                const shortDescription =
                    cleanDescription.length > 70
                        ? cleanDescription.slice(0, 70) + '...'
                        : cleanDescription;

                return {
                    id: item.id,
                    title: item.title,
                    url: item.url,
                    description: shortDescription,
                    price: priceParam?.value?.label || priceParam?.value?.value,
                    state: stateParam?.value?.label || null,
                    updatedTime: item?.last_refresh_time,
                } as Item;
            });

        await browser.close();
        return offers;
    }

    formatMessage(newItems: Item[]): string[] {
        return newItems.map(
            (offer) =>
                `📌 ${offer.title}\n` +
                `💰 Ціна: ${offer.price || 'Не вказано'}\n` +
                `📦 Стан: ${offer.state || 'Не вказано'}\n\n` +
                `${offer.description}\n` +
                `🔗 ${offer.url}`
        );
    }
}
