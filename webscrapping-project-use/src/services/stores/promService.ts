import axios from 'axios';
import { Item, Session } from '../../common/types';
import { SearchService } from '../utils/search.service';

interface PromProduct {
    product: {
        id: string | number;
        name: string;
        price: number;
        priceCurrencyLocalized?: string;
        company?: {
            id: string | number;
            name: string;
        };
    };
}

const SEARCH_LISTING_QUERY = `
  query SearchListingQuery(
    $search_term: String!
    $offset: Int
    $limit: Int
    $params: Any
    $company_id: Int
    $sort: String
    $regionId: Int = null
    $subdomain: String = null
    $regionDelivery: String = null
    $includePremiumAdvBlock: Boolean = false
  ) {
    listing: searchListing(
      search_term: $search_term
      limit: $limit
      offset: $offset
      params: $params
      company_id: $company_id
      sort: $sort
      region: {id: $regionId, subdomain: $subdomain}
    ) {
      searchTerm
      page {
        total
        products {
          product {
            id
            name: nameForCatalog
            price
            priceCurrencyLocalized
            company {
              id
              name
            }
          }
        }
      }
    }
  }
`;

export class PromService implements SearchService {
    async search(session: Session, limit = 29, offset = 0): Promise<Item[]> {
        const { query, priceRange, category } = session;

        const minPrice = priceRange?.[0] ?? null;
        const maxPrice = priceRange?.[1] ?? null;

        const categoryId = Number(category?.children?.name ?? category?.name ?? null);

        try {
            const response = await axios.post(
                'https://prom.ua/graphql',
                {
                    operationName: 'SearchListingQuery',
                    variables: {
                        regionId: null,
                        includePremiumAdvBlock: false,
                        search_term: query,
                        params: {
                            binary_filters: [],
                            price_local__gte: minPrice,
                            price_local__lte: maxPrice,
                            category: categoryId,
                        },
                        limit,
                        offset,
                    },
                    query: SEARCH_LISTING_QUERY,
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (response.data.errors) {
                console.error('GraphQL errors:', response.data.errors);
                throw new Error('Prom GraphQL request failed');
            }

            const products: PromProduct[] = response.data?.data?.listing?.page?.products || [];

            return products.map(({ product }) => ({
                id: String(product.id),
                title: product.name,
                description: product.company?.name ?? '',
                state: 'Нове',
                url: `https://prom.ua/p${product.id}`,
                price: product.price,
                updatedTime: new Date(),
            }));
        } catch (error) {
            console.error('PromService.search error:', error);
            return [];
        }
    }

    formatMessage(newItems: Item[]): string[] {
        return newItems.map(
            (offer) =>
                `📌 ${offer.title}\n` +
                `💰 Ціна: ${offer.price || 'Не вказано'}\n` +
                `🏢 Продавець: ${offer.description || 'Не вказано'}\n` +
                `📦 Стан: ${offer.state || 'Не вказано'}\n\n` +
                `🔗 ${offer.url}`
        );
    }
}
