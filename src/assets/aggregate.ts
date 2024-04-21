import type { OnFailureEvent, DatabaseDefinition, CollectionDefinition, ClientUser, NasriyaDataOptions, Projection, Grouping, Permission } from '../docs/docs';
import mongodb from 'mongodb';
import helpers from '../utils/helpers';
import DataFilter from './filter';

class DataAggregate {
    private _client: mongodb.MongoClient;

    private _data = Object.seal({
        database: null as unknown as DatabaseDefinition,
        collection: null as unknown as CollectionDefinition,
        user: null as unknown as ClientUser,
        authorization: 'User' as 'System' | 'User',
        onFailure: null as unknown as OnFailureEvent
    })

    /**
     * @param {object} config
     * @param {DatabaseDefinition} config.database
     * @param {CollectionDefinition} config.collection
     * @param {mongodb.MongoClient} client
     * @param {OnFailureEvent} onFailureEvent
     */
    constructor({ database, collection, authorization, user }: { database: DatabaseDefinition, collection: CollectionDefinition, authorization: 'System' | 'User', user: ClientUser }, client: mongodb.MongoClient, onFailureEvent: OnFailureEvent) {
        this._client = client;
        this._data.database = database;
        this._data.collection = collection;
        this._data.authorization = authorization;
        this._data.user = user;
        this._data.onFailure = onFailureEvent;
    }

    private _utils = Object.freeze({
        /**
         * @param {NasriyaDataOptions} [options]
         * @returns {Promise<'Allowed'|'Owned-Items'>} The access authorization
         */
        prepareEvent: async (options?: NasriyaDataOptions): Promise<'Allowed' | 'Owned-Items'> => {
            await this._utils.checkCollectionValidity(this._data.collection!.name);

            const readAccess = this._data.collection!.permissions?.read;
            const permission = options?.suppressAuth !== true ? this._utils.authUser(readAccess) : 'Allowed';
            if (permission === 'Denied') { throw `Access Denied: The current user (${this._data.user!.id}) does not have ${'read'.toUpperCase()} permissions on the ${this._data.collection!.name} collection` }

            return permission;
        },
        /**
         * @param {Permission} [permission] Collection permission
         * @returns {'Allowed'|'Denied'|'Owned-Items'} The access authorization
         */
        authUser: (permission?: Permission): 'Allowed' | 'Denied' | 'Owned-Items' => {
            if (typeof permission === 'undefined') { return 'Allowed' }

            if (this._data.authorization === 'User') {
                if (permission === 'Anyone') {
                    return 'Allowed';
                } else {
                    const user = this._data.user!;
                    if (!user.loggedIn) { return 'Denied' }

                    if (permission === 'Admin') {
                        if (user.role !== 'Admin') { return 'Denied' }
                    }

                    if (permission === 'MemberAuthor') { return 'Owned-Items' }
                    if (permission === 'Member') { return 'Allowed' }
                }
            } else {
                return 'Allowed';
            }

            return 'Denied';
        },
        /**
         * Check if a collection is available on a database
         * @param {string} collection_id A collection name to check for availability
         * @returns {Promise<void>}
         */
        checkCollectionValidity: async (collection_id: string): Promise<void> => {
            try {
                const result = await this._client.db(this._data.database!.name).listCollections();
                const collections = await result.toArray();

                const exist = collections.map(i => i.name).includes(collection_id);
                if (exist) {
                    return Promise.resolve();
                } else {
                    return Promise.reject({ message: `The (${collection_id}) does not exist on your ${this._data.database!.name} database.` })
                }
            } catch (error) {
                return Promise.reject({ message: 'Unable to check collection validity', error })
            }
        },
        /**@param {string} prop */
        checkProperty: (prop: string): void => {
            if (typeof prop !== 'string') { throw `The used property (${prop}) is not a valid string` }
            if (prop.length === 0) { throw 'Missing or invalid property passed to the data refiner. The property cannot be an empty string' }
        }
    })

    private _stages: any[] = [];

    /**
     * Filters out items from being used in an aggregation.
     * @param {DataFilter} filter A filter for the query
     * @returns {DataAggregate}
     */
    filter(filter: DataFilter): DataAggregate {
        if (!(filter instanceof DataFilter)) { throw new TypeError(`The query filter method only accepts an instance of DataFilter. Use the client to create one`) }
        this._stages.push({ $match: filter._filter })
        return this;
    }

    /**
     * Sets the number of items or groups to skip before returning aggregation results.
     * @param {number} number The number of items to skip in the query results before returning the results.
     * @throws {TypeError} - If the provided number is not a number.
     * @throws {RangeError} - If the provided number is negative.
     */
    skip(number: number): DataAggregate {
        if (typeof number !== 'number') { throw new TypeError(`The query skip method only accepts numbers, but instead got ${typeof number}`) }
        if (number < 0) { throw new RangeError(`The query skip method only accepts numbers greater than zero (0)`) }

        this._stages.push({ $skip: number });
        return this;
    }

    /**
     * Limits the number of items or groups the aggregation returns.
     * @description The limit() function defines the number of results a query returns in each page
     * @param {number} limit Pass a number between 1 and 2000 (including).
     */
    limit(limit: number): DataAggregate {
        if (typeof limit !== 'number') { throw 'The query limit method only accepts numbers' }
        if (limit < 1) { throw `The query limit cannot be less than one item` }
        if (limit > 2000) { throw `The query limit cannot exceed 2000 items` }

        this._stages.push({ $limit: limit });
        return this;
    }

