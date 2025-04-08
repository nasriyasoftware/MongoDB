

## Creating Clients
Our **MongoDB** driver offers great flexibility to support various use cases. You can create multiple clients for different clusters, users, or operations, which can greatly increase productivity and security.

To create a client, pass an options object to the `createClient` method. The `connection` property is required, while the rest of the options are optional.

### Client Configuration Options
| Property          | Required | Description                                                                      |
| ----------------- | -------- | -------------------------------------------------------------------------------- |
| `name`            | ✅        | Specify the connection name. [Read More](/README.md#defining-connections).       |
| `authorization`   | ❌        | Set the authorization level for the client. `System` or `User`. Default: `User`. |
| `defaultDatabase` | ❌        | If not defined here, you'll need to specify it for each **CRUD** operation.      |
| `user`            | ❌        | Set the user details when the authorization level is `User`.                     |

```js
const client = mongodb.createClient({ name: 'LocalServer' });

// OR
const client = mongodb.createClient({
    name: mongodb.defineConnection('LocalServer', 'mongodb://localhost:27017')
});
```
___
### Default Database
You can specify the default database that your client will connect to via the `defaultDatabase` option. If not specified, you'll need to define the database for each **CRUD** operation.

```js
const systemClient = mongodb.createClient({
    name: 'localServer', // A name of a defined connection
    defaultDatabase: '<database_name>'
});
```

__
### Permissions & Authorizations
The **MongoDB** driver supports two levels of authorization:

- `System` Authorization:
  The System authorization level bypasses any [permissions](./Preparing%20the%20Environment/defining-databases.md#collection-permissions) your collections might have. This is typically used for system-level operations.

    ```js
    /**A client that does NOT do user-related operations */
    const systemClient = mongodb.createClient({
        name: 'localServer', // A name of a defined connection
        authorization: 'System'
    });
    ```

- `User` Authorization:
  The `User` authorization level is meant for user-specific operations. The MongoDB client will automatically enforce collection-level permissions based on the user's role.
   ```js
   router.patch('/users/<:userId>', async (request, response, next) => {
       try {
           const { userId } = request.params;
           if (!request.user.loggedIn || request.user.id !== userId) { return response.pages.unauthorized() }
   
           const dbClient = mongodb.createClient({
               name: 'localServer', // A name of a defined connection
               authorization: 'User',
               user: {
                   id: request.user.id,
                   role: request.user.role,
                   loggedIn: request.user.loggedIn
               }
           });
   
           // Safely run operations on any collection
           const user = await dbClient.getItem('Members', userId);
       } catch(error) {
           console.error(error);
           response.status(500).json({ message: 'Unable to update the user due to a server error' });
       }
   })
   ```

    In the example above:
    - The `User` authorization level ensures that only users with the correct permissions can access or modify data.
    - If the user doesn't have `read` permission on the collection or the requested resource, the `getItem` operation will be rejected.

    <br>
    By dynamically defining a database client based on user data, you can ensure that all permissions and roles are enforced. Unauthorized users cannot bypass these permissions, providing a robust security mechanism. When creating the client, integrating user-specific data such as ID, role, and login status ensures that operations are securely performed within the user’s permissions.
    <br><br>
    
    > [!TIP]
    > When performing a `read` operation using a client with `User` authorization, only records owned by the current 
    > user (i.e., where the `_owner` field matches the user ID) will be fetched.