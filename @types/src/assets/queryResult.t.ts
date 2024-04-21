import type { CollectionItem } from '../../../src/docs/docs';

declare class QueryResult {
    /**The current page */
    get currentPage(): number;

    /**The total number of pages for this query */
    get totalPages(): number;

    /**The total number of items that match the query filter */
    get totalCount(): number;

    /**The length of the current page */
    get length(): number;

    /**The matching items of the current page */
    get pageItems(): CollectionItem[];

    /**
     * All the matching items that has been retrieved from the
     * initial query and the call of the {@link next} method.
     * 
     * When you call `next()`, the retrieved items will be added to
     * the items here.
     */
    get items(): CollectionItem[];

    /**Check whether there are next pages or not */
    hasNext(): boolean;

    /**Retrieve the next page of items */
    next(): Promise<CollectionItem[]>;

    /**A result object. You can safely return this to the frontend if you want */
    get data(): {
        totalCount: number;
        length: number;
        items: CollectionItem[];
        pageItems: CollectionItem[];
    }
}

export default QueryResult;
