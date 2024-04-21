import QueryResult from '../../../src/assets/queryResult';
import type { NasriyaDataOptions } from '../../../src/docs/docs';
import DataFilter from '../../../src/assets/filter';

declare class DataQuery {
    /**
     * Set filter for the query
     * @param {DataFilter} filter A filter for the query
     * @returns {DataQuery}
     */
    filter(filter: DataFilter): DataQuery;

    /**
     * Sets the number of items to skip before returning query results.
     * @param {number} number The number of items to skip in the query results before returning the results.
     * @throws {TypeError} - If the provided number is not a number.
     * @throws {RangeError} - If the provided number is negative.
     */
    skip(number: number): DataQuery;

    /**
     * (Limit) Limits the number of items the query returns.
     * @description The limit() function defines the number of results a query returns in each page
     * @param {number} limit Pass a number between 1 and 2000 (including).
     */
    limit(limit: number): DataQuery;

    /**
     * Sort the returned results in ascending order (A-Z/0-9).
     * 
     * **Notes:**
     * - You can add as many sorts as you want.
     * - Multiple sorts for the same property will overrwrite each others. Only the last one will apply.
     * @param {string} property The property or field to sort the results with.
     * @returns {DataQuery}
     */
    ascending(property: string): DataQuery;

    /**
     * Sort the returned results in descending order (Z-A/9-0)
     * 
     * **Notes:**
     * - You can add as many sorts as you want.
     * - Multiple sorts for the same property will overrwrite each others. Only the last one will apply.
     * @param {string} property The property or field to sort the results with.
     * @returns {DataQuery}
     */
    descending(property: string): DataQuery;

    /**
     * Choose which fields you want to include and which to exclude.
     * @param {{include?: string[], exclude?: string[]}} options An object specifying which fields to include and which to exclude.
     */
    fields(options: { include?: string[], exclude?: string[] }): DataQuery;

    /**
     * Use the filter built by this query builder to query a database collection 
     * @param {NasriyaDataOptions} [options]
     * @returns {Promise<QueryResult>}
     */
    find(options?: NasriyaDataOptions): Promise<QueryResult>;

    /**
     * Count the total number of items that match the filter of this query
     * @param {NasriyaDataOptions} [options] 
     * @returns {Promise<number>} The total number of items that match the filter of this query
     */
    count(options?: NasriyaDataOptions): Promise<number>;
}

export default DataQuery;