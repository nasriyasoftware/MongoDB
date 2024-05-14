"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class DatabaseManager {
    #_databases = [];
    /**
     * Add a new database
     * @param {DatabaseDefinition} database The new database
     * @returns {DatabaseDefinition[]} The updated list
     */
    add(database) {
        this.#_databases.push(database);
        return this.#_databases;
    }
    /**
     * Get a database object based on a name
     * @param {string} name The name of the database
     * @param {{ caseSensitivity: 'ignore' }} [options]
     * @returns {DatabaseDefinition|null} `DatabaseDefinition` or `null` if the database name didn't match any of the defined databases
     */
    getDatabase(name, options) {
        return this.#_databases.find(i => options?.caseSensitivity === 'ignore' ? i.name.toLowerCase() === name.toLowerCase() : i.name === name) || null;
    }
    /**
     * List all saved databases
     * @returns {DatabaseDefinition[]}
     */
    get list() { return this.#_databases; }
}
exports.default = new DatabaseManager;
