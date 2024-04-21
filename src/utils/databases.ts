import type { DatabaseDefinition } from '../docs/docs';

class DatabaseManager {
    private databases: DatabaseDefinition[] = [];

    /**
     * Add a new database
     * @param {DatabaseDefinition} database The new database
     * @returns {DatabaseDefinition[]} The updated list
     */
    add(database: DatabaseDefinition): DatabaseDefinition[] {
        this.databases.push(database);
        return this.databases;
    }

    /**
     * Get a database object based on a name
     * @param {string} name The name of the database
     * @param {{ caseSensitivity: 'ignore' }} [options]
     * @returns {DatabaseDefinition|null} `DatabaseDefinition` or `null` if the database name didn't match any of the defined databases
     */
    getDatabase(name: string, options?: { caseSensitivity: 'ignore' }): DatabaseDefinition | null {
        return this.databases.find(i => options?.caseSensitivity === 'ignore' ? i.name.toLowerCase() === name.toLowerCase() : i.name === name) || null;
    }

    /**
     * List all saved databases
     * @returns {DatabaseDefinition[]}
     */
    get list(): DatabaseDefinition[] { return this.databases }
}

export default new DatabaseManager;