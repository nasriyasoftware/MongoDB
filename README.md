[![N|Solid](https://static.wixstatic.com/media/72ffe6_da8d2142d49c42b29c96ba80c8a91a6c~mv2.png)](https://nasriya.net)
# MongoDB.
[![Static Badge](https://img.shields.io/badge/license-Free_(Restricted)-blue)](https://github.com/nasriyasoftware/MongoDB?tab=License-1-ov-file) ![Repository Size](https://img.shields.io/github/repo-size/nasriyasoftware/MongoDB.svg) ![Last Commit](https://img.shields.io/github/last-commit/nasriyasoftware/MongoDB.svg) [![Status](https://img.shields.io/badge/Status-Stable-green.svg)](link-to-your-status-page)
##### Visit us at [www.nasriya.net](https://nasriya.net).

A MongoDB client with [schemas](#collection-schemas), [data-hooks](#collection-hooks), [permissions](#collection-permissions), and more.

Made with ❤️ in **Palestine** 🇵🇸

> [!IMPORTANT]
> 🌟 **Support Our Open-Source Development!** 🌟
> We need your support to keep our projects going! If you find our > work valuable, please consider contributing. Your support helps us > continue to develop and maintain these tools.
> 
> **[Click here to support us!](https://fund.nasriya.net/)**
> 
> Every contribution, big or small, makes a difference. Thank you for > your generosity and support!
> 
___
## 📚 Full Documentation
- [Getting Started](#getting-started).
  - Installation.
  - Importing.
  - [Preparing the Environment](#preparing-the-environment).
    - [Defining Databases and Collections](#defining-databases-and-collections).
    - [Creating & Using Clients](#creating--using-clients).
  - [Advanced Collection Typing (TypeScript)](#advanced-collection-typing-typescript).
- [CRUD Operations](#crud-operations).
  - [➕ Creating Data](#-creating-data).
  - [🔍 Reading Data](#-reading-data).
    - [Getting an item](#getting-an-item).
    - [Building & Executing queries](#querying-data)
  - [📝 Updating Data](#-updating-data).
  - [🗑️ Deleting Data](#️-deleting-data).
- [Upcoming Features](#upcoming-features)
- [Error Handling]().
___
## Getting Started

### Installation
```shell
npm i @nasriya/mongodb
```

### Importing
Import in **ESM** modules:
```js
import mongodb from '@nasriya/mongodb';
```

Import in **CommonJS (CJS)**
```js
const mongodb = require('@nasriya/mongodb').default;
```

### Preparing the Environment

#### Defining Databases and Collections
You can define databases and collections using the `defineDatabase` method. Here’s an example of how to define a simple database setup:

```js
mongodb.defineDatabase({
    name: 'Auth',
    collections: [{ name: 'Passwords' }, { name: 'Sessions' }]
});

mongodb.defineDatabase({
    name: 'Blog',
    collections: [{ name: 'Posts' }, { name: 'Comments' }]
})
```
##### More Details
For advanced features like defining schemas, permissions, and more, refer to the [Defining Databases](<./docs/Preparing the Environment/defining-databases.md>) page.

#### Defining Connections
Our **MongoDB** driver makes it easy to manage cluster connections by defining it once, and use it simply by referencing its name when creating a client.

Connections are defined using the `defineConnection` method.

```ts
defineConnection(name: string, connectionString: string): string
```

Example:
```js
const localServer = mongodb.defineConnection('localServer', 'mongodb://localhost:27017');

console.log(localServer); // ⇨ 'localServer'
```
You can see that the `defineConnection()` method returns the connection name, so you can use it directly when [creating clients](./docs/creating-clients.md), or you can use the name instead.

#### Creating & Using Clients
Our MongoDB driver allows you to create flexible clients for different clusters or users, providing secure and efficient access to your databases.

##### Basic Client Creation
To create a client, you need to specify the connection name using the `createClient` method. The `connection` property is required.
```js
const client = mongodb.createClient({ name: 'LocalServer' });
```

##### Authorization Levels
You can set the authorization level for the client:
- `System`: Bypasses all collection-level permissions.
- `User`: Enforces collection-level permissions based on the user’s role and ID.

```js
const systemClient = mongodb.createClient({
    name: 'LocalServer', 
    authorization: 'System'
});

const userClient = mongodb.createClient({
    name: 'LocalServer', 
    authorization: 'User',
    user: { id: 'userId', role: 'Member', loggedIn: true }
});

const userClient2 = mongodb.createClient({
    name: 'LocalServer', 
    authorization: 'User',
    user: { id: 'userId', role: 'Member', loggedIn: true },
    defaultDatabase: 'Members'
});
```
If you didn't specify a default database when creating the client, or if you wish to switch between databases during runtime, you can easily set the database to use like this:
```js
// Switch or specify a database after creating the client
client.db('Auth');
```
This method allows you to dynamically change the database context for your operations. You can now perform actions like querying, inserting, or updating documents within the specified Auth database, without having to recreate the client.

**Note:** If you haven't set a default database during client initialization, calling client.db() is required before making database operations.

For more details on creating clients, see [Creating Clients](./docs/creating-clients.md).

### Advanced Collection Typing (TypeScript)
To enable full type-safety and autocomplete when working with your collections, you can define your own interfaces by extending the base `CollectionItem` type.

All items created **and** returned by this adapter are based on the `CollectionItem` interface:

```ts
/** Represents an item in a collection. */
interface CollectionItem {
    /** The ID of the item. */
    _id: string;
    /** The date this item was created at. */
    _createdDate: Date;
    /** The date this item was last updated at. */
    _updatedDate: Date;
    /** The ID of the owner. */
    _owner: string;
    /** Additional properties */
    [key: string]: any;
}
```

You can create your own collection interfaces by extending this base interface:
```ts
import { CollectionItem } from '@nasriya/mongodb';

interface UserItem extends CollectionItem {
    name: string;
    email: string;
}
```

Then use it with your collection like this:
```ts
const user: UserItem = await client.getItem('Members', 'userId');
```
This helps prevent mistakes, enables richer development tooling, and makes your data layer more robust.
___
### CRUD Operations
##### NasriyaDataOptions
Before we dive into each of the CRUD operations, it's important to understand the `NasriyaDataOptions` interface, which can be used across various operations to customize their behavior.

```ts
/** Options for data operations. */
export interface NasriyaDataOptions {
    /** Prevents permission checks from running for the operation. Defaults to `false`. */
    suppressAuth?: boolean;
    /** Prevents hooks from running for the operation. Defaults to `false`. */
    suppressHooks?: boolean;
}
```
Properties:
- `suppressAuth`:
  - If set to `true`, this option will skip any authentication or authorization checks that would normally be run for the operation. This is useful when you want to perform an operation without enforcing the usual security measures.
  - Defaults to `false`.
- `suppressHooks`:
  - If set to `true`, this option will prevent any hooks (e.g., pre-insert or post-insert hooks) from running during the operation. This is useful when you want to bypass custom logic that might be applied during these operations.
  - Defaults to `false`.

These options can be passed to any CRUD operation where you want to modify the default behavior, such as `insert`, `bulkInsert`, `find`, etc.

#### ➕ Creating Data
To add new items to a collection, you can use the `insert` or `bulkInsert` methods provided by the client. These methods allow you to insert a single item or multiple items into a collection, respectively.

###### **Insert a Single Item**
```ts
insert(collectionName: string, item: Item, options?: NasriyaDataOptions): Promise<CollectionItem>;
```
The `insert` method is used to insert a single item into a collection. Here's how you can use it:

Example:
```js
client.insert('Members', { name: 'John Doe', email: 'john.doe@example.com' });
```

**Parameters:**
- `collectionName`: The name of the collection where the item will be inserted (e.g.,   `Members`).
- `item`: The object you want to insert. This should conform to the collection's item   interface(e.g., `CollectionItem`).
- `options`: Optional [NasriyaDataOptions](#nasriyadataoptions) options for the operation.

**Returns:** A promise that resolves to the inserted `CollectionItem`, which includes the unique`_id` of the item and other metadata (like `_createdDate` and  `_updatedDate`).
<br>

###### **Bulk Insert Multiple Items**
```ts
bulkInsert(collectionName: string, items: Item[], options: NasriyaDataOptions = { suppressAuth: false, suppressHooks: false }): Promise<BulkInsertResult>
```
The `bulkInsert` method allows you to insert an array of items into a collection at once, making it more efficient when dealing with large datasets.

Example:
```js
client.bulkInsert('Members', [
    { name: 'Charlie', email: 'charlie@example.com' },
    { name: 'Eve', email: 'eve@example.com' }
]);
```

**Parameters:**
- `collectionName`: The name of the collection where the items will be inserted (e.g.,   `Members`).
- `items`: An array of objects to insert. Each object should conform to the collection's it
interface.
- `options`: Optional [NasriyaDataOptions](#nasriyadataoptions) options for the operation.

**Returns:** A promise that resolves to the result of the bulk insert operation (`BulkInsertResult`), which contains details like the number of inserted items.

```ts
/** Result of a bulk insert operation. */
export interface BulkInsertResult {
    /** The inserted items. */
    items: CollectionItem[];
    /** Statistics about the operation. */
    stats: {
        /** The number of inserted items. */
        inserted: number;
        /** The number of skipped items. */
        skipped: number;
        /** The IDs of the inserted items. */
        insertedIds: string[];
        /** The IDs of the skipped items. */
        skippedIds: string[];
    };
}
``` 

Example:
```js
const result = await client.bulkInsert('Members', [
    { name: 'David', email: 'david@example.com' },
    { name: 'Zara', email: 'zara@example.com' }
]);

console.log('Bulk Insert Result:', result.stats);
console.log('Inserted Items:', result.items);
console.log('Inserted IDs:', result.stats.insertedIds);
console.log('Skipped IDs:', result.stats.skippedIds);
```

#### 🔍 Reading Data
You can retrieve data from your collections using the following methods: `getItem`, `find`, and `count`. Each method allows you to specify optional operation options using the NasriyaDataOptions.

##### Getting an item
```ts
getItem(collectionName: string, itemId: string, options?: NasriyaDataOptions): Promise<CollectionItem | null>;
```
Use getItem to retrieve a single item from a collection by its ID.

**Parameters:**
- `collectionName`: The collection ID from which to retrieve the item.
- `itemId`: The ID of the item to retrieve.
- `options`: Optional [NasriyaDataOptions](#nasriyadataoptions) options for the operation.

**Returns** `Promise<CollectionItem | null>` containing the item if it exists, or `null` if no item matches the provided ID.

Example:
```js
const member = await client.getItem('Members', 'd8a9e87b-2a3f-4f0c-b6a5-9a5364a1c2a4');

if (member) {
    console.log(member.name);
} else {
    console.log('User not found');
}
```

##### Querying Data
```ts
query(collectionName: string): DataQuery;
```
To perform advanced data queries on your collections, use the `query()` method. This returns a `DataQuery` instance, which provides powerful utilities like filtering, pagination, and data retrieval.

**Basic Example**
```js
const query = client.query('Members');
```

For advanced usage with filters and pagination, [see the full guide on building a query →](./docs/query-building.md)


##### 🚀 Executing the Query
Once you've built a query using `client.query()`, there are two primary ways to execute it:
1. Fetching the actual results – using `.find()`
   ```js
   const result = await client.query('Members')
    .filter(client.filter().eq('role', 'admin'))
    .limit(10)
    .skip(0)
    .find();
   ```
   **Returns** a promise that resolves to a `DataQuery` instance.

   **Parameters:**
   - `options`: Optional [NasriyaDataOptions](#nasriyadataoptions) options for the operation.

  <br>
2. Getting the number of matching items – using `.count()`

   ```js
   const total = await client.query('Members')
    .filter(client.filter().eq('role', 'admin'))
    .count();
   ```

   **Returns** a promise that resolves to a number.

   **Parameters:**
   - `options`: Optional [NasriyaDataOptions](#nasriyadataoptions) options for the operation.

Wants to learn how to build powerful filters?
🔗 [See the Filter Builder →](./docs/data-filter.md)

#### 📝 Updating Data
You can update records in your database using four different methods:

- `update`: Update a single item that must already exist.
- `bulkUpdate`: Update multiple items that must already exist.
- `save`: Create or update a single item — more flexible.
- `bulkSave`: Create or update multiple items — more flexible.

##### 🧩 Understanding the Difference
| Method       | Requires `_id` | Fails if item doesn't exist | Can create new item |
| ------------ | -------------- | --------------------------- | ------------------- |
| `update`     | ✅ Yes          | ✅ Yes                       | ❌ No                |
| `bulkUpdate` | ✅ Yes          | ✅ Yes                       | ❌ No                |
| `save`       | ❌ Optional     | ❌ No                        | ✅ Yes               |
| `bulkSave`   | ❌ Optional     | ❌ No                        | ✅ Yes               |

- Use `update` / `bulkUpdate` when you're sure the items already exist.
- Use `save` / `bulkSave` when you want to either insert or update items as needed.

##### Updating a Single Item with `update()`
```js
await client.update('Members', {
    _id: 'abc123',
    name: 'Ahmad Nasriya'
});
```
**Parameters:**
- `collectionName`: The collection ID to use.
- `item`: An item that must contain a valid `_id`.
- `options`: Optional [NasriyaDataOptions](#nasriyadataoptions) options for the operation.
<br>

##### Updating Multiple Items with `bulkUpdate()`
```js
await client.bulkUpdate('Members', [
    { _id: 'id1', name: 'John' },
    { _id: 'id2', name: 'Jane' }
]);
```
**Parameters:**
- `collectionName`: The collection ID to use.
- `items`: An array of items that must each contain a valid `_id`.
- `options`: Optional [NasriyaDataOptions](#nasriyadataoptions) options for the operation.
<br>

##### Saving a Single Item with `save()`
```js
await client.save('Members', {
    name: 'Ahmad Nasriya',
    email: 'me@nasriya.com'
});
```
**Parameters:**
- `collectionName`: The collection ID to use.
- `item`: An item that may or may not include an `_id`.
- `options`: Optional [NasriyaDataOptions](#nasriyadataoptions) options for the operation.
<br>

##### Saving Multiple Items with `bulkSave()`
```js
await client.bulkSave('Members', [
    { name: 'Ali' },                            // Insert
    { _id: 'id3', name: 'Updated Member' }      // Update
]);
```
**Parameters:**
- `collectionName`: The collection ID to use.
- `items`: Array of items to save — new ones will be inserted, existing ones updated.
- `options`: Optional [NasriyaDataOptions](#nasriyadataoptions) options for the operation.
<br>

#### 🗑️ Deleting Data
To delete items from your database, you can use:
- `remove`: Delete a single item by its ID.
- `bulkRemove`: Delete multiple items using their IDs.

##### Deleting a Single Item with `remove()`
```js
await client.remove('Members', 'abc123');
```
**Parameters:**
- `collectionName`: The collection ID to use.
- `itemId`: The `_id` of the item to remove.
- `options`: Optional [NasriyaDataOptions](#nasriyadataoptions) options for the operation.
<br>

##### Deleting Multiple Items with `bulkRemove()`
```js
await client.bulkRemove('Members', ['id1', 'id2', 'id3']);
```
**Parameters:**
- `collectionName`: The collection ID to use.
- `itemIds`: An array of item `_id`s to remove.
- `options`: Optional [NasriyaDataOptions](#nasriyadataoptions) options for the operation.

___
## 🚀 Upcoming Features

- [Geographically Distributed Databases & Failover](./docs/Upcoming%20Features/distributed-database-architecture.md).
- [Built-in Caching & Cache Broker Integration](./docs/Upcoming%20Features/caching.md).

___
## ⚠️ Error Handling (Coming Soon)
Error handling is an important part of any robust system, and we are working on implementing a comprehensive error handling mechanism. In the near future, errors will be communicated through specific error codes and detailed messages, making it easier for developers to understand and address issues in their applications.

Stay tuned for updates on how errors will be managed and reported in future versions!
___
## License
Please read the license from [here](https://github.com/nasriyasoftware/MongoDB?tab=License-1-ov-file).