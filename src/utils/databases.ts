import type { DatabaseDefinition } from '../docs/docs';

class DatabaseManager {
    readonly #_databases: DatabaseDefinition[] = [];

    /**
     * Add a new database
     * @param {DatabaseDefinition} database The new database
     * @returns {DatabaseDefinition[]} The updated list
     */
    add(database: DatabaseDefinition): DatabaseDefinition[] {
        this.#_databases.push(database);
        return this.#_databases;
    }

    /**
     * Get a database object based on a name
     * @param {string} name The name of the database
     * @param {{ caseSensitivity: 'ignore' }} [options]
     * @returns {DatabaseDefinition|null} `DatabaseDefinition` or `null` if the database name didn't match any of the defined databases
     */
    getDatabase(name: string, options?: { caseSensitivity: 'ignore' }): DatabaseDefinition | null {
        return this.#_databases.find(i => options?.caseSensitivity === 'ignore' ? i.name.toLowerCase() === name.toLowerCase() : i.name === name) || null;
    }

    /**
     * List all saved databases
     * @returns {DatabaseDefinition[]}
     */
    get list(): DatabaseDefinition[] { return this.#_databases }
}

export default new DatabaseManager;