import type { DataBSONType } from '../docs/docs';
import helpers from '../utils/helpers';

class DataFilter {
    /** The query filter object */
    readonly #_queryObject: Record<string, any> = {}

    readonly #_utils = Object.freeze({
        /** @param {string} prop */
        checkProperty: (prop: string) => {
            if (typeof prop !== 'string') { throw `The used property (${prop}) is not a valid string` }
            if (prop.length === 0) { throw 'Missing or invalid property passed to the data refiner. The property cannot be an empty string' }
        },
        /**
         * Extract the expressions from a filter object
         * @param {object} filter The filter object
         * @returns {object[]} Array of expressions
         */
        getFilterExpressions: (filter: object) => {
            return Object.entries(filter).map(entry => {
                const [prop, value] = entry;
                const item: Record<string, any> = {}
                item[prop] = value;
                return item;
            })
        },
        bson: {
            types: ['number', 'string', 'bool', 'object', 'array', 'object', 'date', 'javascript', 'null'],
            /** @param {string} type */
            isSupportedType: (type: string) => this.#_utils.bson.types.includes(type)
        }
    })


    /**
     * Refines a query or filter to match items whose specified property value is within a specified range.
     * @param {string} property The property to filter by.
     * @param {string|number|Date} start The beginning value of the range to match against.
     * @param {string|number|Date} end The ending value of the range to match against.
     * @throws {TypeError} If the start or end value is not a string, number, or Date instance.
     * @throws {TypeError} If the end value is not the same type as the start value.
     * @throws {RangeError} If the start value is greater than the end value.
     * @returns {DataFilter}
     */
    between(property: string, start: string | number | Date, end: string | number | Date): DataFilter {
        this.#_utils.checkProperty(property);

        // Checking types
        const startType = start instanceof Date ? 'date' : typeof start;
        const endType = end instanceof Date ? 'date' : typeof end;
        if (!(startType === 'string' || startType === 'number' || startType === 'date')) { throw new TypeError(`Unable to use the "between" filter on the "${property}" property. The passed start value is invalid. Expected a string, number, or a Date instance as a value but instead got ${typeof start}.`) }
        if (startType !== endType) { throw new TypeError(`Unable to use the "between" filter on the "${property}" property. The passed end value is not the same type as the start value`) }

        // Validating ranges
        if (start > end) { throw new RangeError(`Unable to use the "between" filter on the "${property}" property. The start value (${startType === 'date' ? start.toString() : start}) cannot be greater than the end value (${endType === 'date' ? end.toString() : end})`) }

        // Setting the filter
        this.#_queryObject[property] = { $gte: start, $lte: end }
        return this;
    }

    /**
     * Refines a query or filter to match items whose specified property values equals all of the specified `value` parameters.
     * @param {string} property The property whose value will be compared with value.
     * @param {(string|number|Date|*)[]} value The values to match against.
     * @returns {DataFilter}
     */
    hasAll(property: string, value: (string | number | Date | any)[]): DataFilter {
        this.#_utils.checkProperty(property);
        if (!Array.isArray(value)) { throw `Unable to use the "hasAll" filter on the "${property}" property. The passed value is invalid. Expected an array as a value but instead got ${typeof value}.` }

        this.#_queryObject[property] = { $all: value }
        return this;
    }

    /**
     * Refines a query or filter to match items whose specified property value equals any of the specified `value` parameters.
     * @param {string} property The property whose value will be compared with value.
     * @param {(string|number|Date|*)[]} value The values to match against.
     * @returns {DataFilter}
     */
    hasSome(property: string, value: (string | number | Date | any)[]): DataFilter {
        this.#_utils.checkProperty(property);
        if (!Array.isArray(value)) { throw `Unable to use the "hasSome" filter on the "${property}" property. The passed value is invalid. Expected an array as a value but instead got ${typeof value}.` }

        this.#_queryObject[property] = { $in: value }
        return this;
    }

    /**
     * Refines a query or filter to match items whose specified property value starts with a specified string.
     * @param {string} property The property whose value will be compared with value.
     * @param {string} value The string to look for at the beginning of the specified property value.
     * @param {{caseSensitive: boolean}} [options] Search options
     * @returns {DataFilter}
     */
    startsWith(property: string, value: string, options?: { caseSensitive: boolean }): DataFilter {
        this.#_utils.checkProperty(property);
        this.#_queryObject[property] = new RegExp(`^${value}`, options?.caseSensitive === true ? '' : 'i');
        return this;
    }

    /**
     * Refines a query or filter to match items whose specified property value ends with a specified string.
     * @param {string} property The property whose value will be compared with value.
     * @param {string} value The string to look for at the beginning of the specified property value.
     * @param {{caseSensitive: boolean}} [options] Search options
     * @returns {DataFilter}
     */
    endsWith(property: string, value: string, options?: { caseSensitive: boolean }): DataFilter {
        this.#_utils.checkProperty(property);
        this.#_queryObject[property] = new RegExp(`${value}$`, options?.caseSensitive === true ? '' : 'i');
        return this;
    }

    /**
     * Refines a query or filter to match items whose specified property value contains a specified string.
     * @param {string} property The property whose value will be compared with value.
     * @param {string} value The value to match against.
     * @param {{caseSensitive: boolean}} [options] Search options
     * @returns {DataFilter}
     */
    contains(property: string, value: string, options?: { caseSensitive: boolean }): DataFilter {
        this.#_utils.checkProperty(property);

        const words = new Set(value.split(/\s+/).map(word => word.trim()).filter(word => word.length > 0));
        const wordRegex = Array.from(words).map(word => `\\b${word}\\b`).join('|');
        const regexFlags = options?.caseSensitive === true ? '' : 'i';

        this.#_queryObject[property] = new RegExp(wordRegex, regexFlags);
        return this;
    }

    // Comparison Operators

    /**
     * (Equal to) Refines a query or filter to match items whose specified property value equals the specified value.
     * For string values, you can optionally make the comparison case-insensitive.
     *
     * If `caseSensitive` is provided, it must be a boolean and only applies to string values.
     * Throws a `SyntaxError` if `caseSensitive` is provided for non-string values.
     *
     * @param {string} property - The property whose value will be compared with the provided value.
     * @param {string | number | boolean | Date} value - The value to match against.
     * @param {{ caseSensitive: boolean }} [options] - Optional settings object to control comparison behavior.
     * @param {boolean} [options.caseSensitive=true] - Whether the comparison should be case-sensitive (only applies to string values).
     *
     * @throws {TypeError} If options is not a plain object.
     * @throws {TypeError} If options.caseSensitive is defined but not a boolean.
     * @throws {SyntaxError} If options.caseSensitive is provided for non-string values.
     *
     * @returns {DataFilter} The current filter instance for chaining.
     *
     * @example
     * // Strict match (default)
     * filter.eq("username", "Admin");
     *
     * @example
     * // Case-insensitive string match
     * filter.eq("username", "admin", { caseSensitive: false });
     */
    eq(property: string, value: string | number | boolean | Date, options?: { caseSensitive: boolean }): DataFilter {
        this.#_utils.checkProperty(property);
        const valueIsString = typeof value === 'string';

        if (options !== undefined) {
            if (!helpers.isRealObject(options)) { throw new TypeError(`The provided options object is invalid. Expected an object but instead got ${typeof options}.`) }

            if (helpers.hasOwnProperty(options, 'caseSensitive')) {
                if (!valueIsString) { throw new SyntaxError(`The "caseSensitive" option is only valid for string values.`) }
                if (typeof options.caseSensitive !== 'boolean') { throw new TypeError(`The "caseSensitive" option is invalid. Expected a boolean but instead got ${typeof options.caseSensitive}.`) }
            }
        }

        const caseSensitive = options?.caseSensitive ?? true;
        if (valueIsString && caseSensitive === false) {
            const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // escape regex special chars
            this.#_queryObject[property] = new RegExp(`^${escaped}$`, 'i');
        } else {
            this.#_queryObject[property] = { $eq: value };
        }

        return this;
    }

    /**
     * (Not equal to) Refines a query or filter to match items whose specified property value does not equal the specified value.
     * For string values, you can optionally make the comparison case-insensitive.
     *
     * If `caseSensitive` is provided, it must be a boolean and only applies to string values.
     * Throws a `SyntaxError` if `caseSensitive` is provided for non-string values.
     *
     * @param {string} property - The property whose value will be compared with the provided value.
     * @param {string | number | boolean | Date} value - The value to match against.
     * @param {{ caseSensitive: boolean }} [options] - Optional settings object to control comparison behavior.
     * @param {boolean} [options.caseSensitive=true] - Whether the comparison should be case-sensitive (only applies to string values).
     *
     * @throws {TypeError} If options is not a plain object.
     * @throws {TypeError} If options.caseSensitive is defined but not a boolean.
     * @throws {SyntaxError} If options.caseSensitive is provided for non-string values.
     *
     * @returns {DataFilter} The current filter instance for chaining.
     *
     * @example
     * // Strict match (default)
     * filter.ne("username", "Admin");
     *
     * @example
     * // Case-insensitive "not equal" match
     * filter.ne("username", "admin", { caseSensitive: false });
     */
    ne(property: string, value: string | number | boolean | Date, options?: { caseSensitive: boolean }): DataFilter {
        this.#_utils.checkProperty(property);
        const valueIsString = typeof value === 'string';

        if (options !== undefined) {
            if (!helpers.isRealObject(options)) { throw new TypeError(`The provided options object is invalid. Expected an object but instead got ${typeof options}.`) }

            if (helpers.hasOwnProperty(options, 'caseSensitive')) {
                if (!valueIsString) { throw new SyntaxError(`The "caseSensitive" option is only valid for string values.`) }
                if (typeof options.caseSensitive !== 'boolean') { throw new TypeError(`The "caseSensitive" option is invalid. Expected a boolean but instead got ${typeof options.caseSensitive}.`) }
            }
        }

        const caseSensitive = options?.caseSensitive ?? true;
        if (valueIsString && caseSensitive === false) {
            const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // escape regex special characters
            this.#_queryObject[property] = { $ne: new RegExp(`^${escaped}$`, 'i') };
        } else {
            this.#_queryObject[property] = { $ne: value }
        }

        return this;
    }

    /**
     * (Greater than or equal to) Refines a query or filter to match items whose specified property value is greater than or equal to the specified value.
     * @param {string} property The property whose value will be compared with value.
     * @param {string|number|Date} value The value to match against.
     * @returns {DataFilter}
     */
    gte(property: string, value: string | number | Date): DataFilter {
        this.#_utils.checkProperty(property);

        this.#_queryObject[property] = { $gte: value }
        return this;
    }

    /**
     * (Greater than) Refines a query or filter to match items whose specified property value is greater than the specified value.
     * @param {string} property The property whose value will be compared with value.
     * @param {string|number|Date} value The value to match against.
     * @returns {DataFilter}
     */
    gt(property: string, value: string | number | Date): DataFilter {
        this.#_utils.checkProperty(property);

        this.#_queryObject[property] = { $gt: value }
        return this;
    }

    /**
     * (In) Refines a query or filter to match items whose specified property value is any item from the the specified value array.
     * @param {string} property The property whose value will be compared with value.
     * @param {Array.<string|number>} value The value to match against.
     * @returns {DataFilter}
     */
    in(property: string, value: (string | number)[]): DataFilter {
        this.#_utils.checkProperty(property);
        if (!Array.isArray(value)) { throw `Unable to use the "in" filter on the "${property}" property. The passed value is invalid. Expected an array as a value but instead got ${typeof value}.` }

        this.#_queryObject[property] = { $in: value }
        return this;
    }

    /**
     * (Not in) Refines a query or filter to match items whose specified property value is not in the the specified value array or the specified property does not exist.
     * @param {string} property The property whose value will be compared with value.
     * @param {Array.<string|number>} value The value to match against.
     * @returns {DataFilter}
     */
    nin(property: string, value: (string | number)[]): DataFilter {
        this.#_utils.checkProperty(property);
        if (!Array.isArray(value)) { throw `Unable to use the "nin" filter on the "${property}" property. The passed value is invalid. Expected an array as a value but instead got ${typeof value}.` }

        this.#_queryObject[property] = { $nin: value }
        return this;
    }

    /**
     * (Less than) Refines a query or filter to match items whose specified property value is less than the specified value.
     * @param {string} property The property whose value will be compared with value.
     * @param {string|number|Date} value The value to match against.
     * @returns {DataFilter}
     */
    lt(property: string, value: string | number | Date): DataFilter {
        this.#_utils.checkProperty(property);

        this.#_queryObject[property] = { $lt: value }
        return this;
    }

    /**
     * (Less than or equal to) Refines a query or filter to match items whose specified property value is less than the specified value.
     * @param {string} property The property whose value will be compared with value.
     * @param {string|number|Date} value The value to match against.
     * @returns {DataFilter}
     */
    lte(property: string, value: string | number | Date): DataFilter {
        this.#_utils.checkProperty(property);

        this.#_queryObject[property] = { $lte: value }
        return this;
    }

    // Logical Operators
    /**
     * (And) Adds an and condition to the query or filter.
     * @param {DataFilter|DataFilter[]} filter 
     * @returns {DataFilter}
     */
    and(filter: DataFilter | DataFilter[]): DataFilter {
        if (filter === undefined || filter === null) { throw 'The filter of the "and" operator is either missing or invalid' }

        if (Array.isArray(filter) && filter.length > 0) {
            for (const filterItem of filter) {
                if (!(filterItem instanceof DataFilter)) {
                    throw `The "and" operator received an array, but one or more of its items were invalid "DataFilter".`
                }
            }

            const filters = filter.filter(filterItem => Object.keys(filterItem._filter).length > 0);
            if (filters.length > 0) {
                const expressions = filters.map(i => this.#_utils.getFilterExpressions(i._filter));
                this.#_queryObject['$and'] = ([] as object[]).concat(...expressions);
            }
        } else {
            if (!(filter instanceof DataFilter)) { throw `The "and" operator only accepts an "DataFilter" as an argument.` }

            const keys = Object.keys(filter._filter);
            if (keys.length > 0) {
                this.#_queryObject['$and'] = this.#_utils.getFilterExpressions(filter._filter);
            }
        }

        return this;
    }

    /**
     * (Nor) Adds a nor condition to the query or filter.
     * @param {DataFilter|DataFilter[]} filter 
     * @returns {DataFilter}
     */
    nor(filter: DataFilter | DataFilter[]): DataFilter {
        if (filter === undefined || filter === null) { throw 'The filter of the "nor" operator is either missing or invalid' }

        if (Array.isArray(filter) && filter.length > 0) {
            for (const filterItem of filter) {
                if (!(filterItem instanceof DataFilter)) {
                    throw `The "nor" operator received an array, but one or more of its items were invalid "DataFilter".`
                }
            }

            const filters = filter.filter(filterItem => Object.keys(filterItem._filter).length > 0);
            if (filters.length > 0) {
                const expressions = filters.map(i => this.#_utils.getFilterExpressions(i._filter));
                this.#_queryObject['$nor'] = ([] as object[]).concat(...expressions);
            }
        } else {
            if (!(filter instanceof DataFilter)) { throw `The "nor" operator only accepts an "DataFilter" as an argument.` }

            const keys = Object.keys(filter._filter);
            if (keys.length > 0) {
                this.#_queryObject['$nor'] = this.#_utils.getFilterExpressions(filter._filter);
            }
        }

        return this;
    }

    /**
     * (Or) Adds an or condition to the query or filter.
     * @param {DataFilter|DataFilter[]} filter 
     * @returns {DataFilter}
     */
    or(filter: DataFilter | DataFilter[]): DataFilter {
        if (filter === undefined || filter === null) { throw 'The filter of the "or" operator is either missing or invalid' }

        if (Array.isArray(filter) && filter.length > 0) {
            for (const filterItem of filter) {
                if (!(filterItem instanceof DataFilter)) {
                    throw `The "or" operator received an array, but one or more of its items were invalid "DataFilter".`
                }
            }

            const filters = filter.filter(filterItem => Object.keys(filterItem._filter).length > 0);
            if (filters.length > 0) {
                const expressions = filters.map(i => this.#_utils.getFilterExpressions(i._filter));
                this.#_queryObject['$or'] = ([] as object[]).concat(...expressions);
            }
        } else {
            if (!(filter instanceof DataFilter)) { throw `The "or" operator only accepts an "DataFilter" as an argument.` }

            const keys = Object.keys(filter._filter);
            if (keys.length > 0) {
                this.#_queryObject['$or'] = this.#_utils.getFilterExpressions(filter._filter);
            }
        }

        return this;
    }

    /**
     * (Not) Adds a not condition to the query or filter.
     * @param {DataFilter} filter 
     * @returns {DataFilter}
     */
    not(filter: DataFilter): DataFilter {
        if (filter === undefined || filter === null) { throw 'The filter of the "not" operator is either missing or invalid' }
        if (!(filter instanceof DataFilter)) { throw `The "not" operator only accepts an "DataFilter" as an argument.` }

        const keys = Object.keys(filter._filter);
        if (keys.length > 0) {
            this.#_queryObject['$not'] = this.#_utils.getFilterExpressions(filter._filter);
        }

        return this;
    }

    // Element query operators
    /**
     * (Exists) Refines a query or filter to match items that contain or do not contain a specified property, including items where the property value is null.
     * @param {string} property The property whose value will be compared with value.
     * @param {boolean} value The value to match against.
     * @returns {DataFilter}
     */
    exists(property: string, value: boolean): DataFilter {
        this.#_utils.checkProperty(property);
        if (value === undefined) { throw `The "exists" data operator was called without passing a boolean value.` }
        if (typeof value !== 'boolean') { throw `The value that was passed to the "exists" data operator is invalid. Expected a boolean value but instead got ${typeof value}.`; }

        this.#_queryObject[property] = { $exists: value }
        return this;
    }

    /**
     * (Type) Refines a query or filter to match items whose specified property value type is one of the specified array of values.
     * @param {string} property The property whose value will be compared with value.
     * @param {DataBSONType|DataBSONType[]} value 
     * @returns {DataFilter}
     */
    type(property: string, value: DataBSONType | DataBSONType[]): DataFilter {
        if (Array.isArray(value)) {
            const expressions: DataBSONType[] = [];

            for (const type of value) {
                if (expressions.includes(type)) { continue }

                if (this.#_utils.bson.isSupportedType(type)) {
                    expressions.push(type)
                } else {
                    throw `The "type" data operator received an array containing invalid type: ${type}.`
                }
            }

            this.#_queryObject[property] = { $type: expressions }
        } else {
            if (!this.#_utils.bson.isSupportedType(value)) { throw `The passed type value (${value}) is not a supported type. Please provide a supported type.` }
            this.#_queryObject[property] = { $type: value }
        }

        return this;
    }

    /**
     * The filter object to use in the query
     * @private 
    */
    get _filter() {
        return this.#_queryObject
    }
}

export default DataFilter;