    /**
     * Adds a sort to an aggregation, sorting by the items or groups by the specified properties in ascending order (A-Z/0-9).
     * 
     * **Notes:**
     * - You can add as many sorts as you want.
     * - Multiple sorts for the same property will overrwrite each others. Only the last one will apply.
     * @param {string} property The property or field to sort the results with.
     * @returns {DataAggregate}
     */
    ascending(property: string): DataAggregate {
        if (typeof property === 'string' && property.length > 0) {
            this._stages.push({ $sort: { [property]: 1 } });
        } else {
            throw `The "ascending" sorting method is either missing a valid property or is missing the property.`
        }

        return this;
    }

    /**
     * Adds a sort to an aggregation, sorting by the items or groups by the specified properties in descending order (Z-A/9-0)
     * 
     * **Notes:**
     * - You can add as many sorts as you want.
     * - Multiple sorts for the same property will overrwrite each others. Only the last one will apply.
     * @param {string} property The property or field to sort the results with.
     * @returns {DataAggregate}
     */
    descending(property: string): DataAggregate {
        if (typeof property === 'string' && property.length > 0) {
            this._stages.push({ $sort: { [property]: -1 } });
        } else {
            throw `The "descending" sorting method is either missing a valid property or is missing the property.`
        }

        return this;
    }

    /**
     * Choose which fields you want to include and which to exclude.
     * @param {{include?: string[], exclude?: string[]}} options An object specifying which fields to include and which to exclude.
     */
    fields(options: { include?: string[], exclude?: string[] }): DataAggregate {
        if (!helpers.isRealObject(options)) { throw new TypeError(`The filter's "fields" method expected an object, but got ${typeof options}`) }
        if (!('include' in options || 'exclude' in options)) { throw new SyntaxError(`The query's "fields" cannot be called without either the "include" or the "exclude" options`) }

        const projection: any = {};
        if ('include' in options && Array.isArray(options.include)) {
            for (const field of options.include) {
                if (typeof field !== 'string') { throw new SyntaxError(`Projection fields must be strings, but found "${field}".`) }
                if (field.length === 0) { throw new RangeError(`Projection fields cannot be empty strings`) }
                projection[field] = 1
            }
        }

        if ('exclude' in options && Array.isArray(options?.exclude)) {
            for (const field of options.exclude) {
                if (typeof field !== 'string') { throw new SyntaxError(`Projection fields must be strings, but found "${field}".`) }
                if (field.length === 0) { throw new RangeError(`Projection fields cannot be empty strings`) }
                projection[field] = 0
            }
        }

        this._stages.push({ $project: projection });
        return this;
    }

    /**
     * Create a group for aggregation
     * @param {Grouping} grouping 
     * @example
     * client.aggregate('Products').group({
     *      _id: '$mainField',
     *      total: client.aggExps.sum('price')
     * })
     */
    group(grouping: Grouping): DataAggregate {
        if (!helpers.isRealObject(grouping)) { throw new TypeError(`The group method expects a grouping object.`) }
        this._stages.push({ $group: grouping });
        return this;
    }

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
    facet(facets: object): DataAggregate {
        if (!helpers.isRealObject(facets)) { throw new TypeError(`The facet method expects an object but got ${typeof facets}`) }
        this._stages.push({ $facet: facets });
        return this;
    }

    /**
    * Add a custom aggregation stage to the pipeline.
    * @param {Object} stage The custom aggregation stage to add.
    * @returns {DataAggregate} The DataAggregate instance for method chaining.
    * @example
    * // Add a custom aggregation stage
    * const customStage = { $sortByCount: '$category' };
    * client.aggregate('Products').customStage(customStage).execute();
    */
    customStage(stage: object): DataAggregate {
        if (!helpers.isRealObject(stage)) { throw new TypeError(`The customStage method expects an object but got ${typeof stage}.`) }
        this._stages.push(stage);
        return this;
    }

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
    geoNear(geoNearOptions: object): DataAggregate {
        this._stages.push({ $geoNear: geoNearOptions });
        return this;
    }

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
    geoWithin(geoWithinOptions: object): DataAggregate {
        this._stages.push({ $geoWithin: geoWithinOptions });
        return this;
    }

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
    geoIntersects(geoIntersectsOptions: object): DataAggregate {
        this._stages.push({ $geoIntersects: geoIntersectsOptions });
        return this;
    }

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
    async execute(options?: NasriyaDataOptions): Promise<any[]> {
        const context = { collectionName: this._data.collection!.name, userId: this._data.user!.id, userRole: this._data.user!.role }

        try {
            const permission = await this._utils.prepareEvent(options);
            if (options?.suppressAuth !== true && permission === 'Owned-Items') {
                this._stages.unshift({ $match: { _owner: context.userId } })
            }

            // Execute the aggregation pipeline
            const collection = this._client.db(this._data.database!.name).collection(this._data.collection!.name);
            const result = collection.aggregate(this._stages);

            // Process and return the result            
            return result.toArray();
        } catch (error) {
            // Handle errors
            this._data.onFailure({
                hook: this._data.collection!.hooks?.onFailure,
                options,
                dataOperation: 'aggregate',
                context,
                error: error
            })
            
            throw Error; // Just for TS
        }
    }
}

export default DataAggregate;