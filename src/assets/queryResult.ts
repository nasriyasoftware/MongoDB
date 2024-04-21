import mongodb from 'mongodb';
import type { CollectionItem } from '../docs/docs';

/**
 * A results object for the `find` method.
 * 
 * **Note:**
 * - Never return this object to the frontend. It may contain sensitive information
 * about the database connection and might allow others to exploit your
 * databases.
 * 
 * - It's safe to return the {@link data} object to the frontend
 */
class QueryResult {
    private _cursor: mongodb.FindCursor;
    private _totalPages = 1;

    private _results = Object.seal({
        /**The total number of pages for this query */
        totalCount: 0,
        /**The length of the current page */
        length: 0,
        /**
         * All the matching items that has been retrieved from the
         * initial query and the call of the {@link next} method.
         * 
         * When you call `next()`, the retrieved items will be added to
         * the items here.
         */
        items: [] as CollectionItem[],
        /**
         * The matching items of the current page
         */
        pageItems: [] as CollectionItem[]
    })

    private _config = Object.seal({
        page: { size: 100, num: 1 }
    })

    constructor(config: { totalCount: number, pages: number, pageSize: number, items: CollectionItem[], cursor: mongodb.FindCursor }) {
        this._results.totalCount = config.totalCount;
        this._results.items = this._results.pageItems = config.items;
        this._results.length = config.items.length;
        this._totalPages = config.pages;
        this._cursor = config.cursor;
        this._config.page.size = config.pageSize;
    }

    /**The current page */
    get currentPage() { return this._config.page.num }

    /**The total number of pages for this query */
    get totalPages() { return this._totalPages }

    /**The total number of items that match the query filter */
    get totalCount() { return this._results.totalCount }

    /**The length of the current page */
    get length() { return this._results.length }

    /**The matching items of the current page */
    get pageItems() { return this._results.pageItems }

    /**
     * All the matching items that has been retrieved from the
     * initial query and the call of the {@link next} method.
     * 
     * When you call `next()`, the retrieved items will be added to
     * the items here.
     */
    get items() { return this._results.items }

    /**Check whether there are next pages or not */
    hasNext() { return this._config.page.num < this._totalPages }

    /**Retrieve the next page of items */
    async next(): Promise<CollectionItem[]> {
        try {
            if (!this.hasNext()) { return [] }
            const items = await this._cursor.next();
            this._results.pageItems = items;

            if (items.length > 0) {
                this._config.page.num++;
                this._results.items = [...this._results.items, ...items];
            }

            return items;
        } catch (error) {
            if (typeof error === 'object' && error instanceof Error) {
                // If the error is an instance of Error, update its message
                error.message = `Unable to retrieve the next page: ${error.message}`;
                return Promise.reject(error);
            } else if (typeof error === 'string') {
                // If the error is a string, wrap it in an Error object
                return Promise.reject(new Error(`Unable to retrieve the next page: ${error}`));
            } else {
                // If the error is of an unexpected type, wrap it in an Error object
                return Promise.reject(new Error(`Unable to retrieve the next page: ${String(error)}`));
            }
        }
    }

    /**A result object. You can safely return this to the frontend if you want */
    get data() { return this._results }
}

export default QueryResult;
