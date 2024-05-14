import type { OnFailureEvent, DatabaseDefinition, CollectionDefinition, ClientUser, NasriyaDataOptions, Grouping } from '../docs/docs';
import mongodb from 'mongodb';
import DataFilter from './filter';
declare class DataAggregate {
    #private;
    /**
     * @param {object} config
     * @param {DatabaseDefinition} config.database
     * @param {CollectionDefinition} config.collection
     * @param {mongodb.MongoClient} client
     * @param {OnFailureEvent} onFailureEvent
     */
    constructor({ database, collection, authorization, user }: {
        database: DatabaseDefinition;
        collection: CollectionDefinition;
        authorization: 'System' | 'User';
        user: ClientUser;
    }, client: mongodb.MongoClient, onFailureEvent: OnFailureEvent);
    /**
     * Filters out items from being used in an aggregation.
     * @param {DataFilter} filter A filter for the query
     * @returns {DataAggregate}
     */
    filter(filter: DataFilter): DataAggregate;
    /**
     * Sets the number of items or groups to skip before returning aggregation results.
     * @param {number} number The number of items to skip in the query results before returning the results.
     * @throws {TypeError} - If the provided number is not a number.
     * @throws {RangeError} - If the provided number is negative.
     */
    skip(number: number): DataAggregate;
    /**
     * Limits the number of items or groups the aggregation returns.
     * @description The limit() function defines the number of results a query returns in each page
     * @param {number} limit Pass a number between 1 and 2000 (including).
     */
    limit(limit: number): DataAggregate;
    /**
     * Adds a sort to an aggregation, sorting by the items or groups by the specified properties in ascending order (A-Z/0-9).
     *
     * **Notes:**
     * - You can add as many sorts as you want.
     * - Multiple sorts for the same property will overrwrite each others. Only the last one will apply.
     * @param {string} property The property or field to sort the results with.
     * @returns {DataAggregate}
     */
    ascending(property: string): DataAggregate;
    /**
     * Adds a sort to an aggregation, sorting by the items or groups by the specified properties in descending order (Z-A/9-0)
     *
     * **Notes:**
     * - You can add as many sorts as you want.
     * - Multiple sorts for the same property will overrwrite each others. Only the last one will apply.
     * @param {string} property The property or field to sort the results with.
     * @returns {DataAggregate}
     */
    descending(property: string): DataAggregate;
    /**
     * Choose which fields you want to include and which to exclude.
     * @param {{include?: string[], exclude?: string[]}} options An object specifying which fields to include and which to exclude.
     */
    fields(options: {
        include?: string[];
        exclude?: string[];
    }): DataAggregate;
    /**
     * Create a group for aggregation
     * @param {Grouping} grouping
     * @example
     * client.aggregate('Products').group({
     *      _id: '$mainField',
     *      total: client.aggExps.sum('price')
     * })
     */
    group(grouping: Grouping): DataAggregate;
    /**
     * Perform faceted aggregation on the data.
     * @param {Object} facets An object representing the facets to aggregate on.
     * @returns {DataAggregate} The DataAggregate instance for method chaining.
     * @example
     * // Perform faceted aggregation
     * const facets = {
     *   category: { $addToSet: '$category' },
     *   total: client.aggExps.sum('price')
     * };
     *
     * client.aggregate('Products').facet(facets).execute();
     */
    facet(facets: object): DataAggregate;
    /**
    * Add a custom aggregation stage to the pipeline.
    * @param {Object} stage The custom aggregation stage to add.
    * @returns {DataAggregate} The DataAggregate instance for method chaining.
    * @example
    * // Add a custom aggregation stage
    * const customStage = { $sortByCount: '$category' };
    * client.aggregate('Products').customStage(customStage).execute();
    */
    customStage(stage: object): DataAggregate;
    /**
     * Perform a geospatial aggregation operation on the data.
     * @param {Docs.GeoNearOptions} geoNearOptions Options for the $geoNear stage.
     * @returns {DataAggregate} The DataAggregate instance for method chaining.
     * @example
     * // Perform a geospatial aggregation
     * const geoNearOptions = {
     *   near: { type: 'Point', coordinates: [longitude, latitude] },
     *   distanceField: 'distance',
     *   spherical: true,
     *   maxDistance: 1000
     * };
     *
     * client.aggregate('Products').geoNear(geoNearOptions).execute();
     */
    geoNear(geoNearOptions: object): DataAggregate;
    /**
     * Perform a geospatial aggregation operation using the $geoWithin stage.
     * @param {Docs.GeoWithinOptions} geoWithinOptions Options for the $geoWithin stage.
     * @returns {DataAggregate} The DataAggregate instance for method chaining.
     * @example
     * // Perform a geospatial aggregation using $geoWithin
     * const geoWithinOptions = {
     *   $geometry: {
     *     type: "Polygon",
     *     coordinates: [ [ [ x1, y1 ], [ x2, y2 ], [ x3, y3 ], [ x4, y4 ], [ x1, y1 ] ] ]
     *   }
     * };
     *
     * client.aggregate('Products').geoWithin(geoWithinOptions).execute();
     */
    geoWithin(geoWithinOptions: object): DataAggregate;
    /**
     * Perform a geospatial aggregation operation using the $geoIntersects stage.
     * @param {Docs.GeoIntersectsOptions} geoIntersectsOptions Options for the $geoIntersects stage.
     * @returns {DataAggregate} The DataAggregate instance for method chaining.
     * @example
     * // Perform a geospatial aggregation using $geoIntersects
     * const geoIntersectsOptions = {
     *   $geometry: {
     *     type: "Point",
     *     coordinates: [ longitude, latitude ]
     *   }
     * };
     *
     * client.aggregate('Products').geoIntersects(geoIntersectsOptions).execute();
     */
    geoIntersects(geoIntersectsOptions: object): DataAggregate;
    /**
     * Executes an aggregation pipeline with optional permission checks and returns the result.
     *
     * @param {NasriyaDataOptions} options - Options for the aggregation operation.
     * @returns {Promise<Object[]>} A promise that resolves to an array of objects representing the result of the aggregation.
     * @throws {Error} If an error occurs during the execution of the aggregation pipeline.
     *
     * @example
     * // Execute aggregation with default options
     * const result = await dataAggregate.execute();
     *
     * @example
     * // Execute aggregation with custom options
     * const options = { suppressAuth: true };
     * const result = await dataAggregate.execute(options);
     */
    execute(options?: NasriyaDataOptions): Promise<any[]>;
}
export default DataAggregate;
