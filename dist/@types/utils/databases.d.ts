import type { DatabaseDefinition } from '../docs/docs';
declare class DatabaseManager {
    #private;
    /**
     * Add a new database
     * @param {DatabaseDefinition} database The new database
     * @returns {DatabaseDefinition[]} The updated list
     */
    add(database: DatabaseDefinition): DatabaseDefinition[];
    /**
     * Get a database object based on a name
     * @param {string} name The name of the database
     * @param {{ caseSensitivity: 'ignore' }} [options]
     * @returns {DatabaseDefinition|null} `DatabaseDefinition` or `null` if the database name didn't match any of the defined databases
     */
    getDatabase(name: string, options?: {
        caseSensitivity: 'ignore';
    }): DatabaseDefinition | null;
    /**
     * List all saved databases
     * @returns {DatabaseDefinition[]}
     */
    get list(): DatabaseDefinition[];
}
declare const _default: DatabaseManager;
export default _default;
