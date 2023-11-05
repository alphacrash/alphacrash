---
title: 'Kubernetes - Notes'
excerpt: 'Open source container orchestration tool, developed by Google'
date: '2023-10-27'
coverImage: '/assets/blog/kubernetes/kubernetes.svg'
---
---
## Kubernetes

- Open source container orchestration tool
- Developed by Google
- Helps manage containerised applications in different deployment environments.

## Need for container orchestration tool

- Trend from Monolith to Microservices
- Increased usage of containers
- Demand for a proper way to manage containers

## Features that orchestration tools offer

- High Availability or no downtime
- Scalability or high performance
- Disaster recovery - backup and restore

# Kubernetes Architecture

A cluster is made of

- Control Plane - At least 1 Master Node
    - Important K8s processes run to manage
        - API Server - Entrypoint to K8s cluster
            - UI - Kubernetes Dashboard
            - Backend - Scripts to interact
        - Controller Manager
            - Keeps track of whats happening in the cluster
        - Scheduler
            - Ensures Pods placement
        - etcd
            - Kubernetes backing store - configuration and state data of every node
- Multiple Worker Nodes
    - Each node has a `kubelet` running on it
    - Higher workload, much bigger and more resources
- Virtual Network
    - Creates one unified network

## Main Kubernetes Components

- Pod
- Service
- Ingress
- ConfigMap
- Secret
- Deployment
- StatefulSet
- DaemonSet

## Pod

- Smallest unit in Kubernetes
- Abstraction over container - So that Kubernetes can interact consistently
    - Docker has container, Pod is an abstraction over it.
- Usually 1 application per Pod
    - Each Pod gets its own IP address
    - Pods are ephemeral, so new IP address on re-creation
- Example, a Node contains
    - App Pod - Pod to run Web App
    - DB Pod - Pod to run DB

## Service

- Permanent IP address attached that will interact with Pod
- Lifecycle of Pod and Service - not connected
- App should be accessible through browser
    - External Service - So outside world could access
    - Internal Service - For example, DB connection

## Ingress

We don’t want - IP address for user to access. We want something like “my-app.com”

Ingress helps in doing it.

## ConfigMap

- Why ConfigMap?
    - Database URL usually in built application. If URL changes, re-build and push it to repo. Pull it in your Pod.
- External configuration of your application
- ConfigMap is for non-confidential data only - Not for Username and Passwords

## Secret

- Used to store secret data
- Reference Secret in Deployment/Pod
    - Can be set as environment variable
- Default - base64. Anyone who has access to Kubernetes cluster can view password so 3rd party provider is encouraged to be used.

`echo -n mongouser | base64`

## Volume

- Why Volume?
    - Data Storage - DB Pod that our app uses. If pod gets restarted, data will be gone
- Volume - Attaches physical storage to Pods
    - Could be local or remote outside of K8s container
- Kubernetes doesn’t manage data persistence

## Deployment

- Blueprint for pods, for stateless apps
- You create Deployments
    - Specify how many replicas of Pods, scaling
- Abstraction of Pods
- DB can’t be replicated via Deployment

## Stateful Set

- For stateful apps like - MySQL, Elastic, MongoDB
- It’s not easy

## Example

```bash
(base) % kubectl apply -f mongo-config.yaml 
configmap/mongo-config created

(base) % kubectl get pod                   
No resources found in default namespace.

(base) % kubectl apply -f mongo-secret.yaml
secret/mongo-secret created

(base) % kubectl apply -f mongo.yaml       
service/mongo-service created

(base) % kubectl apply -f webapp.yaml
deployment.apps/webapp created
service/webapp-service created

(base) % kubectl get all
NAME                          READY   STATUS             RESTARTS   AGE
pod/mongo-85d45f7888-b9kd8    1/1     Running            0          102s
pod/webapp-6849d7476d-dwf9m   0/1     ImagePullBackOff   0          4m48s

NAME                     TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)          AGE
service/kubernetes       ClusterIP   10.96.0.1       <none>        443/TCP          40m
service/mongo-service    ClusterIP   10.96.190.173   <none>        27017/TCP        5m3s
service/webapp-service   NodePort    10.101.108.53   <none>        3000:30100/TCP   4m48s

NAME                     READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/mongo    1/1     1            1           102s
deployment.apps/webapp   0/1     1            0           4m48s

NAME                                DESIRED   CURRENT   READY   AGE
replicaset.apps/mongo-85d45f7888    1         1         1       102s
replicaset.apps/webapp-6849d7476d   1         1         0       4m48s
```

## Kubernetes Architecture

- Master Node (Manages Cluster)
    - API Servier (kube-apiserver)
    - Distributed Database (etcd)
    - Scheduler (kube-scheduler)
    - Controller Manager (kube-controller-manager)
- Slave Node (Run Your Applications)
    - Node Agent (kubelet)
    - Networking Component (kube-proxy)
    - Container Runtime (CRI - docker, rkt, etc)
    - PODS (Multiple pods running containers)