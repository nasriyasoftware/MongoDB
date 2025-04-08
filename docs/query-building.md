## 📋 Building a `query`
You can easily perform queries on collections by passing the collection ID to `client.query`.

### Basic Query
To begin querying a collection, use the `client.query` method with the collection ID.
```js
const query = client.query('Members');
```

### Pagination with `limit` and `skip`
To paginate your query results, use the `limit` and `skip` methods. For example, the following query skips the first **5** records and retrieves the next **10** records, effectively fetching records **6** through **15**:
```js
const query = client.query('Members').limit(10).skip(5);
```

### Using a Custom `filter` in Queries
To refine your queries, you can create a custom filter and apply it to your query. Here's an example where we filter the `Members` collection for members who:
- Have a Gmail email address.
- Were active in the last three months.
- Have an active account status.

```js
const threeMonths = 3 * 30 * 24 * 60 * 60 * 1000;

const customFilter = client.filter()
    .endsWith('loginEmail', '@gmail.com', { caseSensitive: false })
    .eq('status', 'ACTIVE')
    .gte('lastActive', new Date(Date.now() - threeMonths));

// Chain the custom filter to the query
const query = client.query('Members').filter(customFilter).limit(10).skip(5);
```

**📖 Learn more:**
The `filter()` API provides many powerful methods for querying your data, including `eq`, `ne`, `startsWith`, `contains`, in, and more.

👉 [See full filter documentation  →](./data-filter.md)
### 🚀 Executing the Query
Once the query is built, you can execute it using the `find` method. This returns a `QueryResult` object, which includes:
- `items`: All matching items loaded so far.
- `pageItems`: Items on the current page.
- `currentPage`: The current page number.
- `totalPages`: The total number of pages.
- `totalCount`: The total number of items matching the filter.
- Pagination utilities: `hasNext()` and `next()` for navigating through results.

```js
// Execute the query
const result = await query.find();

// Access items
const items = result.items;            // All matching items
const pageItems = result.pageItems;    // Only items on the current page

// Pagination info
console.log(result.totalCount);        // Total matching items
console.log(result.currentPage);       // Current page number
console.log(result.totalPages);        // Total pages

// Fetch next page
if (result.hasNext()) {
    const nextItems = await result.next();
}
```

### Counting Results
If you only need the total count of items without retrieving the full list, you can use the `count()` method:
```js
const total = await query.count();
```

### Returning Clean Data
To send the results to the frontend in a clean, JSON-compatible format, use the `data` property of the result:

```js
return result.data;
```

___

### 💡 Key Takeaways:

- `limit()` and `skip()` are used to paginate your query results.
- Filters help refine queries, letting you query based on multiple conditions.
- `find()` returns the items, pagination info, and utility methods for navigating results.
- `count()` provides a count of matching items without returning them.
- Use `data` for clean, JSON-compatible output when sending results to the frontend.