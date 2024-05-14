import type { CollectionItem, Item } from './docs';
/**
 * A hook that is triggered after a `getItem()` operation.
 *
 * **Description:**
 *
 * Return an object or a Promise that resolves to an object from the `afterGetItem()`
 * function. The returned object will be used as the result of the call to the `getItem()`
 * function instead of the actual item found in the collection. If returning a
 * Promise, the object is used as the result, whether the Promise is fulfilled or rejected.
 *
 * If the returned value is of the wrong type, the value is ignored.
 *
 * A rejected Promise also calls the `onFailure()` hook if it has been registered.
 */
export type AfterGetItemHook = (item: CollectionItem, context: HookContext) => Promise<CollectionItem> | CollectionItem;
/**
 * A hook that is triggered after an `insert()` operation.
 *
 * **Description:**
 *
 * Return an object or a Promise that resolves to an object from
 * the `afterInsert()` function. The returned object will be used as
 * the result of the call to the `insert()` function instead of the
 * actual item inserted into the collection. If returning a Promise,
 * the object is used as the result, whether the Promise is fulfilled or rejected.
 *
 * If the returned value is of the wrong type, the value is ignored.
 *
 * A rejected Promise also calls the `onFailure()` hook if it has been registered.
 *
 * Because the `afterInsert` hook is called after the `insert()` is executed, it
 * cannot affect the item that is inserted into the collection. It can only affect
 * the item returned by `insert()`.
 */
export type AfterInsertHook = (item: CollectionItem, context: HookContext) => Promise<CollectionItem> | CollectionItem;
/**
 * A hook that is triggered after a `bulkInsert()` operation.
 *
 * **Description:**
 *
 * Return an array of objects or a Promise that resolves to an array of objects from
 * the `afterBulkInsert()` function. The returned objects will be used as
 * the result of the call to the `bulkInsert()` function instead of the
 * actual items inserted into the collection. If returning a Promise,
 * the objects are used as the result, whether the Promise is fulfilled or rejected.
 *
 * If the returned value is of the wrong type, the value is ignored.
 *
 * A rejected Promise also calls the `onFailure()` hook if it has been registered.
 *
 * Because the `afterBulkInsert` hook is called after the `bulkInsert()` is executed, it
 * cannot affect the items that are inserted into the collection. It can only affect
 * the items returned by `bulkInsert()`.
 */
export type AfterBulkInsertHook = (items: CollectionItem[], context: HookContext) => Promise<CollectionItem[]> | CollectionItem[];
/**
 * A hook that is triggered after a `bulkRemove()` operation.
 *
 * **Description:**
 *
 * Return an array of strings or a promise that resolves to an array of strings.
 * The returned strings will be used as the result of the call of the `bulkRemove` function
 * instead of the actual `itemsIds` removed from the collection. If returning a
 * Promise, the string is used as the result, whether the Promise is fulfilled or rejected.
 *
 * If the returned value is of the wrong type, the value is ignored.
 *
 * Because the `afterBulkRemove()` hook is called after the `bulkRemove()` is executed, it cannot
 * prevent the items from being removed from the collection. It can only affect the `itemsIds`
 * returned by `bulkRemove()`.
 */
export type AfterBulkRemoveHook = (items: string[], context: HookContext) => Promise<string[]> | string[];
/**
 * A hook that is triggered after a `remove()` operation.
 *
 * **Description:**
 *
 * Return a string or a Promise that resolves to a string. The returned string will be
 * used as the result of the call to the `remove()` function instead of the actual `itemId`
 * removed from the collection. If returning a Promise, the string is used as the result,
 * whether the Promise is fulfilled or rejected.
 *
 * If the returned value is of the wrong type, the value is ignored.
 *
 * A rejected Promise also calls the `onFailure()` hook if it has been registered.
 *
 * Because the `afterRemove()` hook is called after the `remove()` is executed, it cannot
 * prevent the item from being removed from the collection. It can only affect the `itemId`
 * returned by `remove()`.
 */
export type AfterRemoveHook = (itemId: string, context: HookContext) => Promise<string> | string;
/**
 * A hook that is triggered after an `update()` operation.
 *
 * **Description:**
 *
 * Return a string or a Promise that resolves to a string from the `afterUpdate()`
 * function. The returned string will be used as the result of the call to the
 * `update()` function instead of the actual ID of the item updated in the collection.
 * If returning a Promise, the string is used as the result, whether the Promise is
 * fulfilled or rejected.
 *
 * If the returned value is of the wrong type, the value is ignored.
 *
 * A rejected Promise also calls the `onFailure()` hook if it has been registered.
 *
 * Because the afterUpdate hook is called after the `update()` is executed, it cannot
 * affect the item that is being updated in the collection. It can only affect the
 * `itemId` returned by `update()`
 */
export type AfterUpdateHook = (itemId: string, context: HookContext) => Promise<string> | string;
/**
 * A hook that is triggered before a `getItem()` operation.
 *
 * **Description:**
 *
 * Return a string or a Promise that resolves to a string from the
 * `beforeGetItem()` function. The returned string will be used as
 * the `itemId` parameter for the `getItem()` operation. The item with
 * the new `itemId` will be retrieved instead of the item with the original `itemId`.
 *
 * If the returned value is of the wrong type, the value is ignored.
 *
 * A rejected Promise blocks the call to `getItem()` and also calls the
 * `onFailure()` hook if it has been registered.
 *
 * Because the `beforeGet()` hook is called before `getItem()` is executed, it can
 * affect which item is retrieved or block the `getItem()` operation entirely.
 */
