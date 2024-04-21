import { DatabaseDefinition, Schema, ClientCreationOptions, CollectionDefinition, SchemaType } from '../src/docs/docs';
import Client from '../src/client';
import { MongoClient } from 'mongodb';

declare class NasriyaData {
    private _clients: Record<string, MongoClient>;
    private readonly _constants: {
        schemaTypes: SchemaType[];
    };

    defineDatabase(definition: DatabaseDefinition): this;
    schema(schema: Schema): Schema;
    get databases(): DatabaseDefinition[];
    get connections(): string[];
    getDatabase(name: string, options?: { caseSensitivity: 'ignore' }): DatabaseDefinition | null;
    defineConnection(name: string, connectionString: string): string;
    createClient(options: ClientCreationOptions): Client;
}

export {
    DatabaseDefinition,
    CollectionDefinition,
    Schema
};

export default new NasriyaData();
