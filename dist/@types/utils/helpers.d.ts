import { CustomSchema, SchemaType } from "../docs/docs";
declare class Helpers {
    #private;
    /**
     * Check if the argument is a real object or not
     * @param {*} obj
     * @returns {boolean}
     */
    isRealObject(obj: any): boolean;
    /**
     * Check whether the argument is a valid string or not
     * @param {*} str
     * @returns {boolean}
     */
    isValidString(str: any): boolean;
    /**
     * Check if the value is undefined
     * @param {any} arg
     * @returns {boolean}
     */
    isUndefined(arg: any): arg is undefined;
    isCustomSchema(schema: SchemaType | CustomSchema): schema is CustomSchema;
    isSchemaType(schemaType: any): schemaType is SchemaType;
}
declare const _default: Helpers;
export default _default;
