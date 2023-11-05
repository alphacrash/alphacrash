---
title: 'Spring Boot - Notes'
excerpt: 'World is moving towards micro-services and we don’t have time to configure 100 of them.'
date: '2023-10-27'
coverImage: '/assets/blog/spring/spring-boot.jpeg'
---
---
### Why Spring Boot?

- Spring based applications have lot of configuration
    - If we use Spring MVC, we need to configure ComponentScan, DispatcherServlet, ViewResolver, Web Jars, etc.
- World is moving towards micro-services and we don’t have time to configure 100 of them.

### Goals of Spring Boot

- Quick start
- Opinionated
- Minimal code generation

### Spring Boot Features

- Auto Configuration
- Spring Boot Starter Projects
- Actuator
- Embedded Server

### Spring vs Spring MVC vs Spring Boot

**************Spring**************

Most important feature of Spring Framework is

- Dependency Injection
- IoC (Inversion of Control)

********************Spring MVC********************

It provides decoupled way of developing web applications.

- Dispatcher Servlet
- Model And View
- View Resolver

**********************Spring Boot**********************

Eliminates configuration needed by Spring and Spring MVC and auto-configures it

- No need for @ComponentScan. Default scan is provided.
- No need to configure Dispatcher Servlet
- No need to configure Data Source, Entity Manager Factory or Transaction Manager

### Application Annotations

********************************************@SpringBootApplication********************************************

```java
@SpringBootConfiguration
@EnableAutoConfiguration
@ComponentScan
public @interface SpringBootApplication {
```

- SpringBootConfiguration - Enhance Spring’s configuration
- EnableAutoConfiguration - Auto configures application.properties
- ComponentScan - Turns on component scan inside the package

### Auto Configuration

Spring Boot looks at

- Frameworks available on `CLASSPATH`
- Existing configuration of the application

Based on these, Spring Boot provides basic configuration needed to configure the app with these frameworks.

****************************Implementation****************************

- spring-boot-autoconfigure.jar
    - Code written to configure frameworks and usage
- To get more details
    - Turn on Debug logging - Detailed report of Positive matches and Negative matches
        
        ```java
        logging.level.org.springframework: DEBUG
        ```
        
    - Use Spring Boot Actuator - /application