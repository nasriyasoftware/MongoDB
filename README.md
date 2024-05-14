[![N|Solid](https://static.wixstatic.com/media/72ffe6_da8d2142d49c42b29c96ba80c8a91a6c~mv2.png)](https://nasriya.net)
# MongoDB.
[![Static Badge](https://img.shields.io/badge/license-Free_(Restricted)-blue)](https://github.com/nasriyasoftware/MongoDB?tab=License-1-ov-file) ![Repository Size](https://img.shields.io/github/repo-size/nasriyasoftware/MongoDB.svg) ![Last Commit](https://img.shields.io/github/last-commit/nasriyasoftware/MongoDB.svg) [![Status](https://img.shields.io/badge/Status-Stable-green.svg)](link-to-your-status-page)
##### Visit us at [www.nasriya.net](https://nasriya.net).

A MongoDB client with [schemas](#collection-schemas), [data-hooks](#collection-hooks), [permissions](#collection-permissions), and more.
Made with ❤️ in **Palestine** 🇵🇸
___
## Quick Start Guide

### Installation
```shell
npm install nasriyasoftware/MongoDB
```

### Importing
To use the cron scheduler, you must first import the cron-manager instance:
Import in **ES6** modules:
```ts
import dbAdapter from 'nasriya-mongodb';
```

Import in **CommonJS (CJS)**
```js
const dbAdapter = require('nasriya-mongodb').default;
```

## Preparing the Environment
##### Defining Databases
Our *MongoDB* client allows you define your databases and their collections, let's define one or two:
```ts
dbAdapter.defineDatabase({
    name: 'Auth',
    collections: [{ name: 'Passwords' }, { name: 'AuthHistory' }]
})
```

In our example above, we defined a database `Auth` with two collections, `Passwords` and `AuthHistory`. But, we do more than just that, let's imporove our DB definition with the following additions.

##### Collection Schemas
We can improve the collection definition and validation by defining Schemas for our collections. To do that, we'll use the `schema()` method on the adapter to create and validate our schema object. While you can directly pass the schema object to the collection definition, it's recommended to use the `schema()` method for easier debugging if anything went wrong.

```ts
const pswdsSchema = dbAdapter.schema({
    hashed: {
        type: 'String',
        required: true,
        validity: {
            message: 'The hashed value you passed is invalid',
            handler: (value: any): boolean => {
                if (typeof value === 'string' && (value.length >=10 && value.length <= 32)) {
                    return true;
                } else {
                    return false;
                }                
            }
        }
    },
    expireAfter: {
        type: 'Number',
        default: 2.592e+9 // 30 days
    }
})
```

In our example above, we defined the `hashed` property as a `String` and set it as a required field when inserting new data. We've also set a validity handler and a validity message that will be thrown if the handler returned `false`, indicating that the value is invalid.

We also defined the `expireAfter` property as a `Number`, and set a default value of 30 days in case the user didn't provide one.

That's how the DB definition becomes:
```ts
dbAdapter.defineDatabase({
    name: 'Auth',
    collections: [{ 
        name: 'Passwords',
        schema: pswdsSchema
    }]
})
```

##### Collection Permissions
You can also set the IO permissions on each collection based on user authorizations.

```ts
dbAdapter.defineDatabase({
    name: 'Auth',
    collections: [{ 
        name: 'Passwords',
        schema: pswdsSchema,
        // Define the permissions here
        permissions: {
            read: 'Admin',
            write: 'Admin',
            modify: 'Admin',
            delete: 'Admin',
        }
    }]
})
```

Since this collection is sensitive, only admins have access to it, if other users try to access a forbidden error will be thrown.

**Note:** For added security, you should create separate clients for backend operations and user operations. Usually in the `request` handler of any server framework, you get the ID and role of members and create a client for them.

##### Collection Hooks
Collection hooks are functions or callbacks that are triggered at specific points in the lifecycle of data operations (such as insert, update, delete) on a collection or table in a database. These hooks allow developers to execute custom logic in response to these operations, enabling tasks like data validation, transformation, logging, and enforcing business rules.

The available hooks that you can use are:
| Hook Name          | Description                                                                           |
| ------------------ | ------------------------------------------------------------------------------------- |
| `afterGetItem`     | A hook that is triggered after a `getItem()` operation.                               |
| `afterInsert`      | A hook that is triggered after an `insert()` operation.                               |
| `afterBulkInsert`  | A hook that is triggered after a `bulkInsert()` operation.                            |
| `afterRemove`      | A hook that is triggered after a `remove()` operation.                                |
| `afterUpdate`      | A hook that is triggered after an `update()` operation.                               |
| `beforeGetItem`    | A hook that is triggered before a `getItem()` operation.                              |
| `beforeInsert`     | A hook that is triggered before an `insert()` operation.                              |
| `beforeBulkInsert` | A hook that is triggered before a `bulkInsert()` operation.                           |
| `beforeRemove`     | A hook that is called before a `remove()` operation.                                  |
| `beforeBulkRemove` | A hook that is called before a `bulkRemove()` operation.                              |
| `beforeUpdate`     | A hook that is triggered before an `update()` operation.                              |
| `beforeBulkUpdate` | A hook that is triggered before a `bulkUpdate()` operation.                           |
| `onFailure`        | A hook that is triggered on any error or rejected Promise from any of the operations. |

To implement and data hook, add a `hooks` property to a collection definition, and add the event handler.

```ts
dbAdapter.defineDatabase({
    name: 'Auth',
    collections: [{ 
        name: 'Passwords',
        schema: pswdsSchema,
        permissions: {
            read: 'Admin',
            write: 'Admin',
            modify: 'Admin',
            delete: 'Admin',
        },
        // Add the hooks in the object below
        hooks: {
            beforeUpdate: (item, context) => {
                if (context.userRole !== 'Admin') {
                    throw new Error(`Unauthorized: User ${context.userId} is not allowed to perform update opoerations`);
                }
            }
        }
    }]
})
```

## Creating Clients
Our *MongoDB* client offers lots of flexibilities for your needs, you can create different clients for different clusters of users, leading to increase of prodictivity.

###### Creating a Connection
Each client needs a defined connection to a cluster, and since you can create as many clients as you want, and some times you need multiple clients to be connected to the same cluster, you only need to define a collection once, and use it as many times as you want.

Let's start by defining a connection:
```ts
const localServer = dbAdapter.defineConnection('localServer', 'mongodb://localhost:27017');

console.log(localServer); // ⇨ 'localServer'
```

You can see that the `defineConnection()` method returns the connection name, so you can use it directly when creating clients, or you can use the name instead.

###### Creating a Client
To create a client, you need to pass an options object to the `createClient` method, one of which is the `connection` name. The `connection` property is required, while the rest of the options are optional.

In our example, we'll demonstrate how you can create clients in your application.

Create a `System` client. This type of client bypasses all the defined permissions, and is intended to keep track of things that are not user related.
```ts
/**A client that does NOT do user-related operations */
const systemClient = dbAdapter.createClient({
    name: 'localServer', // A name of a defined connection
    authorization: 'System'
});
```

You can also create a clinet for user operations. We'll use [HyperCloud](https://github.com/nasriyasoftware/HyperCloud) server framework to demonstrate how:

```ts
router.patch('/users/<:userId>', (request, response, next) => {
    const { userId } = request.params;
    if (!request.user.loggedIn || request.user.id !== userId) { return response.pages.unauthorized() }

    const dbClient = dbAdapter.createClient({
        name: 'localServer', // A name of a defined connection
        authorization: 'User',
        user: {
            id: request.user.id,
            role: request.user.role,
            loggedIn: request.user.loggedIn
        }
    });

    // Safely run oprations on any collection
    // ....
})
```

When defining a database client dynamically based on the user's data, the permissions and roles associated with that user are enforced directly within the client configuration. This ensures that unauthorized users cannot bypass the permissions set for their specific roles, thereby maintaining strict access control. By integrating user-specific data such as ID, role, and login status into the client creation process, you can securely perform database operations while ensuring that only authorized users can access or modify the data. This method provides a robust mechanism for safeguarding sensitive information and enforcing user-specific access policies.

## Usage
```
Documentations are being written ...
```
___
## License
Please read the license from [here](https://github.com/nasriyasoftware/MongoDB?tab=License-1-ov-file).