# Defining Databases

Our *MongoDB* driver allows you to define your databases and their collections, let's define one or two:
```js
mongodb.defineDatabase({
    name: 'Auth',
    collections: [{ name: 'Passwords' }, { name: 'Sessions' }]
})
```

In our example above, we defined a database `Auth` with two collections, `Passwords` and `Sessions`. But, we do more than just that, let's improve our DB definition with the following additions.

## Collection Schemas
We can improve the collection definition and validation by defining Schemas for our collections. To do that, we'll use the `schema()` method on the adapter to create and validate our schema object. While you can directly pass the schema object to the collection definition, it's recommended to use the `schema()` method for easier debugging if anything went wrong.

```js
const pswdsSchema = mongodb.schema({
    hashed: {
        type: 'String',
        required: true,
        validity: {
            message: 'The hashed value you passed is invalid',
            handler: (value): boolean => {
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
```js
mongodb.defineDatabase({
    name: 'Auth',
    collections: [{ 
        name: 'Passwords',
        schema: pswdsSchema
    }]
})
```

## Collection Permissions
You can also set the IO permissions on each collection based on user authorizations.

```js
mongodb.defineDatabase({
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

## Collection Hooks
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

```js
mongodb.defineDatabase({
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
                    throw new Error(`Unauthorized: User ${context.userId} is not allowed to perform update operations`);
                }
            }
        }
    }]
})
```

**Note:** If the `modify` permission is set to admin, any user with different roles than `Admin` will terminate the process, so you don't need the `beforeUpdate` hook defined above to achieve that, the adapter does this for you.