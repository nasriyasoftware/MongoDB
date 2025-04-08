## DataFilter: Creating and Using Filters
The `DataFilter` is a powerful utility used to refine queries in MongoDB by applying specific conditions to the data. It can be created by calling the `client.filter()` method, which initializes a new filter object that you can chain with various methods to build complex queries.

### Creating a DataFilter
To create a `DataFilter`, you simply call the `filter()` method on your **client** instance ([learn how to create one](./creating-clients.md)):

```js
const filter = client.filter();
```

Once created, the `filter` object can be used to apply various conditions to your queries.

### Methods of DataFilter
Here’s a breakdown of the key methods available in `DataFilter`:

#### 🔍 Comparison Filters

##### eq
```ts
eq(property: string, value: string | number | boolean | Date, options?: { caseSensitive: boolean }): DataFilter
```
This method matches items whose specified property value does not equal the specified value.

Configure with `options`:
```ts
{
    /** Whether the comparison should be case-sensitive (only applies to string values). Default: `true` */
    caseSensitive: boolean;
}
```
Example:
```js
filter.eq('loginEmail', 'email@domain.com');
```

##### ne
```ts
ne(property: string, value: string | number | boolean | Date, options?: { caseSensitive: boolean }): DataFilter
```
This method matches items whose specified property value does not equal the specified value.

Configure with `options`:
```ts
{
    /** Whether the comparison should be case-sensitive (only applies to string values). Default: `true` */
    caseSensitive: boolean;
}
```

Example:
```js
filter.ne('username', 'admin', { caseSensitive: false });
```

##### contains
```ts
contains(property: string, value: string, options?: { caseSensitive: boolean }): DataFilter
```
This method matches items whose specified property value contains the specified string.

Configure with `options`:
```ts
{
    /** Whether the comparison should be case-sensitive. Default: `false` */
    caseSensitive: boolean;
}
```

Example:
```js
filter.contains('bio', 'developer');
```

##### startsWith
```ts
startsWith(property: string, value: string, options?: { caseSensitive: boolean }): DataFilter
```
Matches items whose specified property value starts with the given substring.

Configure with `options`:
```ts
{
    /** Whether the comparison should be case-sensitive. Default: `false` */
    caseSensitive: boolean;
}
```

Example:
```js
filter.startsWith('slug', 'user-');
```

##### endsWith
```ts
endsWith(property: string, value: string, options?: { caseSensitive: boolean }): DataFilter
```
Matches items whose specified property value ends with the given substring.

Configure with `options`:
```ts
{
    /** Whether the comparison should be case-sensitive. Default: `false` */
    caseSensitive: boolean;
}
```

Example:
```js
filter.endsWith('email', '@example.com');
```

##### gt
```ts
gt(property: string, value: string | number | Date): DataFilter
```
Matches items where the property is greater than the specified value.

Example:
```js
filter.gt('views', 1000);
```

##### gte
```ts
gte(property: string, value: string | number | Date): DataFilter
```
Matches items where the property is greater than or equal to the specified value.

Example:
```js
filter.gte('price', 99.99);
```

##### lt
```ts
lt(property: string, value: string | number | Date): DataFilter
```
Matches items where the property is less than the specified value.

Example:
```js
filter.lt('age', 18);
```

##### lte
```ts
lte(property: string, value: string | number | Date): DataFilter
```
Matches items where the property is less than or equal to the specified value.

Example:
```js
filter.lte('discount', 50);
```

##### between
```ts
between(property: string, start: string | number | Date, end: string | number | Date): DataFilter
```
This method allows you to match items whose specified property value is within a given range. Both the `start` and `end` values can be a `string`, `number`, or `Date`.

Example:
```js
filter.between('age', 18, 30);
```

#### 🧠 Inclusion Filters

##### in
```ts
in(property: string, value: (string | number)[]): DataFilter
```
Matches items where the property value is in the specified list.

Example:
```js
filter.in('status', ['active', 'pending']);
```

##### nin
```ts
nin(property: string, value: (string | number)[]): DataFilter
```
Matches items where the property value is not in the list or the property does not exist.

Example:
```js
filter.nin('role', ['admin', 'moderator']);
```

##### hasAll
```ts
hasAll(property: string, value: (string | number | Date | any)[]): DataFilter
```
Matches items where the array property contains all of the given values.

Example:
```js
filter.hasAll('tags', ['technology', 'javascript']);
```

##### hasSome
```ts
hasSome(property: string, value: (string | number | Date | any)[]): DataFilter
```
Matches items where the array property contains at least one of the given values.

Example:
```js
filter.hasSome("roles", ["admin", "moderator"]);
```

#### 🧩 Logical Filters

##### and
```ts
and(filter: DataFilter | DataFilter[]): DataFilter
```
Matches items where all conditions are true.

Example:
```js
const activeFilter = client.filter().eq('status', 'active');
const goodScoreFilter = client.filter().gte('score', 80);

// Add the two filters above to the main one below
const filter = client.filter().and([activeFilter, goodScoreFilter]);
```

##### or
```ts
or(filter: DataFilter | DataFilter[]): DataFilter
```
Matches items where at least one condition is true.

Example:
```js
const filter = client.filter().or([
    client.filter().eq('tier', 'gold')
    client.filter().eq('tier', 'platinum')
])
```

##### nor
```ts
nor(filter: DataFilter | DataFilter[]): DataFilter
```
Matches items where none of the conditions are true.

Example:
```js
filter.nor([
  client.filter().eq('role', 'banned'),
  client.filter().eq('role', 'suspended')
]);
```

##### not
```ts
not(filter: DataFilter): DataFilter
```
Negates the result of the provided filter.

Example:
```js
filter.not(client.filter().lt('credits', 1));
```


#### 🧾 Property Filters

##### exists
```ts
exists(property: string, value: boolean): DataFilter
```
Matches items where the property exists or does not exist, including when the value is null.

Example:
```js
filter.exists('profilePicture', true);
```

##### type
```ts
type(property: string, value: DataBSONType | DataBSONType[]): DataFilter
```
Matches items where the property value is of a specified BSON type.

Example:
```js
filter.type('createdAt', 'date');
```