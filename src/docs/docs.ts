import mongodb from 'mongodb';
import type { AfterGetItemHook, AfterInsertHook, AfterBulkInsertHook, AfterRemoveHook, AfterUpdateHook, BeforeGetItemHook, BeforeInsertHook, BeforeBulkInsertHook, BeforeRemoveHook, BeforeBulkRemoveHook, BeforeUpdateHook, BeforeBulkUpdateHook, OnFailureHook } from './hooks';
import type { HookContext } from './hooks';

export type OnFailureEvent = (args: { hook?: OnFailureHook, options?: NasriyaDataOptions, dataOperation: DataOperation, context: HookContext, error: Error }) => void


/** Options for the $geoIntersects expression. */
export interface GeoIntersectsOptions {
    /** The geometry to use for the $geoIntersects operation. */
    geometry: GeoJSON;
}

/** Options for the $geoWithin expression. */
export interface GeoWithinOptions {
    /** Specifies the geometry to use for the `$geoWithin` operation. */
    geometry: Polygon | MultiPolygon;
}

/** Options for the $geoNear aggregation stage. */
export interface GeoNearOptions {
    /** Specifies the point from which to calculate the distances. */
    near: GeoJSON["Point"] | [number, number];
    /** Specifies the name of the field that will contain the calculated distances. */
    distanceField: string;
    /** A boolean value that determines whether to use spherical geometry for calculations. */
    spherical: boolean;
    /** An optional query to filter the documents considered for proximity. */
    query?: object;
    /** Specifies the maximum distance from the `near` point to limit the results. */
    maxDistance?: number;
    /** Specifies the minimum distance from the `near` point to include in the results. */
    minDistance?: number;
    /** Specifies the maximum number of documents to return. */
    num?: number;
    /** If true, includes the location data from the `near` field in the output documents. */
    includeLocs?: boolean;
}

/** Represents the result of a single item save operation. */
export interface SaveResult {
    /** The type of operation. */
    operation: 'Update' | 'Insert';
    /** The ID of the inserted or updated item. */
    id: string;
}

/** Represents the result of a bulk save operation. */
export interface BulkSaveResult {
    /** The type of operation. */
    operation: 'Update' | 'Insert' | 'Mixed';
    /** The number of inserted items. */
    insertedCount: number;
    /** The number of updated items. */
    updatedCount: number;
    /** The IDs of the inserted items. */
    inserted: string[];
    /** The IDs of the updated items. */
    updated: string[];
}

/** Represents the result of a bulk insert operation. */
export interface BulkInsertResult {
    /** The inserted items. */
    items: CollectionItem[];
    /** Statistics about the operation. */
    stats: {
        /** The number of inserted items. */
        inserted: number;
        /** The number of skipped items. */
        skipped: number;
        /** The IDs of the inserted items. */
        insertedIds: string[];
        /** The IDs of the skipped items. */
        skippedIds: string[];
    };
}

/** Represents an item in a collection. */
export interface CollectionItem {
    /** The ID of the item. */
    _id: string;
    /** The date this item was created at. */
    _createdDate: Date;
    /** The date this item was last updated at. */
    _updatedDate: Date;
    /** The ID of the owner. */
    _owner: string;
    /** Additional properties */
    [key: string]: any;
}

/** Represents a collection item that hasen't been inserted yet */
export interface Item {
    /** The ID of the item. */
    _id?: string;
    /** The date this item was created at. */
    _createdDate?: Date;
    /** The date this item was last updated at. */
    _updatedDate?: Date;
    /** The ID of the owner. */
    _owner?: string;
    /** Additional properties */
    [key: string]: any;
}

/** Options for defining a database. */
export interface DatabaseDefinition {
    /** The database name. */
    name: string;
    /** The collections within the database. */
    collections: CollectionDefinition[];
}

/** Options for defining a collection. */
export interface CollectionDefinition {
    /** The name of the collection. */
    name: string;
    /** The collection schema. */
    schema?: Schema;
    /** Permissions for the collection. */
    permissions?: CollectionPermissions;
    /** Data hooks to run on different data operations. */
    hooks?: CollectionHooks;
}

