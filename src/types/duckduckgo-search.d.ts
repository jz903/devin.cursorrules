declare module 'duckduckgo-search' {
    interface DuckDuckGoSearchOptions {
        safeSearch?: 'on' | 'moderate' | 'off';
        time?: 'd' | 'w' | 'm' | 'y';
        maxResults?: number;
    }

    interface DuckDuckGoSearchResult {
        url: string;
        title: string;
        description: string;
    }

    export function duckDuckGoSearch(
        query: string,
        options?: DuckDuckGoSearchOptions
    ): Promise<DuckDuckGoSearchResult[]>;
} 