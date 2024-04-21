import helpers from './src/utils/helpers';
import { DatabaseDefinition, Schema, ClientCreationOptions, ClientAuthorization, ClientUser, CollectionDefinition, SchemaType, CustomSchema } from './src/docs/docs';
import Client from './src/client';
import databaseManager from './src/utils/databases';
import { MongoClient, ServerApiVersion } from 'mongodb';

class NasriyaData {
    private _clients: Record<string, MongoClient> = {};
    private readonly _constants = {
        schemaTypes: ['String', 'Number', 'Object', 'Array', 'Date', 'Boolean'] as SchemaType[],
    };

    /**
     * Define a database to the list of defined databases.
     * @param {DatabaseDefinition} definition The database definitionuration
     * @throws {Error} If the value of `definition` is not a real object
     * @throws {SyntaxError} If the `definition` is missing any of the required properties
     * @throws {TypeError} If the expected type of the properties didn't match the provided values' types
     * @throws {RangeError} If the `name` value is an empty string or the `collection` array is empty
     */
    defineDatabase(definition: DatabaseDefinition): this {
        if (!helpers.isRealObject(definition)) { throw new Error(`The "defineDatabase" method expects a "definition" object to be passed, instead got ${typeof definition}`) }

        if (!('name' in definition)) { throw new SyntaxError(`The "definition" object that was passed to the "defineDatabase" method is missing the "name" property`) }
        if (typeof definition.name !== 'string') { throw new TypeError(`The type of the "name" value in the "defineDatabase(definition)" call is ${typeof definition.name}, expected a string value.`) }
        if (definition.name.length === 0) { throw new RangeError(`The value of "name" in the "defineDatabase" definition argument cannot be an empty string`) }

        const mappedD = this.databases.map(i => i.name.toLowerCase());
        if (mappedD.includes(definition.name.toLowerCase())) { throw new Error(`The database ${definition.name} is already defined`) }

        // Validate collections
        if (!('collections' in definition)) { throw new SyntaxError(`The "definition" object that was passed to the "defineDatabase" method is missing the "collections" property`) }
        if (!Array.isArray(definition.collections)) { throw new TypeError(`The type of the "collections" value in the "defineDatabase(definition)" call is ${typeof definition.collections}, expected an array`) }
        if (definition.collections.length === 0) { throw new RangeError(`The value of "collections" in the "defineDatabase" definition argument cannot be an empty array`) }

        const mappedC = definition.collections.map(i => i.name.toLowerCase());
        const uniqueC = [...new Set(mappedC)];
        if (uniqueC.length < mappedC.length) {
            throw new Error(`The provided database definition has duplicate collection names`);
        }

        for (const collection of definition.collections) {
            if (!helpers.isRealObject(collection)) { throw new TypeError(`The database (${definition.name}) was provided with an invalid collection: ${typeof collection}`) }

            try {
                // Validate collection name
                if (!('name' in collection)) { throw new SyntaxError(`One of the collections is missing the "name" property`) }
                if (typeof collection.name !== 'string') { throw new TypeError(`The type of collection's name (${collection.name}) is not a string`) }
                if (collection.name.length === 0) { throw new RangeError(`The collection name cannot be empty`) }

                // Validate schema
                if ('schema' in collection) {
                    if (!helpers.isRealObject(collection.schema) || !collection.schema) { throw new TypeError(`Expected a Schema object but instead got ${typeof collection.schema}`) }

                    // Validating the schema
                    try {
                        this.schema(collection.schema);
                    } catch (error) {
                        typeof error === 'string' ? (error = `Collection ${collection.name} Schema error: ${error}`) : typeof error?.message === 'string' ? (error.message = `Collection ${collection.name} Schema error: ${error.message}`) : null;
                        throw error;
                    }
                }

                // Validate database permissions
                if ('permissions' in collection) {
                    if (!helpers.isRealObject(collection.permissions)) { throw new TypeError(`The database (${definition.name}) was provided with an invalid type of "permissions". Expected a Permissions object but instead got ${typeof collection.permissions}`); }
                    const permissions = collection.permissions;

                    if (permissions && helpers.isRealObject(permissions)) {
                        try {

                            if (!('read' in permissions)) { throw new SyntaxError(`The "read" permission is not specified`) }
                            if (!('write' in permissions)) { throw new SyntaxError(`The "write" permission is not specified`) }
                            if (!('modify' in permissions)) { throw new SyntaxError(`The "modify" permission is not specified`) }
                            if (!('delete' in permissions)) { throw new SyntaxError(`The "delete" permission is not specified`) }

                            const possibleValues = ['Anyone', 'Member', 'MemberAuthor', 'Admin'];
                            if (!possibleValues.includes(permissions.read)) { throw new TypeError(`The "read" permission (${permissions.read}) is not a valid permission`) }
                            if (!possibleValues.includes(permissions.write)) { throw new TypeError(`The "write" permission (${permissions.write}) is not a valid permission`) }
                            if (!possibleValues.includes(permissions.modify)) { throw new TypeError(`The "modify" permission (${permissions.modify}) is not a valid permission`) }
                            if (!possibleValues.includes(permissions.delete)) { throw new TypeError(`The "delete" permission (${permissions.delete}) is not a valid permission`) }
                        } catch (error) {
                            if (typeof error === 'string') { error = `The database (${definition.name}) was provided with invalid "permissions" object: ${error}` }
                            if (typeof error?.message === 'string') { error.message = `The database (${definition.name}) was provided with invalid "permissions" object: ${error.message}` }
                            throw error;
                        }
                    }

                } else {
                    collection.permissions = { read: 'Admin', write: 'Admin', modify: 'Admin', delete: 'Admin' };
                }

                if ('hooks' in collection) {
                    /**
                     * TODO: Validate the hooks
                     */
                } else {
                    collection.hooks = {};
                }
            } catch (error) {
                if (typeof error === 'string') {
                    error = `The database (${definition.name}) was provided with an invalid collection: ${error}`;
                }
                if (typeof error?.message === 'string') {
                    error.message = `The database (${definition.name}) was provided with an invalid collection: ${error.message}`;
                }
                throw error;
            }
        }

        databaseManager.add(definition);
        return this;
    }

