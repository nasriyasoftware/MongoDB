import type { DataBSONType } from '../../../src/docs/docs';

declare class DataFilter {
    private queryObject: Record<string, any>;

    private _utils: {
        checkProperty: (prop: string) => void;
        getFilterExpressions: (filter: object) => object[];
        bson: {
            types: string[];
            isSupportedType: (type: string) => boolean;
        };
    };

    /**
     * Refines a query or filter to match items whose specified property value is within a specified range.
     * @param {string} property 
     * @param {(string|number|Date)[]} start The beginning value of the range to match against.
     * @param {(string|number|Date)[]} end The ending value of the range to match against.
     * @throws {TypeError} If the start or end value is not a string, number, or Date instance.
     * @throws {TypeError} If the end value is not the same type as the start value.
     * @throws {RangeError} If the start value is greater than the end value.
     * @returns {DataFilter}
     */
    between(property: string, start: (string | number | Date)[], end: (string | number | Date)[]): DataFilter;

    /**
     * Refines a query or filter to match items whose specified property values equals all of the specified `value` parameters.
     * @param {string} property The property whose value will be compared with value.
     * @param {(string|number|Date|*)[]} value The values to match against.
     * @returns {DataFilter}
     */
    hasAll(property: string, value: (string | number | Date | any)[]): DataFilter;

    /**
     * Refines a query or filter to match items whose specified property value equals any of the specified `value` parameters.
     * @param {string} property The property whose value will be compared with value.
     * @param {(string|number|Date|*)[]} value The values to match against.
     * @returns {DataFilter}
     */
    hasSome(property: string, value: (string | number | Date | any)[]): DataFilter;

    /**
     * Refines a query or filter to match items whose specified property value starts with a specified string.
     * @param {string} property The property whose value will be compared with value.
     * @param {string} value The string to look for at the beginning of the specified property value.
     * @param {{caseSensitive: boolean}} [options] Search options
     * @returns {DataFilter}
     */
    startsWith(property: string, value: string, options?: { caseSensitive: boolean }): DataFilter;

    /**
     * Refines a query or filter to match items whose specified property value ends with a specified string.
     * @param {string} property The property whose value will be compared with value.
     * @param {string} value The string to look for at the beginning of the specified property value.
     * @param {{caseSensitive: boolean}} [options] Search options
     * @returns {DataFilter}
     */
    endsWith(property: string, value: string, options?: { caseSensitive: boolean }): DataFilter;

    /**
     * Refines a query or filter to match items whose specified property value contains a specified string.
     * @param {string} property The property whose value will be compared with value.
     * @param {string} value The value to match against.
     * @param {{caseSensitive: boolean}} [options] Search options
     * @returns {DataFilter}
     */
    contains(property: string, value: string, options?: { caseSensitive: boolean }): DataFilter;

    /**
     * (Equal to) Refines a query or filter to match items whose specified property value equals the specified value.
     * @param {string} property The property whose value will be compared with value.
     * @param {string|number|boolean|Date} value The value to match against.
     * @returns {DataFilter}
     */
    eq(property: string, value: string | number | boolean | Date): DataFilter;

    /**
     * (Not equal to) Refines a query or filter to match items whose specified property value does not equal the specified value.
     * @param {string} property The property whose value will be compared with value.
     * @param {string|number|boolean|Date} value The value to match against.
     * @returns {DataFilter}
     */
    ne(property: string, value: string | number | boolean | Date): DataFilter;

    /**
     * (Greater than or equal to) Refines a query or filter to match items whose specified property value is greater than or equal to the specified value.
     * @param {string} property The property whose value will be compared with value.
     * @param {string|number|Date} value The value to match against.
     * @returns {DataFilter}
     */
    gte(property: string, value: string | number | Date): DataFilter;

    /**
     * (Greater than) Refines a query or filter to match items whose specified property value is greater than the specified value.
     * @param {string} property The property whose value will be compared with value.
     * @param {string|number|Date} value The value to match against.
     * @returns {DataFilter}
     */
    gt(property: string, value: string | number | Date): DataFilter;

    /**
     * (In) Refines a query or filter to match items whose specified property value is any item from the the specified value array.
     * @param {string} property The property whose value will be compared with value.
     * @param {Array.<string|number>} value The value to match against.
     * @returns {DataFilter}
     */
    in(property: string, value: (string | number)[]): DataFilter;

    /**
     * (Not in) Refines a query or filter to match items whose specified property value is not in the the specified value array or the specified property does not exist.
     * @param {string} property The property whose value will be compared with value.
     * @param {Array.<string|number>} value The value to match against.
     * @returns {DataFilter}
     */
    nin(property: string, value: (string | number)[]): DataFilter;

    /**
     * (Less than) Refines a query or filter to match items whose specified property value is less than the specified value.
     * @param {string} property The property whose value will be compared with value.
     * @param {string|number|Date} value The value to match against.
     * @returns {DataFilter}
     */
    lt(property: string, value: string | number | Date): DataFilter;

    /**
     * (Less than or equal to) Refines a query or filter to match items whose specified property value is less than the specified value.
     * @param {string} property The property whose value will be compared with value.
     * @param {string|number|Date} value The value to match against.
     * @returns {DataFilter}
     */
    lte(property: string, value: string | number | Date): DataFilter;

    /**
     * (And) Adds an and condition to the query or filter.
     * @param {DataFilter|DataFilter[]} filter 
     * @returns {DataFilter}
     */
    and(filter: DataFilter | DataFilter[]): DataFilter;

    /**
     * (Nor) Adds a nor condition to the query or filter.
     * @param {DataFilter|DataFilter[]} filter 
     * @returns {DataFilter}
     */
    nor(filter: DataFilter | DataFilter[]): DataFilter;

    /**
     * (Or) Adds an or condition to the query or filter.
     * @param {DataFilter|DataFilter[]} filter 
     * @returns {DataFilter}
     */
    or(filter: DataFilter | DataFilter[]): DataFilter;

    /**
     * (Not) Adds a not condition to the query or filter.
     * @param {DataFilter} filter 
     * @returns {DataFilter}
     */
    not(filter: DataFilter): DataFilter;

    /**
     * (Exists) Refines a query or filter to match items that contain or do not contain a specified property, including items where the property value is null.
     * @param {string} property The property whose value will be compared with value.
     * @param {boolean} value The value to match against.
     * @returns {DataFilter}
     */
    exists(property: string, value: boolean): DataFilter;

    /**
     * (Type) Refines a query or filter to match items whose specified property value type is one of the specified array of values.
     * @param {string} property The property whose value will be compared with value.
     * @param {DataBSONType|DataBSONType[]} value 
     * @returns {DataFilter}
     */
    type(property: string, value: DataBSONType | DataBSONType[]): DataFilter;
}

export default DataFilter;
