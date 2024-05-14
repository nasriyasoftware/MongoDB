import { ObjectId, MongoClient } from 'mongodb';
import helpers from './utils/helpers';
import { BulkSaveResult, DatabaseDefinition, SaveResult, BulkInsertResult, Item, ClientConstructorOptions, Permission, PrepareEventArgs, CollectionDefinition, NasriyaDataOptions, Schema, SchemaType, CollectionItem, DataOperation, } from './docs/docs';
import { BeforeBulkUpdateHook, BeforeUpdateHook, BeforeBulkRemoveHook, BeforeRemoveHook, BeforeBulkInsertHook, BeforeInsertHook, BeforeGetItemHook, AfterUpdateHook, AfterBulkRemoveHook, AfterRemoveHook, AfterGetItemHook, HookContext, AfterInsertHook, AfterBulkInsertHook, UpdateHookContext, OnFailureHook } from './docs/hooks';
import databaseManager from './utils/databases';
import DataFilter from './assets/filter';
import DataQuery from './assets/query';
import DataAggregate from './assets/aggregate';
import aggExps, { Expressions } from './assets/expressions';
import uuidx from 'nasriya-uuidx';
import NasriyaData from './adapter';

class NasriyaDataClient {
    readonly #_client: MongoClient;

    readonly #_config = Object.seal({
        connected: false,
        connectionString: 'mongodb://127.0.0.1:27017',
        authorization: 'User' as 'User' | 'System',
        database: {
            selected: null as unknown as string,
            default: null as unknown as string
        },
        user: {
            id: undefined as unknown as string | undefined,
            loggedIn: false,
            role: 'Visitor' as 'Visitor' | 'Member' | 'Admin'
        }
    })

    /**
     * Create a new MongoDB adapter using Nasriya `NasriyaData`
     * @param {ClientConstructorOptions} options 
     */
    constructor(options: ClientConstructorOptions) {
        this.#_client = options.client;
        if (options.authorization) { this.#_config.authorization = options.authorization }
        if (options.defaultDatabase) { this.#_config.database.default = this.#_config.database.selected = options.defaultDatabase }

        if (this.#_config.authorization === 'User') {
            this.#_config.user.loggedIn = options?.user?.loggedIn === true ? true : false;
            this.#_config.user.role = options.user?.role || 'Visitor';
            this.#_config.user.id = options.user?.id || undefined;
        }
    }

    readonly #_utils = Object.freeze({
        /**
         * Check if a collection is available on a database
         * @param {string} collectionName A collection name to check for availability
         * @returns {Promise<void>}
         */
        checkCollectionValidity: async (collectionName: string): Promise<void> => {
            try {
                const result = await this.#_client.db(this.#_config.database.selected).listCollections();
                const collections = await result.toArray();

                const exist = collections.map(i => i.name).includes(collectionName);
                if (exist) {
                    return Promise.resolve();
                } else {
                    return Promise.reject({ message: `The (${collectionName}) does not exist on your ${this.#_config.database} database.` })
                }
            } catch (error) {
                return Promise.reject({ message: 'Unable to check collection validity', error })
            }
        },
        /**
         * @param {Permission} [permission] Collection permission
         * @returns {'Allowed'|'Denied'|'Owned-Items'} The access authorization
        */
        authUser: (permission?: Permission): 'Allowed' | 'Denied' | 'Owned-Items' => {
            if (typeof permission === 'undefined') { return 'Allowed' }

            if (this.authorization === 'User') {
                if (permission === 'Anyone') {
                    return 'Allowed';
                } else {
                    const user = this.#_config.user;
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
         * @param {PrepareEventArgs} data 
         * @returns {{permission:'Allowed' | 'Owned-Items', collection: CollectionDefinition }}
        */
        prepareEvent: (data: PrepareEventArgs): { permission: 'Allowed' | 'Owned-Items'; collection: CollectionDefinition; } => {
            const database = databaseManager.getDatabase(this.#_config.database.selected);
            if (!database) { throw `The database ${this.#_config.database.selected} is not a defined database` }

            const collection = database.collections.find(i => i.name === data.collectionName);
            if (!collection) { throw `The collection ${data.collectionName} does not exist on the ${this.#_config.database.selected} database` }

            const permission = collection.permissions?.[data.accessType] || 'Allowed' as Permission;
            const auth = data?.options?.suppressAuth !== true ? this.#_utils.authUser(permission) : 'Allowed';
            if (auth === 'Denied') { throw `Access Denied: The current user (${this.#_config.user.id}) does not have ${data.accessType.toUpperCase()} permissions on the ${collection.name} collection` }
            return { permission: auth, collection }
        },
        /**
         * Check the arguments of an operation call
         * @param {string} collectionName 
         * @param {{type: 'String'|'Object'|'Array', value: string|Object|Array}} argData 
         * @param {NasriyaDataOptions} options 
         */
        checkArgs: async (collectionName: string, argData: { type: 'String' | 'Object' | 'Array'; value: string | object | Array<any>; }, options: NasriyaDataOptions) => {
            if (typeof collectionName !== 'string') { throw new TypeError(`The collection name must only be a string, instead got ${typeof collectionName}`) }
            await this.#_utils.checkCollectionValidity(collectionName);

            if (argData.type === 'String') {
                if (typeof argData.value !== 'string') { throw new TypeError(`The itemId must be string, but instead got ${typeof argData.value}`) }
                if (argData.value.length === 0) { throw new RangeError(`The itemId cannot be an empty string`) }
            }

            if (argData.type === 'Object') {
                if (!helpers.isRealObject(argData.value)) { throw new TypeError(`The item must be an object, instead got ${typeof argData.value}`) }
            }

            if (argData.type === 'Array') {
                if (!Array.isArray(argData.value)) { throw new TypeError(`The items must be an array of objects, instead got ${typeof argData.value}`) }
            }

            if (helpers.isRealObject(options)) {
                if ('suppressAuth' in options) {
                    if (typeof options.suppressAuth !== 'boolean') { throw new TypeError(`The 'suppressAuth' option can only accept a boolean value, instead got ${typeof options.suppressAuth}`) }
                }

                if ('suppressHooks' in options) {
                    if (typeof options.suppressHooks !== 'boolean') { throw new TypeError(`The 'suppressHooks' option can only accept a boolean value, instead got ${typeof options.suppressHooks}`) }
                }
            }
        },
        /**
         * @param {Item} item 
         * @param {Docs.Schema} [schema] 
         * @param {'Insert'|'Update'} [operation]
         * @returns {Item}
         */
        validateItemSchema: (item: Item, schema?: Schema, operation?: 'Insert' | 'Update'): Item => {
            if (!helpers.isRealObject(item)) { throw new SyntaxError(`The schema validator expects the item to be an object, instead got ${typeof item}`) }
            /**
             * @param {string} property
             * @param {SchemaType|'Any'} schemaType 
             * @param {*} value 
             */
            const checkType = (property: string, schemaType: SchemaType | 'Any', value: any) => {
                switch (schemaType) {
                    case 'Array': {
                        if (!Array.isArray(value)) {
                            throw `The ${property} type is defined in the collection's schema as '${schemaType}', but instead got ${typeof value}`;
                        }
                    }
                        break;

                    case 'Boolean': {
                        if (typeof value !== 'boolean') {
                            throw `The ${property} type is defined in the collection's schema as '${schemaType}', but instead got ${typeof value}`;
                        }
                    }
                        break;

                    case 'Date': {
                        if (!(value instanceof Date)) {
                            throw `The ${property} type is defined in the collection's schema as '${schemaType}', but instead got ${typeof value}`;
                        }
                    }
                        break;

                    case 'Number': {
                        if (typeof value !== 'number') {
                            throw `The ${property} type is defined in the collection's schema as '${schemaType}', but instead got ${typeof value}`;
                        }
                    }
                        break;

                    case 'String': {
                        if (typeof value !== 'string') {
                            throw `The ${property} type is defined in the collection's schema as '${schemaType}', but instead got ${typeof value}`;
                        }
                    }
                        break;

                    case 'Object': {
                        if (!helpers.isRealObject(value)) {
                            throw `The ${property} type is defined in the collection's schema as '${schemaType}', but instead got ${typeof value}`;
                        }
                    }
                        break;
                    case 'Any': {
                        return;
                    }
                    default: {
                        throw `'${schema?.[property]}' is not a valid database schema type`;
                    }
                }
            }

            if (!helpers.isUndefined(schema) && helpers.isRealObject(schema)) {
                for (const property in schema) {
                    const propSchema = schema[property];

                    if (helpers.isCustomSchema(propSchema)) {
                        if (property in item) {
                            if ('validity' in propSchema && !helpers.isUndefined(propSchema.validity)) {
                                const valid = propSchema.validity.handler(item[property]);
                                if (valid !== true) { throw propSchema.validity.message }
                            } else {
                                checkType(property, propSchema.type, item[property]);
                            }
                        } else {
                            if (operation === 'Insert') {
                                if ('required' in propSchema) {
                                    if ('default' in propSchema) {
                                        item[property] = propSchema.default;
                                    } else {
                                        throw `The ${property} property is required but is missing on the provided object`
                                    }
                                } else {
                                    if ('default' in propSchema) {
                                        item[property] = propSchema.default;
                                    }
                                }
                            } else if (operation === 'Update') {
                                // When updating an item, you can safely ignore the absence of the value
                            }
                        }
                    } else {
                        if (property in item) {
                            checkType(property, propSchema, item[property]);
                        }
                    }
                }
            }

            return item;
        }
    })

    readonly #_helpers = Object.freeze({
        validateInsertItem: (item: Item, userId?: string): CollectionItem => {
            if ('_id' in item) {
                if (typeof item._id !== 'string') { throw new TypeError(`The item ID is expected to be a string, instead got ${typeof item._id}`) }
                if (item._id.length === 0) { throw new RangeError(`The provided item _id cannot be an empty string`) }
            } else {
                item._id = uuidx.v4();
            }

            // Add the dates to the item;
            if ('_createdDate' in item) {
                if (typeof item._createdDate === 'string') {
                    try {
                        const date = new Date(item._createdDate);
                        item._createdDate = date;
                    } catch (error) {
                        throw `The inserted items's "_createdDate" is not a valid Date value. Pass a Date instance, timestamp, or an ISO date`;
                    }
                } else if (item._createdDate instanceof Date) {
                    item._createdDate = item._createdDate;
                } else {
                    throw new TypeError(`The items's "_createdDate" is invalid. Expected a Date instance or a date ISO but got ${typeof item._createdDate}`)

                }
            } else {
                item._createdDate = new Date();
            }

            if ('_updatedDate' in item) {
                let date: Date;
                if (typeof item._updatedDate === 'string') {
                    try {
                        date = new Date(item._updatedDate);
                    } catch (error) {
                        throw `The inserted items's "_updatedDate" is not a valid Date value. Pass a Date instance, timestamp, or an ISO date`;
                    }
                } else if (item._updatedDate instanceof Date) {
                    date = item._updatedDate;
                } else {
                    throw new TypeError(`The items's "_updatedDate" is invalid. Expected a Date instance or a date ISO but got ${typeof item._updatedDate}`)
                }

                if (date < item._createdDate) {
                    throw `The inserted items's "_updatedDate" is cannot be before the "_createdDate" of the document`;
                }

                item._updatedDate = date;
            } else {
                item._updatedDate = item._createdDate;
            }

            if (this.authorization === 'System') {
                item._owner = 'system'
            } else {
                if ('_owner' in item) {
                    if (typeof item._owner !== 'string') { throw new TypeError(`The "_owner" value should be a string, but instead got ${typeof item._owner}`) }
                    if (item._owner.length === 0) { throw new RangeError(`The "_owner" value cannot be an empty string`) }
                    if (item._owner.toLowerCase() === 'system') { throw new RangeError(`The "_owner" value cannot be set to the value "System".`) }
                } else {
                    item._owner = userId;
                }
            }

            return item as CollectionItem;
        },
        validateUpdateItem: (item: { [key: string]: any }): Item => {
            if ('_id' in item) {
                if (typeof item._id !== 'string') { throw new TypeError(`The item ID is expected to be a string, instead got ${typeof item._id}`) }
                if (item._id.length === 0) { throw new RangeError(`The provided item _id cannot be an empty string`) }
            } else {
                throw new SyntaxError(`An item in the update list is missing its "_id" field. All items must include the "_id" property`);
            }

            // Add the dates to the item;
            if ('_createdDate' in item) { delete item._createdDate }
            if ('_owner' in item) { delete item._owner }
            item._updatedDate = new Date();

            return item;
        },
        /**
         * Check if an item exist in a database collection or not
         * @param {string} databaseName 
         * @param {string} collectionName 
         * @param {string|undefined} itemId 
         * @returns {Promise<boolean>} Whether the item exist or not.
         */
        checkExistance: async (databaseName: string, collectionName: string, itemId: string | undefined): Promise<boolean> => {
            if (!helpers.isValidString(itemId)) { return false }
            const item = await this.#_client.db(databaseName).collection(collectionName).findOne({ _id: itemId as any });
            return item ? true : false;
        },
        /**
         * Analyze the items to check which of them exist and which don't
         * @param {string} databaseName 
         * @param {string} collectionName 
         * @param {Item[]} items 
         * @returns {Promise<{ toUpdate: Item[], toInsert: object[] }>}
         */
        checkItemsExistance: async (databaseName: string, collectionName: string, items: Item[]): Promise<{ toUpdate: Item[]; toInsert: Item[]; }> => {
            const toInsert: Item[] = [];
            const toUpdate: Item[] = [];
            const toCheck: Promise<void>[] = [];

            for (const item of items) {
                if (!helpers.isRealObject(item)) { throw new TypeError(`The "save" or "bulkSave" items are expected to be objects, instead one of the items was of type ${typeof item}`) }

                if ('_id' in item) {
                    if (typeof item._id !== 'string') { throw new TypeError(`The item you're trying to save has an invalid "_id" value. Expects a string but got ${typeof item._id}`) }
                    if (item._id.length === 0) { throw new RangeError(`The item "_id" cannot be an empty string`) }
                    toCheck.push(new Promise<void>((resolve, reject) => {
                        this.#_helpers.checkExistance(databaseName, collectionName, item._id).then(exist => {
                            if (exist === true) { toUpdate.push(item) } else { toInsert.push(item) }
                            resolve();
                        }).catch(err => reject(err));
                    }));

                } else {
                    toInsert.push(item);
                }
            }

            if (toCheck.length > 0) {
                const result = await Promise.allSettled(toCheck);
                const rejected = result.filter(i => i.status === 'rejected');
                if (rejected.length > 0) {
                    console.error(`System Error: Unable to check items existance`)
                }
            }

            return { toUpdate, toInsert }
        }
    })

    readonly #_events = Object.freeze({
        /**
         * @param {{hook?: AfterGetItemHook item: CollectionItem, context: HookContext}} eventArgs
         * @param {NasriyaDataOptions} options
         * @returns {Promise<CollectionItem>}
         */
        afterGetItem: async (eventArgs: { hook?: AfterGetItemHook; item: CollectionItem; context: HookContext; }, options: NasriyaDataOptions): Promise<CollectionItem> => {
            const cache: { item: CollectionItem | Promise<CollectionItem> } = { item: null as unknown as CollectionItem }
            if (options?.suppressHooks !== true) {
                if (typeof eventArgs.hook === 'function') {
                    cache.item = eventArgs.hook(eventArgs.item, eventArgs.context);
                    if (cache.item instanceof Promise) {
                        cache.item = await cache.item.then();
                    }

                    if (helpers.isRealObject(cache.item)) {
                        return cache.item;
                    }
                }
            }

            return eventArgs.item;
        },
        /**
         * @param {{hook?: AfterInsertHook, item: CollectionItem, context: HookContext}} eventArgs 
         * @param {NasriyaDataOptions} options 
         * @returns {Promise<CollectionItem>}
         */
        afterInsert: async (eventArgs: { hook?: AfterInsertHook; item: CollectionItem; context: HookContext; }, options: NasriyaDataOptions): Promise<CollectionItem> => {
            // Check the user defined hook
            const cache: { item: CollectionItem | Promise<CollectionItem> } = { item: null as unknown as CollectionItem }
            if (options?.suppressHooks !== true) {
                if (typeof eventArgs.hook === 'function') {
                    cache.item = eventArgs.hook(eventArgs.item, eventArgs.context);
                    if (cache.item instanceof Promise) {
                        cache.item = await cache.item.then();
                    }

                    if (helpers.isRealObject(cache.item)) {
                        return cache.item;
                    }
                }
            }

            return eventArgs.item;
        },
        /**
         * @param {{hook?: AfterBulkInsertHook, items: CollectionItem[], context: HookContext}} eventArgs 
         * @param {NasriyaDataOptions} options 
         */
        afterBulkInsert: async (eventArgs: { hook?: AfterBulkInsertHook; items: CollectionItem[]; context: HookContext; }, options: NasriyaDataOptions) => {
            // Check the user defined hook
            const cache: { items: CollectionItem[] | Promise<CollectionItem[]> } = { items: null as unknown as CollectionItem[] }
            if (options?.suppressHooks !== true) {
                if (typeof eventArgs.hook === 'function') {
                    cache.items = eventArgs.hook(eventArgs.items, eventArgs.context);
                    if (cache.items instanceof Promise) {
                        cache.items = await cache.items.then();
                    }

                    if (Array.isArray(cache.items)) {
                        for (const item of cache.items) {
                            if (!helpers.isRealObject(item)) {
                                throw new TypeError(`One or more of the items are not valid. Expected an array of objects but one of the items was ${typeof item}`)
                            }
                        }
                    }
                }
            }

            return eventArgs.items;
        },
        /**
         * @param {{hook?: AfterRemoveHook, itemId: string, context: HookContext}} eventArgs 
         * @param {NasriyaDataOptions} options 
         * @returns {Promise<string>} A promise of `string` for the `itemId`
         */
        afterRemove: async (eventArgs: { hook?: AfterRemoveHook; itemId: string; context: HookContext; }, options: NasriyaDataOptions): Promise<string> => {
            // Check the user defined hook
            const cache: { itemId: string | Promise<string> } = { itemId: null as unknown as string }
            if (options?.suppressHooks !== true) {
                if (typeof eventArgs.hook === 'function') {
                    cache.itemId = eventArgs.hook(eventArgs.itemId, eventArgs.context);
                    if (cache.itemId instanceof Promise) {
                        cache.itemId = await cache.itemId.then();
                    }

                    if (typeof cache.itemId === 'string') {
                        return cache.itemId;
                    }
                }
            }

            return eventArgs.itemId;
        },
        /**
         * @param {{hook?: AfterBulkRemoveHook, itemsIds: string[], context: HookContext}} eventArgs 
         * @param {NasriyaDataOptions} options 
         * @returns {Promise<string[]>}
         */
        afterBulkRemove: async (eventArgs: { hook?: AfterBulkRemoveHook; itemsIds: string[]; context: HookContext; }, options: NasriyaDataOptions): Promise<string[]> => {
            // Check the user defined hook
            const cache: { itemsIds: string[] | Promise<string[]> } = { itemsIds: null as unknown as string[] }
            if (options?.suppressHooks !== true) {
                if (typeof eventArgs.hook === 'function') {
                    cache.itemsIds = eventArgs.hook(eventArgs.itemsIds, eventArgs.context);
                    if (cache.itemsIds instanceof Promise) {
                        cache.itemsIds = await cache.itemsIds.then();
                    }

                    if (Array.isArray(cache.itemsIds)) {
                        return cache.itemsIds;
                    }
                }
            }

            return eventArgs.itemsIds;
        },
        /**
         * @param {{hook?: AfterUpdateHook, itemId: string, context: HookContext}} eventArgs 
         * @param {NasriyaDataOptions} options 
         * @returns {Promise<string>}
         */
        afterUpdate: async (eventArgs: { hook?: AfterUpdateHook; itemId: string; context: HookContext; }, options: NasriyaDataOptions): Promise<string> => {
            // Check the user defined hook
            const cache: { itemId: string | Promise<string> } = { itemId: null as unknown as string }
            if (options?.suppressHooks !== true) {
                if (typeof eventArgs.hook === 'function') {
                    cache.itemId = eventArgs.hook(eventArgs.itemId, eventArgs.context);
                    if (cache.itemId instanceof Promise) {
                        cache.itemId = await cache.itemId.then();
                    }

                    if (typeof cache.itemId === 'string') {
                        return cache.itemId;
                    }
                }
            }

            return eventArgs.itemId;
        },
        /**
         * @param {{hook?: BeforeGetItemHook, itemId: string, context: HookContext}} eventArgs
         * @param {NasriyaDataOptions} options
         * @returns {Promise<string>} A promise of `string` for the `itemId`
        */
        beforeGetItem: async (eventArgs: { hook?: BeforeGetItemHook; itemId: string; context: HookContext; }, options: NasriyaDataOptions): Promise<string> => {
            // Check the user defined hook
            const cache: { itemId: string | Promise<string> } = { itemId: null as unknown as string }
            if (options?.suppressHooks !== true) {
                if (typeof eventArgs.hook === 'function') {
                    cache.itemId = eventArgs.hook(eventArgs.itemId, eventArgs.context);
                    if (cache.itemId instanceof Promise) {
                        cache.itemId = await cache.itemId.then();
                    }

                    if (typeof cache.itemId === 'string') {
                        return cache.itemId;
                    }
                }
            }

            return eventArgs.itemId;
        },
        /**
         * @param {{hook?: BeforeInsertHook, item: CollectionItem, context: HookContext}} eventArgs 
         * @param {NasriyaDataOptions} options 
         * @returns {Promise<Item>}
         */
        beforeInsert: async (eventArgs: { hook?: BeforeInsertHook; item: Item; context: HookContext; }, options: NasriyaDataOptions): Promise<Item> => {
            this.#_helpers.validateInsertItem(eventArgs.item, eventArgs.context.userId);

            // Check the user defined hook
            const cache: { item: Item | Promise<Item> } = { item: null as unknown as Item }
            if (options?.suppressHooks !== true) {
                if (typeof eventArgs.hook === 'function') {
                    cache.item = eventArgs.hook(eventArgs.item, eventArgs.context);
                    if (cache.item instanceof Promise) {
                        cache.item = await cache.item.then();
                    }

                    if (helpers.isRealObject(cache.item)) {
                        return this.#_helpers.validateInsertItem(cache.item, eventArgs.context.userId);
                    }
                }
            }

            return eventArgs.item;
        },
        /**
         * @param {{hook?: BeforeBulkInsertHook, items: Item[], context: HookContext}} eventArgs 
         * @param {NasriyaDataOptions} options 
         */
        beforeBulkInsert: async (eventArgs: { hook?: BeforeBulkInsertHook; items: Item[]; context: HookContext; }, options: NasriyaDataOptions) => {
            for (const item of eventArgs.items) {
                this.#_helpers.validateInsertItem(item, eventArgs.context.userId);
            }

            // Check the user defined hook
            const cache: { items: Item[] | Promise<Item[]> } = { items: null as unknown as Item[] }
            if (options?.suppressHooks !== true) {
                if (typeof eventArgs.hook === 'function') {
                    cache.items = eventArgs.hook(eventArgs.items, eventArgs.context);
                    if (cache.items instanceof Promise) {
                        cache.items = await cache.items.then();
                    }

                    if (Array.isArray(cache.items)) {
                        for (const item of cache.items) {
                            if (helpers.isRealObject(item)) {
                                this.#_helpers.validateInsertItem(item, eventArgs.context.userId);
                            } else {
                                throw new TypeError(`One or more of the items are not valid. Expected an array of objects but one of the items was ${typeof item}`)

                            }
                        }
                    }
                }
            }

            return eventArgs.items;
        },
        /**
         * @param {{hook?: BeforeRemoveHook, itemId: string, context: HookContext}} eventArgs 
         * @param {NasriyaDataOptions} options 
         * @returns {Promise<string>}
         */
        beforeRemove: async (eventArgs: { hook?: BeforeRemoveHook; itemId: string; context: HookContext; }, options: NasriyaDataOptions): Promise<string> => {
            // Check the user defined hook
            const cache: { itemId: string | Promise<string> } = { itemId: null as unknown as string }
            if (options?.suppressHooks !== true) {
                if (typeof eventArgs.hook === 'function') {
                    cache.itemId = eventArgs.hook(eventArgs.itemId, eventArgs.context);
                    if (cache.itemId instanceof Promise) {
                        cache.itemId = await cache.itemId.then();
                    }

                    if (typeof cache.itemId === 'string') {
                        return cache.itemId;
                    }
                }
            }

            return eventArgs.itemId;
        },
        /**
         * @param {{hook?: BeforeBulkRemoveHook, itemsIds: string[], context: HookContext}} eventArgs 
         * @param {NasriyaDataOptions} options 
         * @returns {Promise<string[]>}
         */
        beforeBulkRemove: async (eventArgs: { hook?: BeforeBulkRemoveHook; itemsIds: string[]; context: HookContext; }, options: NasriyaDataOptions): Promise<string[]> => {
            // Check the user defined hook
            const cache: { itemsIds: string[] | Promise<string[]> } = { itemsIds: null as unknown as string[] }
            if (options?.suppressHooks !== true) {
                if (typeof eventArgs.hook === 'function') {
                    cache.itemsIds = eventArgs.hook(eventArgs.itemsIds, eventArgs.context);
                    if (cache.itemsIds instanceof Promise) {
                        cache.itemsIds = await cache.itemsIds.then();
                    }

                    if (Array.isArray(cache.itemsIds)) {
                        return cache.itemsIds;
                    }
                }
            }

            return eventArgs.itemsIds;
        },
        /**
         * @param {{hook?: BeforeUpdateHook, item: Record<string, any>, context: HookContext}} eventArgs 
         * @param {NasriyaDataOptions} options 
         * @returns {Promise<Item>}
         */
        beforeUpdate: async (eventArgs: { hook?: BeforeUpdateHook; item: Record<string, any>; context: HookContext; }, options: NasriyaDataOptions): Promise<Item> => {
            this.#_helpers.validateUpdateItem(eventArgs.item);

            // Check the user defined hook
            const cache: { item: Item | Promise<Item> } = { item: null as unknown as Item }
            if (options?.suppressHooks !== true) {
                if (typeof eventArgs.hook === 'function') {
                    cache.item = eventArgs.hook(eventArgs.item, eventArgs.context);
                    if (cache.item instanceof Promise) {
                        cache.item = await cache.item.then();
                    }

                    if (helpers.isRealObject(cache.item)) {
                        return this.#_helpers.validateUpdateItem(cache.item);
                    }
                }
            }

            return eventArgs.item;
        },
        /**
         * @param {{hook?: BeforeBulkUpdateHook, items: Item[], context: HookContext}} eventArgs 
         * @param {NasriyaDataOptions} options 
         * @returns {Promise<Item[]>}
         */
        beforeBulkUpdate: async (eventArgs: { hook?: BeforeBulkUpdateHook; items: Item[]; context: HookContext; }, options: NasriyaDataOptions): Promise<Item[]> => {
            for (const item of eventArgs.items) {
                this.#_helpers.validateUpdateItem(item);
            }

            // Check the user defined hook
            const cache: { items: Item[] | Promise<Item[]> } = { items: null as unknown as Item[] }
            if (options?.suppressHooks !== true) {
                if (typeof eventArgs.hook === 'function') {
                    cache.items = eventArgs.hook(eventArgs.items, eventArgs.context);
                    if (cache.items instanceof Promise) {
                        cache.items = await cache.items.then();
                    }

                    if (Array.isArray(cache.items)) {
                        for (const item of cache.items) {
                            if (helpers.isRealObject(item)) {
                                this.#_helpers.validateUpdateItem(item);
                            } else {
                                throw new TypeError(`One or more of the items are not valid. Expected an array of objects but one of the items was ${typeof item}`)

                            }
                        }

                        return cache.items;
                    }
                }
            }

            return eventArgs.items;
        },
        /**
         * Throw an error when a data operation fails
         * @param {{hook?: OnFailureHook, options: NasriyaDataOptions, dataOperation: DataOperation, context: HookContext, error: Error}} args 
         */
        onFailure: (args: { hook?: OnFailureHook, options?: NasriyaDataOptions, dataOperation: DataOperation, context: HookContext, error: Error }): void => {
            const error = {
                type: `${args.dataOperation}_error`,
                context: args.context,
                error: args.error,
            }

            if (args.options?.suppressHooks !== true) {
                if (typeof args.hook === 'function') {
                    try {
                        args.hook(args.error, args.context);
                    } catch (error) {
                        console.warn(`An error has been thrown in your onFailure data hook for the ${args.context.collectionName} collection. Do not use the onFailure hook to throw errors. An error is already thrown`)
                    }
                }
            }

            throw error;
        },
    })

    /**
     * Build a new data filter
     * @returns {DataFilter}
     */
    filter(): DataFilter { return new DataFilter() }

    /**
     * Creates an aggregation.
     * @param {string} collectionName The collection ID to be used
     * @returns {DataAggregate}
     */
    aggregate(collectionName: string): DataAggregate {
        const database = databaseManager.getDatabase(this.#_config.database.selected);
        if (!database) { throw `The database ${this.#_config.database.selected} is not a defined database` }

        const collection = database.collections.find(i => i.name === collectionName);
        if (!collection) { throw `The collection ${collectionName} does not exist on the ${database.name} database` }


        return new DataAggregate(
            { database, collection, authorization: this.authorization, user: this.#_config.user },
            this.#_client,
            this.#_events.onFailure
        );
    }

    /**
     * Build a query or filter
     * @param {string} collectionName The collection ID to be used
     * @returns {DataQuery}
     */
    query(collectionName: string): DataQuery {
        const database = databaseManager.getDatabase(this.#_config.database.selected);
        if (!database) { throw `The database ${this.#_config.database.selected} is not a defined database` }

        const collection = database.collections.find(i => i.name === collectionName);
        if (!collection) { throw `The collection ${collectionName} does not exist on the ${this.#_config.database.selected} database` }

        return new DataQuery({ database, collection, authorization: this.authorization, user: this.#_config.user }, this.#_client, this.#_events.onFailure);
    }

    /**
     * Get a single item (object) from a database collection
     * @param {string} collectionName The collection ID to be used
     * @param {string} itemId The ID of the item to be retrieved
     * @param {NasriyaDataOptions} [options] Operation options
     * @returns {Promise<CollectionItem|null>} The retrieved object if the ID matched an item, or null if otherwise.
     */
    async getItem(collectionName: string, itemId: string, options: NasriyaDataOptions = { suppressAuth: false, suppressHooks: false }): Promise<CollectionItem | null> {
        const accessType = 'read';
        // Run prechecks
        await this.#_utils.checkArgs(collectionName, { type: 'String', value: itemId }, options);
        const { collection, permission } = this.#_utils.prepareEvent({ collectionName: collectionName, accessType, options })
        const context = { collectionName: collection.name, userId: this.#_config.user.id, userRole: this.#_config.user.role }

        try {
            // Run the "Before" System Hook
            const newItemId = await this.#_events.beforeGetItem({ hook: collection.hooks?.beforeGetItem, itemId, context }, options);

            const criteria = { _id: newItemId as any, ...(permission === 'Owned-Items' ? { _owner: context.userId } : {}) }
            const item = await this.#_client.db(this.#_config.database.selected).collection(collectionName).findOne(criteria);
            if (!item) { return null }

            // Run the "After" System Hook
            const newItem = await this.#_events.afterGetItem({ hook: collection.hooks?.afterGetItem, item: item as unknown as CollectionItem, context }, options);
            return newItem;
        } catch (error) {
            this.#_events.onFailure({
                hook: collection.hooks?.onFailure,
                options,
                dataOperation: 'getItem',
                context,
                error: error as Error
            });

            throw Error();
        }
    }

    /**
     * Insert a single item (object) in a database collection
     * @param {string} collectionName The collection ID to be used
     * @param {Item} item The item to be inserted
     * @param {NasriyaDataOptions} [options] Operation options
     * @returns {Promise<CollectionItem>} The ID of the inserted item
     */
    async insert(collectionName: string, item: Item, options: NasriyaDataOptions = { suppressAuth: false, suppressHooks: false }): Promise<CollectionItem> {
        const accessType = 'write';
        // Run prechecks
        await this.#_utils.checkArgs(collectionName, { type: 'Object', value: item }, options);
        const { collection, permission } = this.#_utils.prepareEvent({ collectionName: collectionName, accessType, options })
        const context = { collectionName: collection.name, userId: this.#_config.user.id, userRole: this.#_config.user.role }

        try {
            // Run the "Before" System Hook
            const beforeItem = await this.#_events.beforeInsert({ hook: collection.hooks?.beforeInsert, item, context }, options);
            const finalItem = this.#_utils.validateItemSchema(beforeItem, collection.schema);

            const result = await this.#_client.db(this.#_config.database.selected).collection(collectionName).insertOne(finalItem as any);
            const insertedItem = await this.#_client.db(this.#_config.database.selected).collection(collectionName).findOne({ _id: result.insertedId });

            const newItem = this.#_events.afterInsert({ hook: collection.hooks?.afterInsert, item: insertedItem as unknown as CollectionItem, context }, options)
            return newItem;
        } catch (error) {
            this.#_events.onFailure({
                hook: collection.hooks?.onFailure,
                options,
                dataOperation: 'insert',
                context,
                error: error as Error
            });

            throw Error();
        }
    }

    /**
     * Bulk insert an array of items in a database collection
     * @param {string} collectionName The collection ID to be used
     * @param {Item[]} items An array of items to be inserted
     * @param {NasriyaDataOptions} [options] Operation options
     * @returns {Promise<BulkInsertResult>} The bulk insert result
     */
    async bulkInsert(collectionName: string, items: Item[], options: NasriyaDataOptions = { suppressAuth: false, suppressHooks: false }): Promise<BulkInsertResult> {
        const accessType = 'write';
        // Run prechecks
        await this.#_utils.checkArgs(collectionName, { type: 'Array', value: items }, options);
        const { collection } = this.#_utils.prepareEvent({ collectionName: collectionName, accessType, options })
        const context = { collectionName: collection.name, userId: this.#_config.user.id, userRole: this.#_config.user.role }

        try {
            // Run the "Before" System Hook
            const beforeItems = await this.#_events.beforeBulkInsert({ hook: collection.hooks?.beforeBulkInsert, items, context }, options);
            const finalItems = beforeItems.map(beforeItem => this.#_utils.validateItemSchema(beforeItem, collection.schema)) as Item[];

            const result = await this.#_client.db(this.#_config.database.selected).collection(collectionName).insertMany(finalItems as any);
            const insertedItems = await this.#_client.db(this.#_config.database.selected).collection(collectionName).find({ _id: { $in: finalItems.map(i => i._id) } as unknown as ObjectId[] }).toArray();

            const insertedIds = Object.values(result.insertedIds).map(id => id.toString());
            const skippedIds = finalItems.filter(i => typeof i?._id === 'string' && insertedIds.includes(i?._id)).map(i => i._id) as string[];
            // const skippedIds = finalItems.filter(i => typeof i?._id === 'string' && insertedIds.includes(i?._id)).map(i => i._id);


            const newItems = await this.#_events.afterBulkInsert({ hook: collection.hooks?.afterBulkInsert, items: insertedItems as unknown as CollectionItem[], context }, options);

            return {
                items: newItems,
                stats: {
                    inserted: result.insertedCount,
                    skipped: finalItems.length - insertedItems.length,
                    insertedIds,
                    skippedIds: skippedIds,
                }
            }
        } catch (error) {
            this.#_events.onFailure({
                hook: collection.hooks?.onFailure,
                options,
                dataOperation: 'bulkInsert',
                context,
                error: error as Error
            });

            throw Error();
        }
    }

    /**
     * Remove a single item (object) from a database collection
     * @param {string} collectionName The collection ID to be used
     * @param {string} itemId The ID of the item to be removed
     * @param {NasriyaDataOptions} [options] Operation options
     * @returns {Promise<string>} The ID of the removed item
     */
    async remove(collectionName: string, itemId: string, options: NasriyaDataOptions = { suppressAuth: false, suppressHooks: false }): Promise<string> {
        const accessType = 'delete';
        // Run prechecks
        await this.#_utils.checkArgs(collectionName, { type: 'String', value: itemId }, options);
        const { collection, permission } = this.#_utils.prepareEvent({ collectionName: collectionName, accessType, options })
        const context = { collectionName: collection.name, userId: this.#_config.user.id, userRole: this.#_config.user.role }

        try {
            // Run the "Before" System Hook
            const beforeItemId = await this.#_events.beforeRemove({ hook: collection.hooks?.beforeRemove, itemId, context }, options);

            const criteria = { _id: beforeItemId, ...(permission === 'Owned-Items' ? { _owner: context.userId } : {}) }
            const result = await this.#_client.db(this.#_config.database.selected).collection(collectionName).deleteOne(criteria as any);
            if (!result.acknowledged) {
                throw { message: `The data adapter is unable to remove ${beforeItemId}.` }
            }

            // Run the "After" System Hook
            const afterItemId = await this.#_events.afterRemove({ hook: collection.hooks?.beforeRemove, itemId: beforeItemId, context }, options);
            return afterItemId;
        } catch (error) {
            this.#_events.onFailure({
                hook: collection.hooks?.onFailure,
                options,
                dataOperation: 'remove',
                context,
                error: error as Error
            });

            throw Error();
        }
    }

    /**
     * Remove a set of items (object) from a database collection
     * @param {string} collectionName The collection ID to be used
     * @param {string[]} itemsIds An array of item IDs to be removed
     * @param {NasriyaDataOptions} [options] Operation options
     * @returns {Promise<number>} The number of removed items
     */
    async bulkRemove(collectionName: string, itemsIds: string[], options: NasriyaDataOptions = { suppressAuth: false, suppressHooks: false }): Promise<number> {
        const accessType = 'delete';
        // Run prechecks
        await this.#_utils.checkArgs(collectionName, { type: 'Array', value: itemsIds }, options);
        const { collection, permission } = this.#_utils.prepareEvent({ collectionName: collectionName, accessType, options })
        const context = { collectionName: collection.name, userId: this.#_config.user.id, userRole: this.#_config.user.role }

        try {
            // Run the "Before" System Hook
            const beforeIds = await this.#_events.beforeBulkRemove({ hook: collection.hooks?.beforeBulkRemove, itemsIds, context }, options);

            const criteria = { _id: { $in: beforeIds }, ...(permission === 'Owned-Items' ? { _owner: context.userId } : {}) }
            const result = await this.#_client.db(this.#_config.database.selected).collection(collectionName).deleteMany(criteria as any);
            if (!result.acknowledged) {
                throw { message: `The data adapter is unable to remove: ${beforeIds.join(', ')}.` }
            }

            return result.deletedCount;
        } catch (error) {
            this.#_events.onFailure({
                hook: collection.hooks?.onFailure,
                options,
                dataOperation: 'bulkRemove',
                context,
                error: error as Error
            });

            throw Error();
        }
    }

    /**
     * Update a single item (object) in a database collection
     * @param {string} collectionName The collection ID to be used
     * @param {Item} item The item to be updated
     * @param {NasriyaDataOptions} [options] Operation options
     * @returns {Promise<string>} The ID of the updated item
     */
    async update(collectionName: string, item: Item, options: NasriyaDataOptions = { suppressAuth: false, suppressHooks: false }): Promise<string> {
        const accessType = 'modify';
        // Run prechecks
        await this.#_utils.checkArgs(collectionName, { type: 'Object', value: item }, options);
        const { collection, permission } = this.#_utils.prepareEvent({ collectionName: collectionName, accessType, options })
        const context = { collectionName: collection.name, userId: this.#_config.user.id, userRole: this.#_config.user.role }

        try {
            // Run the "Before" System Hook
            const beforeItem = await this.#_events.beforeUpdate({ hook: collection.hooks?.beforeUpdate, item, context }, options);
            const finalItem = this.#_utils.validateItemSchema(beforeItem, collection.schema, 'Update');

            const criteria = { _id: finalItem._id, ...(permission === 'Owned-Items' ? { _owner: context.userId } : {}) }
            const result = await this.#_client.db(this.#_config.database.selected).collection(collectionName).updateOne(criteria as any, { $set: item });
            if (!result.acknowledged) {
                throw new Error(`The data adapter is unable to update ${finalItem._id}.`)
            }

            // Run the "After" System Hook
            const afterItemId = await this.#_events.afterUpdate({ hook: collection.hooks?.afterUpdate, itemId: finalItem._id as string, context }, options);
            return afterItemId;
        } catch (error) {
            this.#_events.onFailure({
                hook: collection.hooks?.onFailure,
                options,
                dataOperation: 'update',
                context,
                error: error as Error
            });

            throw Error();
        }
    }

    /**
     * Update a set of items (objects) in a database collection
     * @param {string} collectionName The collection ID to be used
     * @param {Item[]} items The items to be updated
     * @param {NasriyaDataOptions} [options] Operation options
     * @returns {Promise<number>} The number of updated items
     */
    async bulkUpdate(collectionName: string, items: Item[], options: NasriyaDataOptions = { suppressAuth: false, suppressHooks: false }): Promise<number> {
        const accessType = 'modify';
        // Run prechecks
        await this.#_utils.checkArgs(collectionName, { type: 'Array', value: items }, options);
        const { collection, permission } = this.#_utils.prepareEvent({ collectionName: collectionName, accessType, options })
        const context = { collectionName: collection.name, userId: this.#_config.user.id, userRole: this.#_config.user.role }

        try {
            // Run the "Before" System Hook
            const beforeItems = await this.#_events.beforeBulkUpdate({ hook: collection.hooks?.beforeBulkUpdate, items, context }, options);
            const finalItems = beforeItems.map(beforeItem => this.#_utils.validateItemSchema(beforeItem, collection.schema, 'Update'));

            const operations = structuredClone(finalItems).map(item => {
                return {
                    updateOne: {
                        filter: { _id: item._id, ...(permission === 'Owned-Items' ? { _owner: context.userId } : {}) },
                        update: { $set: item },
                        upsert: false
                    }
                }
            })

            const result = await this.#_client.db(this.#_config.database.selected).collection(collectionName).bulkWrite(operations as any)
            if (!result.isOk()) {
                throw {
                    message: `The data adapter is unable to bulk update:\n${finalItems.map(i => i._id).join('\n')}\n.`,
                    errors: result.hasWriteErrors() ? result.getWriteErrors() : 'Unknown Error'
                }
            }

            return result.modifiedCount;
        } catch (error) {
            this.#_events.onFailure({
                hook: collection.hooks?.onFailure,
                options,
                dataOperation: 'bulkUpdate',
                context,
                error: error as Error
            });

            throw Error();
        }
    }

    /**
     * Save (insert/update) a single item (object) in a database collection.
     * 
     * **Notes:**
     * 
     * - The user running this operation must have a `modify` permission on the collection. If the user
     * doesn't have `modify` permissions the promise will be rejected.
     * 
     * - If items are found to be exist in the collection, the `modify` permission will be enough to
     * **update** the items, however, if items were missing from the collection and an **insert**
     * operation is needed, the user must also have the `write` permission on the collection.
     * 
     * - If the collection's permissions for `modify` operations are set to `MemberAuthor`, 
     * only the items which the user owns will be updated.
     * 
     * - You should only use the `save` method if you're not sure whether the item you want to save
     * exists or not since this operation is technically slower than its counterpart. Use the ({@link insert})
     * or ({@link update}) methods whenever possible.
     * @param {string} collectionName The collection ID to be used
     * @param {Item} item The item to be saved
     * @param {NasriyaDataOptions} [options] Operation options
     * @returns {Promise<SaveResult>} The result of the operation
     */
    async save(collectionName: string, item: Item, options: NasriyaDataOptions = { suppressAuth: false, suppressHooks: false }): Promise<SaveResult> {
        const accessType = 'modify';
        // Run prechecks
        await this.#_utils.checkArgs(collectionName, { type: 'Object', value: item }, options);
        const { collection, permission } = this.#_utils.prepareEvent({ collectionName: collectionName, accessType, options })
        const context = { collectionName: collection.name, userId: this.#_config.user.id, userRole: this.#_config.user.role }

        try {
            const exist = await this.#_helpers.checkExistance(this.#_config.database.selected, collectionName, item?._id);
            const writePermission = options?.suppressAuth === true ? 'Allowed' : exist === true ? null : this.#_utils.authUser(collection.permissions?.write);
            if (writePermission === 'Denied') { throw `Access Denied: The current user (${context.userId}) does not have ${'write'.toUpperCase()} permissions on the ${collection.name} collection` }

            // Run the "Before" System Hook
            const beforeItem = exist ? this.#_helpers.validateUpdateItem(item) : this.#_helpers.validateInsertItem(item, context.userId);
            this.#_utils.validateItemSchema(beforeItem, collection.schema, exist ? 'Update' : 'Insert');

            const criteria = { _id: beforeItem._id } as any
            if (exist) {
                if (permission === 'Owned-Items') { criteria._owner = context.userId }
            } else {
                if (writePermission === 'Owned-Items') { criteria._owner = context.userId }
            }

            const result = await this.#_client.db(this.#_config.database.selected).collection(collectionName).updateOne(criteria, { $set: beforeItem }, { upsert: exist ? false : true });
            if (!result.acknowledged) {
                throw new Error(`The data adapter is unable to save ${exist ? beforeItem._id : 'new item'}.`)
            }

            return {
                operation: exist ? 'Update' : 'Insert',
                id: exist ? beforeItem._id as any : result.upsertedId?.toString()
            }
        } catch (error) {
            this.#_events.onFailure({
                hook: collection.hooks?.onFailure,
                options,
                dataOperation: 'save',
                context,
                error: error as Error
            });

            throw Error();
        }
    }


    /**
     * Save (insert/update) a set of items (objects) in a database collection
     * 
     * **CAUTION:** Due to limitations with the **MongoDB** driver, the `updated` array may not be accurate, and might
     * be dropped in future updates.
     * 
     * **Notes:**
     * 
     * - The user running this operation must have a `modify` permission on the collection. If the user
     * doesn't have `modify` permissions the promise will be rejected.
     * 
     * - If items are found to be exist in the collection, the `modify` permission will be enough to
     * **update** the items, however, if items were missing from the collection and an **insert**
     * operation is needed, the user must also have the `write` permission on the collection.
     * 
     * - If the collection's permissions for `modify` operations are set to `MemberAuthor`, 
     * only the items which the user owns will be updated.
     * 
     * - You should only use the `bulkSave` method if you're not sure whether the items you want to save
     * exist or not since this operation is technically slower than its counterpart. Use the ({@link bulkInsert})
     * or ({@link bulkUpdate}) methods whenever possible.
     * @param {string} collectionName The collection ID to be used
     * @param {Item[]} items The items to be saved
     * @param {NasriyaDataOptions} [options] Operation options
     * @returns {Promise<BulkSaveResult>} BulkSaveResult
     */
    async bulkSave(collectionName: string, items: Item[], options: NasriyaDataOptions = { suppressAuth: false, suppressHooks: false }): Promise<BulkSaveResult> {
        const accessType = 'modify';
        // Run prechecks
        await this.#_utils.checkArgs(collectionName, { type: 'Array', value: items }, options);
        const { collection, permission } = this.#_utils.prepareEvent({ collectionName: collectionName, accessType, options })
        const context = { collectionName: collection.name, userId: this.#_config.user.id, userRole: this.#_config.user.role }

        try {
            const { toUpdate, toInsert } = await this.#_helpers.checkItemsExistance(this.#_config.database.selected, collectionName, items);
            const writePermission = options?.suppressAuth === true ? 'Allowed' : toInsert.length > 0 ? this.#_utils.authUser(collection.permissions?.write) : null;
            if (writePermission === 'Denied') { throw `Access Denied: The current user (${context.userId}) does not have ${'write'.toUpperCase()} permissions on the ${collection.name} collection` }

            // Validating items' default properties
            const [beforeUpdate, beforeInsert] = await Promise.all([
                toUpdate.map(updateItem => this.#_helpers.validateUpdateItem(updateItem)),
                toInsert.map(insertItem => this.#_helpers.validateInsertItem(insertItem, context.userId))
            ])

            // Validating items against the collection schema
            beforeUpdate.map(item => this.#_utils.validateItemSchema(item, collection.schema, 'Update'));
            beforeInsert.map(item => this.#_utils.validateItemSchema(item, collection.schema, 'Insert'));

            // Construct the update operations
            const updateOps = structuredClone(beforeUpdate).map(item => {
                return {
                    updateOne: {
                        filter: { _id: item._id, ...(permission === 'Owned-Items' ? { _owner: context.userId } : {}) },
                        update: { $set: item },
                        upsert: false
                    }
                }
            })

            // Construct the insert operations
            const insertOps = structuredClone(beforeInsert).map(item => {
                return {
                    insertOne: {
                        document: item
                    }
                }
            })

            const result = await this.#_client.db(this.#_config.database.selected).collection(collectionName).bulkWrite([...updateOps, ...insertOps] as any)

            let operation: 'Mixed' | 'Update' | 'Insert';
            if (updateOps.length > 0 && insertOps.length > 0) {
                operation = 'Mixed'; // Both update and insert operations occurred
            } else if (updateOps.length > 0) {
                operation = 'Update'; // Only update operations occurred
            } else if (insertOps.length > 0) {
                operation = 'Insert'; // Only insert operations occurred
            } else {
                operation = 'Mixed';
            }

            return {
                operation: operation,
                insertedCount: result.upsertedCount,
                updatedCount: result.modifiedCount,
                inserted: Object.values(result.insertedIds),
                updated: beforeUpdate.map(i => i._id) as string[]
            }
        } catch (error) {
            this.#_events.onFailure({
                hook: collection.hooks?.onFailure,
                options,
                dataOperation: 'bulkSave',
                context,
                error: error as Error
            });

            throw Error();
        }
    }

    /**
     * Get the `MongoDB` client for custom operations 
     * @returns {MongoClient}
     */
    get MongoClient(): MongoClient { return this.#_client }

    /**
     * Get the client authorization
     * @returns {'User'|'System'}
     */
    get authorization(): 'User' | 'System' { return this.#_config.authorization }

    /**
     * Get a list the databases by {@link NasriyaData.defineDatabase}
     * @returns {DatabaseDefinition[]}
     */
    get databases(): DatabaseDefinition[] { return NasriyaData.databases }

    /**Create aggregate expressions */
    get aggExps(): Expressions { return aggExps }

    /**
     * Change the selected database that will be used in operations
     * @param {string} [name] Pass the database name to be used. Or pass nothing or null to use the default database
     * @returns {NasriyaData}
     */
    db(name: string): NasriyaDataClient {
        if (name === null || name === undefined) {
            this.#_config.database.selected = this.#_config.database.default;
            return this;
        }

        const database = databaseManager.getDatabase(name, { caseSensitivity: 'ignore' });
        if (!database) { throw `The database ${name} that you selected is not defined in the NasriyaData` }
        this.#_config.database.selected = database.name;
        return this;
    }
}

export default NasriyaDataClient;