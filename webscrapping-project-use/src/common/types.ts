export interface Category {
    name: string;
    children?: {
        name: string;
    };
}
export interface Session {
    id: string;
    userId: string;
    store: string;
    query: string;
    category?: Category;
    priceRange?: [number, number];
    lastSeenIds?: string[];
    createdAt: Date;
    updatedAt?: string | null;
}

export interface Item {
    id: string;
    title: string;
    description: string;
    state: string;
    url: string;
    price?: number;
    updatedTime?: Date;
}
