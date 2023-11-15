---
title: "ACID and CAP"
excerpt: "CAP and ACID - Trade-offs in System Design"
date: "2023-11-15"
coverImage: "/assets/blog/spring/spring-boot.jpeg"
---
---

# CAP Theorem (Consistency, Availability, Partition Tolerance)

CAP theorem states it is impossible for a distributed system to simultaneously provide more than two of these three guarantees: consistency, availability and partition tolerance.

**Consistency** - means all clients see same data at same time no matter which node they connect to

**Availability** - means any client which requests data will get a response even if some nodes are down

**Partition Tolerance** - means system continues to operate despite network partitions. Partition indicates a communication break between two nodes.

### Real-world distributed systems

In a distributed system, partitions cannot be avoided, so we must choose between consistency and availability.

# ACID Properties (Atomicity, Consistency, Isolation, Durability)

ACID properties are typically associated with traditional relational databases and ensure the reliability and integrity of transactions.

**Atomicity**: Transactions are atomic, meaning they are treated as a single, indivisible unit. Either all the operations in a transaction are completed, or none of them are. There is no partial completion of a transaction.

**Consistency**: Transactions bring the database from one valid state to another. The database must satisfy a set of integrity constraints before and after the transaction.

**Isolation**: Transactions operate independently of each other. The execution of one transaction is isolated from the execution of others, ensuring that the concurrent execution of transactions produces a result that is equivalent to some serial execution.

**Durability**: Once a transaction is committed, its changes to the database are permanent and survive subsequent system failures.

# Summary

In summary, while CAP and ACID address different concerns (distributed systems vs. database transactions), they highlight important trade-offs in system design. Systems need to be carefully designed based on the specific requirements and priorities of the application or use case.
