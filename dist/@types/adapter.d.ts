import { DatabaseDefinition, Schema, ClientCreationOptions, CollectionDefinition } from './docs/docs';
import Client from './client';
declare class NasriyaData {
    #private;
    /**
     * Define a database to the list of defined databases.
     * @param {DatabaseDefinition} definition The database definitionuration
     * @throws {Error} If the value of `definition` is not a real object
     * @throws {SyntaxError} If the `definition` is missing any of the required properties
     * @throws {TypeError} If the expected type of the properties didn't match the provided values' types
     * @throws {RangeError} If the `name` value is an empty string or the `collection` array is empty
     */
    defineDatabase(definition: DatabaseDefinition): this;
    /**
     * Create a valid schema object to use it for a collection
     * @param {Schema} schema The schema object
     * @returns {Schema} If the `schema` object is valid
     */
    schema(schema: Schema): Schema;
    /**
     * Get a list of all defined databases
     * @returns {DatabaseDefinition[]}
     */
    get databases(): DatabaseDefinition[];
    /**
     * Get a list of the defined connections
     * @returns {string[]}
     */
    get connections(): string[];
    /**
     * Get a database object based on a name
     * @param {string} name The name of the database
     * @param {{ caseSensitivity: 'ignore' }} [options]
     * @returns {DatabaseDefinition} `DatabaseDefinition` or `null` if the database name didn't match any of the defined databases
     */
    getDatabase(name: string, options?: {
        caseSensitivity: 'ignore';
    }): DatabaseDefinition | null;
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
    defineConnection(name: string, connectionString: string): string;
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
    createClient(options: ClientCreationOptions): Client;
}
export { DatabaseDefinition, CollectionDefinition, Schema };
declare const _default: NasriyaData;
export default _default;