    /**
     * Create a valid schema object to use it for a collection
     * @param {Schema} schema The schema object
     * @returns {Schema} If the `schema` object is valid
     */
    schema(schema: Schema): Schema {
        if (!helpers.isRealObject(schema)) { throw new TypeError(`The provided schema is not a valid object`) }
        const keys = Object.keys(schema);

        const unique = [...new Set(keys.map(i => i.toLowerCase()))];
        if (unique.length < keys.length) { throw new Error(`The provided schema has duplicate property names`) }

        for (const property of keys) {
            const selectedSchema = schema[property];

            if (helpers.isCustomSchema(selectedSchema)) {
                try {
                    if (!helpers.isRealObject(selectedSchema)) { throw new TypeError(`${typeof selectedSchema} is not a valid schema type`) }

                    {
                        // Validate the schema type
                        if (!('type' in selectedSchema)) { throw new SyntaxError(`The schema type is missing`) }
                        if (typeof selectedSchema.type !== 'string') { throw new TypeError(`Expected a string value but got ${typeof selectedSchema.type}`) }
                        if (![...this._constants.schemaTypes, 'Any'].includes(selectedSchema.type)) { throw new TypeError(`The provided schema type (${selectedSchema.type}) is not a supported schema type`) }
                    }

                    {
                        // Validate the required value
                        if ('required' in selectedSchema) {
                            if (typeof selectedSchema.required !== 'boolean') { throw new TypeError(`The "required" option expects a boolean value, instead got ${typeof selectedSchema.required}`) }
                        }
                    }

                    {
                        // Validate the validity
                        if ('validity' in selectedSchema) {
                            if (helpers.isUndefined(selectedSchema.validity) || !helpers.isRealObject(selectedSchema.validity)) { throw new TypeError(`The schema "validity" option expects an object value, instead got ${typeof selectedSchema.validity}`) }
                            if (!('handler' in selectedSchema.validity)) { throw new SyntaxError(`The "schema.validity" object is missing the "handler" function`) }
                            if (!('message' in selectedSchema.validity)) { throw new SyntaxError(`The "schema.validity" object is missing the error "message"`) }

                            if (typeof selectedSchema.validity.handler !== 'function') { throw new TypeError(`The "schema.validity" expects a function to handle the validity, but instead got ${typeof selectedSchema.validity.handler}`) }
                            if (selectedSchema.validity.handler.length !== 1) { throw new SyntaxError(`The validity "handler" was provided with ${selectedSchema.validity.handler.length} parameters while 1 parameter is expected.`) }

                            if (typeof selectedSchema.validity.message !== 'string') { throw new TypeError(`The validity "message" should be a string, but instead got ${typeof selectedSchema.validity.message}`) }
                            if (selectedSchema.validity.message.length === 0) { throw new RangeError(`The validity "message" cannot be an empty string`) }
                        } else {
                            if (selectedSchema.type === 'Any') { throw new SyntaxError(`The schema type was set to "Any" but no validity was provided`) }
                        }
                    }

                    {
                        // Validate the default value
                        if ('default' in selectedSchema) {
                            switch (selectedSchema.type) {
                                case 'Array': {
                                    if (!Array.isArray(selectedSchema.default)) { throw new TypeError(`The schema has a defined "default" value but the value type did not match the schema type`) }
                                }
                                    break;

                                case 'Boolean': {
                                    if (typeof selectedSchema.default !== 'boolean') { throw new TypeError(`The schema has a defined "default" value but the value type did not match the schema type`) }
                                }
                                    break;

                                case 'Date': {
                                    if (!(selectedSchema.default instanceof Date)) { throw new TypeError(`The schema has a defined "default" value but the value type did not match the schema type`) }
                                }
                                    break;

                                case 'Number': {
                                    if (typeof selectedSchema.default !== 'number') { throw new TypeError(`The schema has a defined "default" value but the value type did not match the schema type`) }
                                }
                                    break;

                                case 'String': {
                                    if (typeof selectedSchema.default !== 'string') { throw new TypeError(`The schema has a defined "default" value but the value type did not match the schema type`) }
                                }
                                    break;

                                case 'Object': {
                                    if (!helpers.isRealObject(selectedSchema.default)) { throw new TypeError(`The schema has a defined "default" value but the value type did not match the schema type`) }
                                }
                                    break;
                            }
                        }
                    }
                } catch (error) {
                    if (typeof error === 'string') { error = `The property (${property}) was defined with an invalid schema: ${error}` }
                    if (typeof error?.message === 'string') { error.message = `The property (${property}) was defined with an invalid schema: ${error.message}` }
                    throw error;
                }
            } else {

            }


            // Check if the value is one of the defined schema types, or a custom schema
            if (typeof selectedSchema === 'string' && this._constants.schemaTypes.includes(selectedSchema)) {
                continue;
            } else {

            }
        }

        return schema;
    }

