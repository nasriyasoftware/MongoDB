## 🧠 Built-in Caching System & Cache Broker Support

The built-in caching system allows the adapter to store frequently accessed database data in memory and serve it from the cache. This improves performance by reducing the number of database queries needed for frequently requested data.

### 📌 Key Concepts
- **TTL (Time-To-Live)**: Developers can specify the TTL globally and for each collection. Once the TTL expires, the record is invalidated and removed from the cache.
- **Cache Invalidation**: Data can be invalidated for various reasons, including TTL expiration, manual removal, or updates to the record. Invalidation can also occur via messages received from other connected servers.
- **Cache Broker**: A central system that coordinates cache invalidation messages across multiple adapters. It ensures that when a record is invalidated on one server, all other connected servers are notified and update their cache accordingly.
- **Independent Cache**: Each adapter can maintain its own cache, but if configured, can also synchronize cache operations with a central Cache Broker.


### 🛠️ Defining Cache Behavior
The cache is defined at the connection level. Each connection can have its own cache settings, such as the TTL for each collection.

**Example: Defining Cache for a Connection**
```js
import mongodb from '@nasriya/mongodb';

mongodb.defineConnection({
  uri: 'mongodb://example-db-host',
  cache: {
    enabled: true,             // Enable caching for this connection
    ttl: 3600,                 // Global TTL in seconds (1 hour)
  },
  databases: {
    Auth: { ttl: 600 },       // Override TTL for the 'Members' collection (10 minutes)
    Products: { ttl: 86400 }  // Override TTL for the 'Products' collection (1 day)
  }
});
```
In this example:
- **Global TTL** of 1 hour is set for the entire connection.
- TTL for `Auth` is overridden to 10 minutes, and for `Products`, it's 1 day.

___

🔄 **Cache Invalidation** The system will automatically invalidate cache entries based on the following conditions:
- **TTL Expiry**: When the TTL for a cached item expires, it is automatically removed from the cache.
- **Manual Removal**: When a record is deleted or updated, the cache is invalidated for that record.
- **Invalidation from Cache Broker**: If connected to a Cache Broker, invalidation messages are broadcasted to all connected servers, causing them to remove the corresponding item from their local cache.

**Example: Cache Invalidation**
```js
// After updating a record, the cache will be invalidated automatically.
await client.update('Members', { _id: '12345', status: 'inactive' });
```
___

🔗 **Cache Broker Integration** The Cache Broker allows servers to synchronize cache invalidations across multiple adapters. When a record is invalidated on one server, the Cache Broker ensures that all other connected servers are notified and their caches are updated.

**Example: Synchronizing Cache Across Servers**

1. Server **A** invalidates a record:
   - Server **A** sends an invalidation message to the **Cache Broker**.
   - The **Cache Broker** publishes the invalidation message to all connected adapters.
2. Server **B** receives the invalidation message and removes the item from its cache.

```js
// Example: Connecting to the Cache Broker
mongodb.defineConnection({
  uri: 'mongodb://example-db-host',
  cache: {
    enabled: true,
    ttl: 3600,
    cacheBroker: {
      enabled: true,   // Connect to the Cache Broker
      wsUrl: 'ws://cache-broker-host'  // URL of the Cache Broker WebSocket
    }
  }
});
```
___

⚠️ Cache Failure Handling If the connection between the adapter and the Cache Broker is lost, the adapter will automatically flush all data from the cache to ensure consistency.

___

💡 Use Cases

- **Reduced Latency**: Cache frequently accessed data to reduce database load and minimize response times for read operations.
- **Geographically Distributed Applications**: Cache can be stored closer to the user to improve response times across regions, while synchronization with the Cache Broker ensures consistency.
- **Failover Scenarios**: If the database connection is down, cache can be used to continue serving data from memory while the database is restored.
- **Optimized Read Performance**: By leveraging cache, read operations are faster and reduce the dependency on database queries, especially for highly queried records.