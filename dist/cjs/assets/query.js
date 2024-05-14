"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const queryResult_1 = __importDefault(require("./queryResult"));
const helpers_1 = __importDefault(require("../utils/helpers"));
const filter_1 = __importDefault(require("./filter"));
class DataQuery {
    #_client;
    #_data = Object.seal({
        database: null,
        collection: null,
        user: null,
        authorization: 'User',
        onFailure: null
    });
    /**
     * @param {object} config
     * @param {DatabaseDefinition} config.database
     * @param {CollectionDefinition} config.collection
     * @param {mongodb.MongoClient} client
     * @param {OnFailureEvent} onFailureEvent
     */
    constructor({ database, collection, authorization, user }, client, onFailureEvent) {
        this.#_client = client;
        this.#_data.database = database;
        this.#_data.collection = collection;
        this.#_data.authorization = authorization;
        this.#_data.user = user;
        this.#_data.onFailure = onFailureEvent;
    }
    #_utils = Object.freeze({
        /**
         * @param {NasriyaDataOptions} [options]
         * @returns {Promise<'Allowed'|'Owned-Items'>} The access authorization
         */
        prepareEvent: async (options) => {
            await this.#_utils.checkCollectionValidity(this.#_data.collection.name);
            const readAccess = this.#_data.collection.permissions?.read;
            const permission = options?.suppressAuth !== true ? this.#_utils.authUser(readAccess) : 'Allowed';
            if (permission === 'Denied') {
                throw `Access Denied: The current user (${this.#_data.user.id}) does not have ${'read'.toUpperCase()} permissions on the ${this.#_data.collection.name} collection`;
            }
            return permission;
        },
        /**
         * @param {Permission} [permission] Collection permission
         * @returns {'Allowed'|'Denied'|'Owned-Items'} The access authorization
        */
        authUser: (permission) => {
            if (typeof permission === 'undefined') {
                return 'Allowed';
            }
            if (this.#_data.authorization === 'User') {
                if (permission === 'Anyone') {
                    return 'Allowed';
                }
                else {
                    const user = this.#_data.user;
                    if (!user.loggedIn) {
                        return 'Denied';
                    }
                    if (permission === 'Admin') {
                        if (user.role !== 'Admin') {
                            return 'Denied';
                        }
                    }
                    if (permission === 'MemberAuthor') {
                        return 'Owned-Items';
                    }
                    if (permission === 'Member') {
                        return 'Allowed';
                    }
                }
            }
            else {
                return 'Allowed';
            }
            return 'Denied';
        },
        /**
         * Check if a collection is available on a database
         * @param {string} collection_id A collection name to check for availability
         * @returns {Promise<void>}
         */
        checkCollectionValidity: async (collection_id) => {
            try {
                const result = await this.#_client.db(this.#_data.database.name).listCollections();
                const collections = await result.toArray();
                const exist = collections.map(i => i.name).includes(collection_id);
                if (exist) {
                    return Promise.resolve();
                }
                else {
                    return Promise.reject({ message: `The (${collection_id}) does not exist on your ${this.#_data.database.name} database.` });
                }
            }
            catch (error) {
                return Promise.reject({ message: 'Unable to check collection validity', error });
            }
        }
    });
    #_config = Object.seal({
        filter: null,
        /**@type {Object<string, 1|-1>} */
        sort: {},
        /**@type {Projection} */
        projection: {},
        skip: 0,
        limit: 100
    });
    /**
     * Set filter for the query
     * @param {DataFilter} filter A filter for the query
     * @returns {DataQuery}
     */
    filter(filter) {
        if (!(filter instanceof filter_1.default)) {
            throw new TypeError(`The query filter method only accepts an instance of DataFilter. Use the client to create one`);
        }
        this.#_config.filter = filter._filter;
        return this;
    }
    /**
     * Sets the number of items to skip before returning query results.
     * @param {number} number The number of items to skip in the query results before returning the results.
     * @throws {TypeError} - If the provided number is not a number.
     * @throws {RangeError} - If the provided number is negative.
     */
    skip(number) {
        if (typeof number !== 'number') {
            throw new TypeError(`The query skip method only accepts numbers, but instead got ${typeof number}`);
        }
        if (number < 0) {
            throw new RangeError(`The query skip method only accepts numbers greater than zero (0)`);
        }
        this.#_config.skip = number;
        return this;
    }
    /**
     * (Limit) Limits the number of items the query returns.
     * @description The limit() function defines the number of results a query returns in each page
     * @param {number} limit Pass a number between 1 and 2000 (including).
     */
    limit(limit) {
        if (typeof limit !== 'number') {
            throw 'The query limit method only accepts numbers';
        }
        if (limit < 1) {
            throw `The query limit cannot be less than one item`;
        }
        if (limit > 2000) {
            throw `The query limit cannot exceed 2000 items`;
        }
        this.#_config.limit = limit;
        return this;
    }
    /**
     * Sort the returned results in ascending order (A-Z/0-9).
     *
     * **Notes:**
     * - You can add as many sorts as you want.
     * - Multiple sorts for the same property will overrwrite each others. Only the last one will apply.
     * @param {string} property The property or field to sort the results with.
     * @returns {DataQuery}
     */
    ascending(property) {
        if (typeof property === 'string' && property.length > 0) {
            this.#_config.sort[property] = 1;
        }
        else {
            throw `The "ascending" sorting method is either missing a valid property or is missing the property.`;
        }
        return this;
    }
    /**
     * Sort the returned results in descending order (Z-A/9-0)
     *
     * **Notes:**
     * - You can add as many sorts as you want.
     * - Multiple sorts for the same property will overrwrite each others. Only the last one will apply.
     * @param {string} property The property or field to sort the results with.
     * @returns {DataQuery}
     */
    descending(property) {
        if (typeof property === 'string' && property.length > 0) {
            this.#_config.sort[property] = -1;
        }
        else {
            throw `The "descending" sorting method is either missing a valid property or is missing the property.`;
        }
        return this;
    }
    /**
     * Choose which fields you want to include and which to exclude.
     * @param {{include?: string[], exclude?: string[]}} options An object specifying which fields to include and which to exclude.
     */
    fields(options) {
        if (!helpers_1.default.isRealObject(options)) {
            throw new TypeError(`The filter's "fields" method expected an object, but got ${typeof options}`);
        }
        if (!('include' in options || 'exclude' in options)) {
            throw new SyntaxError(`The query's "fields" cannot be called without either the "include" or the "exclude" options`);
        }
        const projection = {};
        if ('include' in options && Array.isArray(options.include)) {
            for (const field of options.include) {
                if (typeof field !== 'string') {
                    throw new SyntaxError(`Projection fields must be strings, but found "${field}".`);
                }
                if (field.length === 0) {
                    throw new RangeError(`Projection fields cannot be empty strings`);
                }
                projection[field] = 1;
            }
        }
        if ('exclude' in options && Array.isArray(options?.exclude)) {
            for (const field of options.exclude) {
                if (typeof field !== 'string') {
                    throw new SyntaxError(`Projection fields must be strings, but found "${field}".`);
                }
                if (field.length === 0) {
                    throw new RangeError(`Projection fields cannot be empty strings`);
                }
                projection[field] = 0;
            }
        }
        this.#_config.projection = projection;
        return this;
    }
    /**
     * Use the filter built by this query builder to query a database collection
     * @param {NasriyaDataOptions} [options]
     * @returns {Promise<QueryResult>}
     */
    async find(options) {
        const context = { collectionName: this.#_data.collection.name, userId: this.#_data.user.id, userRole: this.#_data.user.role };
        try {
            if (!this.#_config.filter) {
                this.#_config.filter = {};
            }
            const permission = await this.#_utils.prepareEvent(options);
            const filter = options?.suppressAuth === true ? this.#_config.filter : permission === 'Owned-Items' ? { _owner: context.userId, ...this.#_config.filter } : this.#_config.filter;
            const cursorOptions = {
                sort: this.#_config.sort ? this.#_config.sort : undefined,
                projection: this.#_config.projection ? this.#_config.projection : undefined,
                limit: this.#_config.limit,
                skip: this.#_config.skip
            };
            const collection = this.#_client.db(this.#_data.database.name).collection(this.#_data.collection.name);
            const cursor = collection.find(filter, cursorOptions);
            const [totalCount, items] = await Promise.all([collection.countDocuments(filter), cursor.toArray()]);
            const totalPages = Math.ceil(totalCount / this.#_config.limit);
            const results = new queryResult_1.default({ totalCount, pages: totalPages, pageSize: this.#_config.limit, items: items, cursor });
            return results;
        }
        catch (error) {
            this.#_data.onFailure({
                hook: this.#_data.collection.hooks?.onFailure,
                options,
                dataOperation: 'query',
                context,
                error: error
            });
            throw Error; // Just for TS
        }
    }
    /**
     * Count the total number of items that match the filter of this query
     * @param {NasriyaDataOptions} [options]
     * @returns {Promise<number>} The total number of items that match the filter of this query
     */
    async count(options) {
        const context = { collectionName: this.#_data.collection.name, userId: this.#_data.user.id, userRole: this.#_data.user.role };
        try {
            const permission = await this.#_utils.prepareEvent(options);
            const filter = options?.suppressAuth === true ? this.#_config.filter : permission === 'Owned-Items' ? { _owner: context.userId, ...this.#_config.filter } : this.#_config.filter;
            const collection = this.#_client.db(this.#_data.database.name).collection(this.#_data.collection.name);
            const totalCount = await collection.countDocuments(filter);
            return totalCount;
        }
        catch (error) {
            this.#_data.onFailure({
                hook: this.#_data.collection.hooks?.onFailure,
                options,
                dataOperation: 'count',
                context,
                error: error
            });
            throw Error; // Just for TS
        }
    }
}
exports.default = DataQuery;