    /**
     * Get a list of all defined databases
     * @returns {DatabaseDefinition[]}
     */
    get databases(): DatabaseDefinition[] { return databaseManager.list }

    /**
     * Get a list of the defined connections
     * @returns {string[]}
     */
    get connections(): string[] { return Object.keys(this._clients) }

    /**
     * Get a database object based on a name
     * @param {string} name The name of the database
     * @param {{ caseSensitivity: 'ignore' }} [options]
     * @returns {DatabaseDefinition} `DatabaseDefinition` or `null` if the database name didn't match any of the defined databases
     */
    getDatabase(name: string, options?: { caseSensitivity: 'ignore' }): DatabaseDefinition | null {
        return databaseManager.getDatabase(name, options);
    }

    /**
     * Define a new database client. This client can be used to create clients using {@link createClient}
     * 
     * **Note:** For security reasons, make sure to store the `connectionString` string as an environmental variable.
     * @example
     * nasriyaData.defineConnection('LocalServer', 'mongodb://localhost:27017');
     * @param {string} name The name of the client. If the name is already defined the client will be overwritten.
     * @param {string} connectionString The client's connection string
     * @returns {string} The name of the connection
     */
    defineConnection(name: string, connectionString: string): string {
        try {
            if (typeof name !== 'string') { throw new TypeError(`The "defineConnection" expects a string name for the client but instead got ${typeof name}`) }
            if (name.length === 0) { throw new RangeError(`The name of the client in the "defineConnection" method cannot be empty`) }

            if (typeof connectionString !== 'string') { throw new TypeError(`The "defineConnection" expects a connectionString for the client but instead got ${typeof connectionString}`) }
            if (connectionString.length === 0) { throw new RangeError(`The connectionString of the client in the "defineConnection" method cannot be empty`) }
            if (!(connectionString.startsWith('mongodb+srv://') || connectionString.startsWith('mongodb://'))) { throw new SyntaxError(`The provided "connectionString" (${connectionString}) is not a valid MongoDB connection string`) }

            const clientOptions = {
                monitorCommands: true,
                serverApi: {
                    version: ServerApiVersion.v1,
                    strict: true,
                    deprecationErrors: true,
                },
            };

            this._clients[name] = new MongoClient(connectionString, clientOptions as any);
            return name;
        } catch (error) {
            if (typeof error === 'string') { error = `Cannot define a NasriyaData Client: ${error}` }
            if (typeof error?.message === 'string') { error.message = `Cannot define NasriyaData Client: ${error.message}` }
            throw error;
        }
    }

