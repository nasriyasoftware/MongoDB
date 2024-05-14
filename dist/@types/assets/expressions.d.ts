import type { GeoNearOptions, GeoWithinOptions, GeoIntersectsOptions } from '../docs/docs';
export declare class Expressions {
    #private;
    /**
     * Create a `$sum` expression
     * @param {string|Object} expression The field to sum or an object with custom sum logic
     * @returns {Object} The $sum expression
     * @example expressions.sum('field') // { $sum: '$field' }
     */
    sum(expression: string | object): object;
    /**
     * Create a `$avg` expression
     * @param {string|Object} expression The field to average or an object with custom average logic
     * @returns {Object} The $avg expression
     * @example expressions.average('field') // { $avg: '$field' }
     */
    average(expression: string | object): object;
    /**
     * Create a `$min` expression
     * @param {string|Object} expression The field to find the minimum value or an object with custom logic
     * @returns {Object} The $min expression
     * @example expressions.min('field') // { $min: '$field' }
     */
    min(expression: string | object): object;
    /**
     * Create a `$max` expression
     * @param {string|Object} expression The field to find the maximum value or an object with custom logic
     * @returns {Object} The $max expression
     * @example expressions.max('field') // { $max: '$field' }
     */
    max(expression: string | object): object;
    /**
     * Create a `$first` expression
     * @param {string|Object} expression The field to get the first value of or an object with custom logic
     * @returns {Object} The $first expression
     * @example expressions.first('field') // { $first: '$field' }
     */
    first(expression: string | object): object;
    /**
     * Create a `$last` expression
     * @param {string|Object} expression The field to get the last value of or an object with custom logic
     * @returns {Object} The $last expression
     * @example expressions.last('field') // { $last: '$field' }
     */
    last(expression: string | object): object;
    /**
     * Create a `$addToSet` expression
     * @param {string|Object} expression The field to add to the set or an object with custom logic
     * @returns {Object} The $addToSet expression
     * @example expressions.addToSet('field') // { $addToSet: '$field' }
     */
    addToSet(expression: string | object): object;
    /**
     * Create a `$push` expression
     * @param {string|Object} expression The field to push into an array or an object with custom logic
     * @returns {Object} The $push expression
     * @example expressions.push('field') // { $push: '$field' }
     */
    push(expression: string | object): object;
    /**
     * Create a `$multiply` expression
     * @param {string|Object} expression The field to multiply or an object with custom logic
     * @returns {Object} The $multiply expression
     * @example expressions.multiply('field') // { $multiply: '$field' }
     */
    multiply(expression: string | object): object;
    /**
     * Create a `$concat` expression
     * @param {string[]} expressions The fields or strings to concatenate
     * @returns {Object} The $concat expression
     * @example expressions.concat('field1', 'field2') // { $concat: ['$field1', '$field2'] }
     */
    concat(...expressions: string[]): object;
    /**
     * Create a `$dateToString` expression
     * @param {Object} options Options for formatting the date string
     * @param {string|Object} options.date The date field or expression
     * @param {string} options.format The format string for the date
     * @returns {Object} The $dateToString expression
     * @example expressions.dateToString({ date: 'dateField', format: '%Y-%m-%d' }) // { $dateToString: { format: '%Y-%m-%d', date: '$dateField' } }
     */
    dateToString({ date, format }: {
        date: string | object;
        format: string;
    }): object;
    /**
     * Create a `$dateFromString` expression
     * @param {Object} options Options for parsing the date string
     * @param {string|Object} options.dateString The date string field or expression
     * @param {string} options.format The format string for parsing the date
     * @returns {Object} The $dateFromString expression
     * @example expressions.dateFromString({ dateString: 'dateStringField', format: '%Y-%m-%d' }) // { $dateFromString: { format: '%Y-%m-%d', dateString: '$dateStringField' } }
     */
    dateFromString({ dateString, format }: {
        dateString: string | object;
        format: string;
    }): object;
    /**
     * Create a `$substr` expression
     * @param {string|Object} expression The input string field or expression
     * @param {number} start The starting index (inclusive)
     * @param {number} [length] The number of characters to extract
     * @returns {Object} The $substr expression
     * @example expressions.substr('field', 0, 5) // { $substr: ['$field', 0, 5] }
     */
    substr(expression: string | object, start: number, length?: number): object;
    /**
     * Create a `$trim` expression
     * @param {string|Object} expression The input string field or expression
     * @returns {Object} The $trim expression
     * @example expressions.trim('field') // { $trim: { input: '$field' } }
     */
    trim(expression: string | object): object;
    /**
     * Create a `$toUpper` expression
     * @param {string|Object} expression The input string field or expression
     * @returns {Object} The $toUpper expression
     * @example expressions.toUpperCase('field') // { $toUpper: '$field' }
     */
    toUpperCase(expression: string | object): object;
    /**
     * Create a `$toLower` expression
     * @param {string|Object} expression The input string field or expression
     * @returns {Object} The $toLower expression
     * @example expressions.toLowerCase('field') // { $toLower: '$field' }
     */
    toLowerCase(expression: string | object): object;
    /**
     * Create a `$geoNear` expression for geospatial aggregation.
     * @param {GeoNearOptions} geoNearOptions Options for the $geoNear stage.
     * @returns {Object} The $geoNear expression.
     * @example const geoNearOptions = { near: { type: "Point", coordinates: [longitude, latitude] }, distanceField: "distance", maxDistance: 1000, query: { category: "restaurant" }, spherical: true }; expressions.geoNear(geoNearOptions);
     */
    geoNear(geoNearOptions: GeoNearOptions): object;
    /**
     * Create a `$geoWithin` expression for geospatial aggregation.
     * @param {GeoWithinOptions} geoWithinOptions Options for the $geoWithin stage.
     * @returns {Object} The $geoWithin expression.
     * @example const geoWithinOptions = { $geometry: { type: "Polygon", coordinates: [ [ [ x1, y1 ], [ x2, y2 ], [ x3, y3 ], [ x4, y4 ], [ x1, y1 ] ] ] } }; expressions.geoWithin(geoWithinOptions);
     */
    geoWithin(geoWithinOptions: GeoWithinOptions): object;
    /**
     * Create a `$geoIntersects` expression for geospatial aggregation.
     * @param {GeoIntersectsOptions} geoIntersectsOptions Options for the $geoIntersects stage.
     * @returns {Object} The $geoIntersects expression.
     * @example const geoIntersectsOptions = { $geometry: { type: "Point", coordinates: [ longitude, latitude ] } }; expressions.geoIntersects(geoIntersectsOptions);
     */
    geoIntersects(geoIntersectsOptions: GeoIntersectsOptions): object;
}
declare const _default: Expressions;
export default _default;