/**Represents hooks to run on different data operations. */
export interface CollectionHooks {
    /** A hook that is triggered after a `getItem()` operation. */
    afterGetItem?: AfterGetItemHook;
    /** A hook that is triggered after an `insert()` operation. */
    afterInsert?: AfterInsertHook;
    /** A hook that is triggered after a `bulkInsert()` operation. */
    afterBulkInsert?: AfterBulkInsertHook;
    /** A hook that is triggered after a `remove()` operation. */
    afterRemove?: AfterRemoveHook;
    /** A hook that is triggered after an `update()` operation. */
    afterUpdate?: AfterUpdateHook;
    /** A hook that is triggered before a `getItem()` operation. */
    beforeGetItem?: BeforeGetItemHook;
    /** A hook that is triggered before an `insert()` operation. */
    beforeInsert?: BeforeInsertHook;
    /** A hook that is triggered before a `bulkInsert()` operation. */
    beforeBulkInsert?: BeforeBulkInsertHook;
    /** A hook that is called before a `remove()` operation. */
    beforeRemove?: BeforeRemoveHook;
    /** A hook that is called before a `bulkRemove()` operation. */
    beforeBulkRemove?: BeforeBulkRemoveHook;
    /** A hook that is triggered before an `update()` operation. */
    beforeUpdate?: BeforeUpdateHook;
    /** A hook that is triggered before a `bulkUpdate()` operation. */
    beforeBulkUpdate?: BeforeBulkUpdateHook;
    /** A hook that is triggered on any error or rejected Promise from any of the `nasriya-data` operations. */
    onFailure?: OnFailureHook;
}

/** Collection-level permissions. */
export interface CollectionPermissions {
    /** Who has `read` permissions. */
    read: Permission;
    /** Who has `write` permissions. */
    write: Permission;
    /** Who has `modify` permissions. */
    modify: Permission;
    /** Who has `delete` permissions. */
    delete: Permission;
}

/** Options for defining a client connection. */
export interface ClientDefinitionOptions {
    /** The cluster's connection string. */
    connectionString: string;
    /** The client authorization. Default: `User`. */
    authorization?: ClientAuthorization;
    /** Set a default database to be set on the client. */
    defaultDatabase?: string;
}

/** Options for creating a client. */
export interface ClientCreationOptions {
    /** The name of a defined connection. */
    connection: string;
    /** The client authorization. Default: `User`. */
    authorization?: ClientAuthorization;
    /** The user object. Omitted when the `authorization` is `'System'`. */
    user?: ClientUser;
    /** Set a default database to be set on the client. */
    defaultDatabase?: string;
}

/** Options for constructing a client. */
export interface ClientConstructorOptions {
    /** The client. */
    client: mongodb.MongoClient;
    /** The client authorization. Default: `User`. */
    authorization?: ClientAuthorization;
    /** The user object. Omitted when the `authorization` is `'System'`. */
    user?: ClientUser;
    /** Set a default database to be set on the client. */
    defaultDatabase?: string;
}

/** Represents a client user. */
export interface ClientUser {
    /** The user ID. */
    id?: string;
    /** The user role. */
    role: 'Admin' | 'Member' | 'Visitor';
    /** Whether the user is logged in or not. */
    loggedIn: boolean;
}

/** Authorization levels for a client. */
export type ClientAuthorization = 'User' | 'System';

/** Schema type definitions. */
export type SchemaType = 'String' | 'Number' | 'Object' | 'Array' | 'Date' | 'Boolean';

/** Field schema definition. */
export interface Schema {
    [key: string]: SchemaType | CustomSchema;
}

/** Custom schema definition. */
export interface CustomSchema {    
    /** The type of the field. */
    type: SchemaType | 'Any';
    /** Whether this field is required or not. Default: `false`. */
    required?: boolean;
    /** The default value of the field if no value was provided. */
    default?: any;
    /** A validity object to validate the value. */
    validity?: {
        /** A validity function that will check the provided value and return a `boolean` value. */
        handler: (value: any) => boolean;
        /** An error message to return when the `validity.handler` returns `false`. */
        message: string;
    };
}