    /**
     * Create a new database client.
     * 
     * **Note:** You must first define a client using the {@link defineConnection} method.
     * 
     * **Example:** Use the client on the backend for non-user related operations
     * ```js
     * const client = nasriyaData.createClient({
     *      connection: 'LocalServer',
     *      authorization: 'System'
     * });
     * ```
     * **Example:** Define a connection while creating a client
     * ```js
     * const client = nasriyaData.createClient({
     *      connection: nasriyaData.defineConnection('LocalServer', 'mongodb://localhost:27017'),
     *      authorization: 'System'
     * });
     * ```
     * 
     * **Example:** Use the client in a [HyperCloud route](https://github.com/nasriyasoftware/HyperCloud?tab=readme-ov-file#hypercloud-built-in-user).
     * ```js
     * // Use the client for user specific operations
     * router.use('*', (request, response, next) => {
     *      const client = nasriyaData.createClient({
     *          connection: 'RemoteServer',
     *          authorization: 'User',
     *          user: request.user
     *      });
     * })
     * ```
     * @example
     * const client = nasriyaData.createClient({
     *      connection: 'Auth',
     *      authorization: 'System'
     * });
     * @param {ClientCreationOptions} options The connection string to your cluster. If not provided, the localhost default will be used
     * @returns {Client}
     */
    createClient(options: ClientCreationOptions): Client {
        try {
            const constructorOptions = {
                client: null as unknown as MongoClient,
                authorization: null as unknown as ClientAuthorization,
                user: { loggedIn: false, id: null, role: 'Visitor' } as unknown as ClientUser,
                defaultDatabase: null as unknown as string
            }

            if (!helpers.isRealObject(options)) { throw new SyntaxError(`The "createClient" method expects an options object but got ${typeof options}`) }

            if ('connection' in options) {
                if (typeof options.connection !== 'string') { throw new TypeError(`The provided "connection" value must be a string value, instead got ${typeof options.connection}`) }
                if (!(options.connection in this._clients)) { throw `The provided "connection" name (${options.connection}) is not defined. Use the "defineConnection" method to define a connection` }
                constructorOptions.client = this._clients[options.connection];
            } else {
                throw new SyntaxError(`The "createClient" options are missing the "connection" property`);
            }

            if ('authorization' in options) {
                if (!(options.authorization === 'System' || options.authorization === 'User')) { throw new RangeError(`The provided "authorization" (${options.authorization}) is not a valid authorization type`) }
                constructorOptions.authorization = options.authorization;
            }

            if (constructorOptions.authorization === 'User') {
                if (!('user' in options)) { throw new SyntaxError(`The client options are missing the "user" object. The "user" object is required when the "authorization" level is "User"`) }
                if (!helpers.isRealObject(options.user)) { throw new TypeError(`The provided "user" value is not a valid. Expected an object but got ${typeof options.user}`) }

                if (helpers.isUndefined(options.user) || !('loggedIn' in options.user)) { throw new SyntaxError(`The "user" object is missing the "loggedIn" property`) }
                if (typeof options.user.loggedIn !== 'boolean') { throw new TypeError(`The "loggedIn" property in the "user" object expected a boolean value but instead got ${typeof options.user.loggedIn}`) }
                constructorOptions.user.loggedIn = options.user.loggedIn;

                if (constructorOptions.user.loggedIn) {
                    if (!('role' in options.user)) { throw new SyntaxError(`The logged-in "user" object is missing the "role" property`) }
                    if (options.user.role === 'Visitor') { throw new SyntaxError(`The "role" property in the "user" object cannot be set to "Visitor" for logged-in users`) }
                    const roles = ['Admin', 'Member'];
                    if (!roles.includes(options.user.role)) { throw new RangeError(`The provided "user.role" (${options.user.role}) is not a valid user role`) }
                    constructorOptions.user.role = options.user.role;

                    if (!('id' in options.user)) { throw new SyntaxError(`The "user" object is missing the "id" property`) }
                    if (typeof options.user.id !== 'string') { throw new TypeError(`The "id" property in the "user" object expected a string value but instead got ${typeof options.user.id}`) }
                    if (options.user.id.length === 0) { throw new RangeError(`The provided "user.id" cannot be an empty string`) }
                    constructorOptions.user.id = options.user.id;
                }
            }

            if ('defaultDatabase' in options) {
                if (typeof options.defaultDatabase !== 'string') { throw new TypeError(`The "defaultDatabase" expected a string value but instead gpt ${typeof options.defaultDatabase}`) }
                if (options.defaultDatabase.length === 0) { throw new RangeError(`The "defaultDatabase" cannot be an empty string, it must be a database name`) }
                constructorOptions.defaultDatabase = options.defaultDatabase;
            }

            return new Client(constructorOptions);
        } catch (error) {
            throw new Error(error);
        }
    }
}

export {
    DatabaseDefinition,
    CollectionDefinition,
    Schema
}

export default new NasriyaData();