export type BeforeGetItemHook = (itemId: string, context: HookContext) => Promise<string> | string;
/**
 * A hook that is triggered before an `insert()` operation.
 *
 * **Description:**
 *
 * Return an object or a Promise that resolves to an object from the `beforeInsert()`
 * function. The returned object will be inserted into the collection instead of the
 * original item passed to the `insert()` function.
 *
 * If the returned value is of the wrong type, the value is ignored.
 *
 * A rejected Promise blocks the call to `insert()` and also calls the
 * `onFailure()` hook if it has been registered.
 *
 * Because the `beforeInsert()` hook is called before `insert()` is executed,
 * it can affect the item that is inserted into the collection or block the `insert()` operation entirely.
 */
export type BeforeInsertHook = (item: Item, context: HookContext) => Promise<CollectionItem> | CollectionItem;
/**
 * A hook that is triggered before a `bulkInsert()` operation.
 *
 * **Description:**
 *
 * Return an array of objects or a Promise that resolves to an array of objects from the `beforeBulkInsert()`
 * function. The returned objects will be inserted into the collection instead of the
 * original items passed to the `bulkInsert()` function.
 *
 * If the returned value is of the wrong type, the value is ignored.
 *
 * A rejected Promise blocks the call to `bulkInsert()` and also calls the
 * `onFailure()` hook if it has been registered.
 *
 * Because the `beforeBulkInsert()` hook is called before `bulkInsert()` is executed,
 * it can affect the items that are inserted into the collection or block the `bulkInsert()` operation entirely.
 */
export type BeforeBulkInsertHook = (items: Item[], context: HookContext) => Promise<CollectionItem[]> | object[];
/**
 * A hook that is called before a `remove()` operation.
 *
 * **Description:**
 *
 * Return a string or a Promise that resolves to a string from the `beforeRemove()`
 * function. The returned string will be used as the `itemId` parameter for the
 * `remove()` operation. The item with the new `itemId` will be removed instead of
 * the item with the original `itemId`.
 *
 * If the returned value is of the wrong type, the value is ignored.
 *
 * A rejected Promise blocks the call to `remove()` and also calls the `onFailure()`
 * hook if it has been registered.
 *
 * Because the `beforeRemove()` hook is called before `remove()` is executed, it can
 * affect the item that is removed from the collection or block the `remove()` operation entirely.
 */
export type BeforeRemoveHook = (itemId: string, context: HookContext) => Promise<string> | string;
/**
 * A hook that is triggered before a `bulkRemove()` operation.
 *
 * **Description:**
 *
 * Return an array of strings or a Promise that resolves to an array of strings from the `beforeBulkRemove()`
 * function. The returned array of IDs will be removed from the collection instead of the
 * original IDs passed to the `bulkRemove()` function.
 *
 * If the returned value is of the wrong type, the value is ignored.
 *
 * A rejected Promise blocks the call to `bulkRemove()` and also calls the
 * `onFailure()` hook if it has been registered.
 *
 * Because the `beforeBulkRemove()` hook is called before `bulkRemove()` is executed,
 * it can affect the items that are inserted into the collection or block the `bulkRemove()` operation entirely.
 */
export type BeforeBulkRemoveHook = (items: string[], context: HookContext) => Promise<string[]> | string[];
/**
 * A hook that is triggered before an `update()` operation.
 *
 * **Description:**
 *
 * Return an object or a Promise that resolves to an object from
 * the `beforeUpdate()` function. The returned object will be updated
 * in the collection instead of the original item passed to the `update()` function.
 *
 * If the returned value is of the wrong type, the value is ignored.
 *
 * A rejected Promise blocks the call to `update()` and also calls the `onFailure()`
 * hook if it has been registered.
 *
 * Because the `beforeUpdate()` hook is called before the `update()` is executed, it
 * can affect the item that is updated in the collection or block the `update()` operation entirely.
 */
export type BeforeUpdateHook = (item: Item, context: HookContext) => Promise<CollectionItem> | CollectionItem;
/**
 * A hook that is triggered before a `bulkUpdate()` operation.
 *
 * **Description:**
 *
 * Return an array of objects or a Promise that resolves to an array of objects from the
 * `beforeBulkUpdate()` function. The returned objects will be updated into the collection
 * instead of the original items passed to the `bulkUpdate()` function.
 *
 * If the returned value is of the wrong type, the value is ignored.
 *
 * A rejected Promise blocks the call to `bulkUpdate()` and also calls the
 * `onFailure()` hook if it has been registered.
 *
 * Because the `beforeBulkUpdate()` hook is called before `bulkUpdate()` is executed,
 * it can affect the items that are updated into the collection or block the `bulkUpdate()` operation entirely.
 */
export type BeforeBulkUpdateHook = (items: Item[], context: HookContext) => Promise<CollectionItem[]> | CollectionItem[];
/**
 * A hook that is triggered on any error or rejected Promise from any of the `nasriya-data` operations.
 *
 * **Description:**
 *
 * The `onFailure()` hook is triggered whenever a `nasriya-data` operation or hook returns a rejected Promise or an error.
 */
export type OnFailureHook = (error: Error, context: HookContext) => void;
export interface HookContext {
    /**The ID of the collection the hook affects. */
    collectionName: string;
    /**The current site user ID. If no user is logged in to the site it may be `null`. */
    userId: string | undefined;
    /**The permissions role of the current user. */
    userRole: 'Admin' | 'Member' | 'Visitor';
}
export interface UpdateHookContext {
    /**The ID of the collection the hook affects. */
    collectionName: string;
    /**The current site user ID. If no user is logged in to the site it may be `null`. */
    userId: string | null;
    /**The permissions role of the current user. */
    userRole: 'Admin' | 'Member' | 'Visitor';
    /**The item stored in the database collection before an update or delete operation. If the user doesn't have `read` permissions, this will be `null`. */
    currentItem?: object | null;
}
