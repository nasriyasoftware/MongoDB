import { MongoClient } from 'mongodb';
import { BulkSaveResult, DatabaseDefinition, SaveResult, BulkInsertResult, Item, NasriyaDataOptions, CollectionItem, } from '../../src/docs/docs';
import DataFilter from '../../src/assets/filter';
import DataQuery from '../../src/assets/query';
import DataAggregate from '../../src/assets/aggregate';
import { Expressions } from '../../src/assets/expressions'
import NasriyaData from '../../adapter';

declare class NasriyaDataClient {
    /**
     * Build a new data filter
     * @returns {DataFilter}
     */
    filter(): DataFilter;

    /**
     * Creates an aggregation.
     * @param {string} collectionName The collection ID to be used
     * @returns {DataAggregate}
     */
    aggregate(collectionName: string): DataAggregate;

    /**
     * Build a query or filter
     * @param {string} collectionName The collection ID to be used
     * @returns {DataQuery}
     */
    query(collectionName: string): DataQuery;

    /**
     * Get a single item (object) from a database collection
     * @param {string} collectionName The collection ID to be used
     * @param {string} itemId The ID of the item to be retrieved
     * @param {NasriyaDataOptions} [options] Operation options
     * @returns {Promise<CollectionItem|null>} The retrieved object if the ID matched an item, or null if otherwise.
     */
    getItem(collectionName: string, itemId: string, options: NasriyaDataOptions): Promise<CollectionItem | null>;

    /**
     * Insert a single item (object) in a database collection
     * @param {string} collectionName The collection ID to be used
     * @param {Item} item The item to be inserted
     * @param {NasriyaDataOptions} [options] Operation options
     * @returns {Promise<CollectionItem>} The ID of the inserted item
     */
    insert(collectionName: string, item: Item, options: NasriyaDataOptions): Promise<CollectionItem>;

    /**
     * Bulk insert an array of items in a database collection
     * @param {string} collectionName The collection ID to be used
     * @param {Item[]} items An array of items to be inserted
     * @param {NasriyaDataOptions} [options] Operation options
     * @returns {Promise<BulkInsertResult>} The bulk insert result
     */
    bulkInsert(collectionName: string, items: Item[], options: NasriyaDataOptions): Promise<BulkInsertResult>;

    /**
     * Remove a single item (object) from a database collection
     * @param {string} collectionName The collection ID to be used
     * @param {string} itemId The ID of the item to be removed
     * @param {NasriyaDataOptions} [options] Operation options
     * @returns {Promise<string>} The ID of the removed item
     */
    remove(collectionName: string, itemId: string, options: NasriyaDataOptions): Promise<string>;

    /**
     * Remove a set of items (object) from a database collection
     * @param {string} collectionName The collection ID to be used
     * @param {string[]} itemsIds An array of item IDs to be removed
     * @param {NasriyaDataOptions} [options] Operation options
     * @returns {Promise<number>} The number of removed items
     */
    bulkRemove(collectionName: string, itemsIds: string[], options: NasriyaDataOptions): Promise<number>;

    /**
     * Update a single item (object) in a database collection
     * @param {string} collectionName The collection ID to be used
     * @param {Item} item The item to be updated
     * @param {NasriyaDataOptions} [options] Operation options
     * @returns {Promise<string>} The ID of the updated item
     */
    update(collectionName: string, item: Item, options: NasriyaDataOptions): Promise<string>;

    /**
     * Update a set of items (objects) in a database collection
     * @param {string} collectionName The collection ID to be used
     * @param {Item[]} items The items to be updated
     * @param {NasriyaDataOptions} [options] Operation options
     * @returns {Promise<number>} The number of updated items
     */
    bulkUpdate(collectionName: string, items: Item[], options: NasriyaDataOptions): Promise<number>;

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
    save(collectionName: string, item: Item, options: NasriyaDataOptions): Promise<SaveResult>;


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
    bulkSave(collectionName: string, items: Item[], options: NasriyaDataOptions): Promise<BulkSaveResult>;

    /**
     * Get the `MongoDB` client for custom operations 
     * @returns {MongoClient}
     */
    get MongoClient(): MongoClient;

    /**
     * Get the client authorization
     * @returns {'User'|'System'}
     */
    get authorization(): 'User' | 'System';

    /**
     * Get a list the databases by {@link NasriyaData.defineDatabase}
     * @returns {DatabaseDefinition[]}
     */
    get databases(): DatabaseDefinition[];

    /**Create aggregate expressions */
    get aggExps(): Expressions;

    /**
     * Change the selected database that will be used in operations
     * @param {string} [name] Pass the database name to be used. Or pass nothing or null to use the default database
     * @returns {NasriyaData}
     */
    db(name: string): NasriyaDataClient;
}

export default NasriyaDataClient;