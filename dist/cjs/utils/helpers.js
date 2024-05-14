"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Helpers {
    #_constants = {
        schemaTypes: ['String', 'Number', 'Object', 'Array', 'Date', 'Boolean'],
    };
    /**
     * Check if the argument is a real object or not
     * @param {*} obj
     * @returns {boolean}
     */
    isRealObject(obj) {
        return typeof obj === 'object' && obj !== null && !(obj instanceof Array) && !(obj instanceof Date) && !(obj instanceof RegExp) && !(obj instanceof Error);
    }
    /**
     * Check whether the argument is a valid string or not
     * @param {*} str
     * @returns {boolean}
     */
    isValidString(str) {
        return typeof str === 'string' && str.trim().length > 0;
    }
    /**
     * Check if the value is undefined
     * @param {any} arg
     * @returns {boolean}
     */
    isUndefined(arg) {
        return typeof arg === 'undefined';
    }
    isCustomSchema(schema) {
        if (typeof schema === 'string') {
            return false;
        }
        else if (this.isRealObject(schema)) {
            if (schema.type === undefined) {
                return false;
            }
            if (this.isSchemaType(schema.type)) {
                return true;
            }
            return false;
        }
        else {
            return false;
        }
    }
    isSchemaType(schemaType) {
        if (typeof schemaType === 'string') {
            return [...this.#_constants.schemaTypes, 'Any'].includes(schemaType);
        }
        else {
            return false;
        }
    }
}
exports.default = new Helpers;
