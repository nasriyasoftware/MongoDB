### 🌐 Multi-Database Connections and Replication
This feature enables you to define multiple database connections, tag them as master or slave, and set up replication strategies for better scalability and redundancy. With this, you can achieve geographically distributed databases for optimized read operations and ensure high availability in case of database failure.

##### 📌 Key Concepts
- **Master Database**: The primary database where all write operations occur. Once a write operation is successful, it is replicated to the slave databases.
- **Slave Databases**: Secondary databases that handle read operations. These can be used to serve data faster to customers in different regions. If the master database is down, the driver will attempt to read from the slave databases.
- **Replication**: Changes made to the master database are automatically replicated to slave databases once the write operation is successful.
- **Failover**: If the master database becomes unavailable, the system will attempt to read data from one of the slave databases.

##### 🛠️ Defining Multiple Connections
You can define multiple database connections in your configuration. These can be tagged as `master` or `slave`, and the system will use these tags to route write and read operations appropriately.

**Example: Defining Connections**
```js
import mongodb from '@nasriya/mongodb';

const client = mongodb.createClient({
  connections: {
    asia: {
      uri: 'mongodb://asia-db-host',
      role: 'master'
    },
    europe: {
      uri: 'mongodb://europe-db-host',
      role: 'slave'
    },
    middleEast: {
      uri: 'mongodb://middleeast-db-host',
      role: 'slave'
    }
  }
});
```

In this example:
- The `asia` connection is the master database.
- The `europe` and `middleEast` connections are slave databases.

___

🔄 Replicating Data Across Databases
Once a write operation (e.g., `insert`, `update`) is successful on the master database, the system will replicate the changes to the slave databases. This ensures that the data is consistent across regions.

**Example: Replicating Data**
```js
// Insert an item to the Asia master database
await client.insert('Members', { name: 'John Doe', email: 'john.doe@example.com' });

// The new user will be replicated to the Europe and Middle East slave databases.
```
___

🚨 Failover: Reading from Slave Databases
If the master database is unavailable for reading (e.g., during maintenance), the system will attempt to read from one of the slave databases. If the master is down, reads will still be possible, although with potential latency since the data may not be as fresh.

Example: Fallback Read from Slave
```js
const member = await client.getItem('Members', "memberId");
```

If the master database isn't available, the driver will try to fetch the data from another database replica behind the scenes, ensuring continuous availability.
___

💡 Use Cases
1. Geographically Distributed Applications: If you have users in multiple regions (e.g., Asia, Europe, and the Middle East), you can configure databases in each region to serve data quickly and reduce latency by having the data closer to the user.
2. Failover and Redundancy: If the master database goes down, slave databases can continue to serve read requests, preventing a complete downtime. The system will automatically switch to one of the available slaves for read operations.