/** Represents an event argument for a data operation. */
export interface PrepareEventArgs {
    /** The name of the collection. */
    collectionName: string;
    /** The type of access operation. */
    accessType: AccessType;
    /** Options for the data operation. */
    options: NasriyaDataOptions;
}

/** Options for data operations. */
export interface NasriyaDataOptions {
    /** Prevents permission checks from running for the operation. Defaults to `false`. */
    suppressAuth?: boolean;
    /** Prevents hooks from running for the operation. Defaults to `false`. */
    suppressHooks?: boolean;
}

/** Permissions for accessing data. */
export type Permission = 'Anyone' | 'Member' | 'MemberAuthor' | 'Admin';

/** Represents various types of data operations. */
export type DataOperation = 'query' | 'getItem' | 'insert' | 'bulkInsert' | 'remove' | 'bulkRemove' | 'save' | 'bulkSave' | 'update' | 'bulkUpdate' | 'count' | 'aggregate';
export type AccessType = 'read' | 'write' | 'modify' | 'delete';

/** Represents a GeoJSON object, which can be one of several geometry types. */
export interface GeoJSON {
    /** Represents a point geometry. */
    Point?: Point;
    /** Represents a line string geometry. */
    LineString?: LineString;
    /** Represents a polygon geometry. */
    Polygon?: Polygon;
    /** Represents a multi-point geometry. */
    MultiPoint?: MultiPoint;
    /** Represents a multi-line string geometry. */
    MultiLineString?: MultiLineString;
    /** Represents a multi-polygon geometry. */
    MultiPolygon?: MultiPolygon;
    /** Represents a geometry collection. */
    GeometryCollection?: GeometryCollection;
}

/** Represents a Point geometry in GeoJSON format. */
export interface Point {
    /** The geometry type. */
    type: 'Point';
    /** The coordinates of the point [longitude, latitude]. */
    coordinates: number[];
}

/** Represents a LineString geometry in GeoJSON format. */
export interface LineString {
    /** The geometry type. */
    type: 'LineString';
    /** The coordinates of the line string. */
    coordinates: number[][];
}

/** Represents a Polygon geometry in GeoJSON format. */
export interface Polygon {
    /** The geometry type. */
    type: 'Polygon';
    /** The coordinates of the polygon. */
    coordinates: number[][][];
}

/** Represents a MultiPoint geometry in GeoJSON format. */
export interface MultiPoint {
    /** The geometry type. */
    type: 'MultiPoint';
    /** The coordinates of the multi-point. */
    coordinates: number[][];
}

/** Represents a MultiLineString geometry in GeoJSON format. */
export interface MultiLineString {
    /** The geometry type. */
    type: 'MultiLineString';
    /** The coordinates of the multi-line string. */
    coordinates: number[][][];
}

/** Represents a MultiPolygon geometry in GeoJSON format. */
export interface MultiPolygon {
    /** The geometry type. */
    type: 'MultiPolygon';
    /** The coordinates of the multi-polygon. */
    coordinates: number[][][][];
}

/** Represents a GeometryCollection in GeoJSON format. */
export interface GeometryCollection {
    /** The geometry type. */
    type: 'GeometryCollection';
    /** An array of GeoJSON geometries. */
    geometries: GeoJSON[];
}

export type Grouping = Record<string, AggExp>;
export type AggExp = string | Record<AggExpType, string | object>;
export type AggExpType = '$sum' | '$avg' | '$min' | '$max' | '$first' | '$last' | '$addToSet' | '$push' | '$multiply' | '$concat' | '$dateToString' | '$dateFromString' | '$substr' | '$trim' | '$toUpper' | '$toLower';
export type DataBSONType = 'number' | 'string' | 'bool' | 'object' | 'array' | 'object' | 'date' | 'javascript' | 'null';
export type Projection = Record<string, 0 | 1>;
