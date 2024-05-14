import { CustomSchema, SchemaType } from "../docs/docs";

class Helpers {
    readonly #_constants = {
        schemaTypes: ['String', 'Number', 'Object', 'Array', 'Date', 'Boolean'] as SchemaType[],
    };

    /**
     * Check if the argument is a real object or not
     * @param {*} obj 
     * @returns {boolean}
     */
    isRealObject(obj: any): boolean {
        return typeof obj === 'object' && obj !== null && !(obj instanceof Array) && !(obj instanceof Date) && !(obj instanceof RegExp) && !(obj instanceof Error);
    }

    /**
     * Check whether the argument is a valid string or not
     * @param {*} str 
     * @returns {boolean}
     */
    isValidString(str: any): boolean {
        return typeof str === 'string' && str.trim().length > 0;
    }

    /**
     * Check if the value is undefined
     * @param {any} arg 
     * @returns {boolean}
     */
    isUndefined(arg: any): arg is undefined {
        return typeof arg === 'undefined'
    }

    isCustomSchema(schema: SchemaType | CustomSchema): schema is CustomSchema {
        if (typeof schema === 'string') {
            return false
        } else if (this.isRealObject(schema)) {
            if ((schema as CustomSchema).type === undefined) { return false }
            if (this.isSchemaType(schema.type)) { return true }
            return false;
        } else {
            return false;
        }
    }

    isSchemaType(schemaType: any): schemaType is SchemaType {
        if (typeof schemaType === 'string') {
            return [...this.#_constants.schemaTypes, 'Any'].includes(schemaType);
        } else {
            return false
        }
    }
}

export default new Helpers;