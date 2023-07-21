targetScope = 'resourceGroup'
param location string = resourceGroup().location
// param appPlanName string = '${uniqueString(resourceGroup().id)}plan'

// CREATE A AZURE STORAGE INSTANCE
// CREATE A AZURE MYSQL DATABASE INSTANCE
// CREATE A AZURE REDIS CACHING INSTANCE
// CREATE A AZURE CONTAINER APP INSTANCE - WITH THE PRODOC IMAGE

// az bicep build --file azure.bicep --outdir .

// GENERAL INFORMATION
@description('Provide a prefix for creating resource names. - E.G Company Name')
@maxLength(10)
param collectiveResourcePrefixLabel string
param generalTag object = { channel: 'prodoc-quick-deploy' }

// 1.
// STORAGE ACCOUNT INSTANCE
// STORAGE ACCOUNT - BLOB SERVICE
// STORAGE ACCOUNT - CONTAINER
// STORAGE ACCOUNT - SHARED ACCESS SIGNATURE
// STORAGE ACCOUNT - CONNECTION STRINGS FOR UPLOADS
param storageAccountName string = '${collectiveResourcePrefixLabel}pstorage'
param storageContainerName string = 'files'
resource prodoc_storage_account 'Microsoft.Storage/storageAccounts@2022-09-01' = {
  name: storageAccountName
  location: location
  kind: 'StorageV2'
  tags: generalTag
  sku: {
    name: 'Standard_RAGZRS'
  }
  properties: {
    accessTier: 'Hot'
    allowBlobPublicAccess: true
    allowCrossTenantReplication: true
    allowSharedKeyAccess: true
    defaultToOAuthAuthentication: false
    keyPolicy: {
      keyExpirationPeriodInDays: 36525
    }
    publicNetworkAccess: 'Enabled'
    supportsHttpsTrafficOnly: true
    routingPreference: {
      routingChoice: 'MicrosoftRouting'
      publishMicrosoftEndpoints: true
    }
  }
}
resource prodoc_storage_account_blob_service 'Microsoft.Storage/storageAccounts/blobServices@2022-09-01' = {
  name: 'default'
  parent: prodoc_storage_account
  properties: {
    isVersioningEnabled: false
    cors: {
      corsRules: [
        {
          allowedHeaders: [
            '*'
          ]
          allowedMethods: [
            'DELETE'
            'GET'
            'HEAD'
            'MERGE'
            'OPTIONS'
            'PATCH'
            'POST'
            'PUT'
          ]
          allowedOrigins: [
            '*'
          ]
          exposedHeaders: [
            '*'
          ]
          maxAgeInSeconds: 0
        }
      ]
    }
  }
}
resource prodoc_storage_account_container 'Microsoft.Storage/storageAccounts/blobServices/containers@2022-09-01' = {
  name: storageContainerName
  parent: prodoc_storage_account_blob_service
  properties: {
    immutableStorageWithVersioning: {
      enabled: false
    }
    publicAccess: 'Blob'
  }
}
var sasConfig = {
  signedResourceTypes: 'cos'
  signedPermission: 'rwdlacup'
  signedServices: 'b'
  signedExpiry: '2123-01-01T12:00:00Z'
  signedProtocol: 'https'
  keyToSign: 'key1'
}
var accountSasToken = prodoc_storage_account.listAccountSas(prodoc_storage_account.apiVersion, sasConfig).accountSasToken
var connectionStringSAS = 'BlobEndpoint=${prodoc_storage_account.properties.primaryEndpoints.blob};SharedAccessSignature=${accountSasToken}'
output accountSasToken string = accountSasToken

// 2.
// Mongo ISNTANCE
param serverVersion string = '4.2'

@description('Maximum autoscale throughput for the database shared with up to 25 collections')
@minValue(1000)
@maxValue(1000000)
param sharedAutoscaleMaxThroughput int = 1000

param mongoAccountName string = '${collectiveResourcePrefixLabel}-p-mongo'
param mongoDatabaseName string = '${collectiveResourcePrefixLabel}-p-mongodb'

resource MongoDatabaseAccount 'Microsoft.DocumentDB/databaseAccounts@2022-05-15' = {
  name: toLower(mongoAccountName)
  location: location
  kind: 'MongoDB'
  tags: generalTag
  properties: {
    capacity: {
      totalThroughputLimit: -1
    }
    databaseAccountOfferType: 'Standard'
    apiProperties: {
      serverVersion: serverVersion
    }
    capabilities: [
      {
        name: 'DisableRateLimitingResponses'
      }
    ]
    locations: [
      {
        locationName: location
        failoverPriority: 0
        isZoneRedundant: false
      }
    ]
  }
}
resource mongoDatabase 'Microsoft.DocumentDB/databaseAccounts/mongodbDatabases@2022-05-15' = {
  parent: MongoDatabaseAccount
  name: mongoDatabaseName
  properties: {
    resource: {
      id: mongoDatabaseName
    }
    options: {
      autoscaleSettings: {
        maxThroughput: sharedAutoscaleMaxThroughput
      }
    }
  }
}
var mongoConnectionString = listConnectionStrings(resourceId('Microsoft.DocumentDB/databaseAccounts', MongoDatabaseAccount.name), '2019-12-12').connectionStrings[0].connectionString
output mongoConnectionString string = mongoConnectionString

// 3.
// REDIS INSTANCE
var redisName = '${collectiveResourcePrefixLabel}-predis'
resource redis_instance 'Microsoft.Cache/redis@2022-06-01' = {
  name: redisName
  location: location
  tags: generalTag
  properties: {
    enableNonSslPort: false
    publicNetworkAccess: 'Enabled'
    redisVersion: 'latest'
    sku: {
      capacity: 0
      family: 'C'
      name: 'Basic'
    }
  }
}
// var redisCacheRestUrl = 'https://${redis_instance.properties.hostName}'
var redisCacheKey = redis_instance.listKeys().primaryKey
// output redisCacheRestUrl string = redisCacheRestUrl
// output redisCacheKey string = redisCacheKey
var redisConnectionString = 'rediss://default:${redisCacheKey}@${redis_instance.properties.hostName}:6380'
output redisConnectionString string = redisConnectionString

// 4.
// CONTAINER PRE-SETUP INSTANCES
// param appNamePostFix string = 'p-app'
var appEnvironmentName = '${collectiveResourcePrefixLabel}-p-apps-env'
// var logAnalyticsWorkspaceName = '${appNamePostFix}-logs-workspace'
var containerPort = 3000

// resource logAnalyticsWorkspace 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
//   name: logAnalyticsWorkspaceName
//   location: location
//   tags: generalTag
// }
resource container_app_environment 'Microsoft.App/managedEnvironments@2022-03-01' = {
  name: appEnvironmentName
  location: location
  properties: {
    // appLogsConfiguration: {
    //   destination: 'log-analytics'
    //   logAnalyticsConfiguration: {
    //     customerId: logAnalyticsWorkspace.properties.customerId
    //     sharedKey: logAnalyticsWorkspace.listKeys().primarySharedKey
    //   }
    // }
    vnetConfiguration: {
      internal: false
    }
  }
}
// CONTAINER APP INSTANCE
@secure()
param editorPassword string
var appName = '${collectiveResourcePrefixLabel}-p-app'
resource prodoc_container_app_instance 'Microsoft.App/containerApps@2022-11-01-preview' = {
  name: appName
  location: location
  tags: generalTag
  properties: {
    configuration: {
      ingress: {
        allowInsecure: false
        targetPort: 3000
        transport: 'auto'
        external: true
      }
    }
    environmentId: container_app_environment.id
    template: {
      containers: [
        {
          env: [
            {
              name: 'channel'
              value: 'azure'
            }
            {
              name: 'EDITOR_PASSWORD'
              value: editorPassword
            }
            {
              name: 'MONGO_DATABASE_CONNECTION_STRING'
              value: mongoConnectionString
            }
            {
              name: 'REDIS_SERVICE_CONNECTION_STRING'
              value: redisConnectionString
            }
            {
              name: 'AZURE_STORAGE_ACCOUNT_NAME'
              value: storageAccountName
            }
            {
              name: 'AZURE_STORAGE_CONTAINER_NAME'
              value: storageContainerName
            }
            {
              name: 'AZURE_STORAGE_CONNECTION_STRING'
              value: connectionStringSAS
            }
          ]
          image: 'docker.io/prodoctech/prodoc:latest'
          name: 'prodoc-container-instance'
          resources: {
            cpu: json('0.25')
            memory: '0.5Gi'
          }
          probes: [
            {
              type: 'liveness'
              initialDelaySeconds: 15
              periodSeconds: 30
              failureThreshold: 3
              timeoutSeconds: 1
              httpGet: {
                port: containerPort
                path: '/'
              }
            }
            {
              type: 'startup'
              timeoutSeconds: 2
              httpGet: {
                port: containerPort
                path: '/'
              }
            }
            {
              type: 'readiness'
              timeoutSeconds: 3
              failureThreshold: 3
              httpGet: {
                port: containerPort
                path: '/'
              }
            }
          ]
        }
      ]
      scale: {
        maxReplicas: 1
        minReplicas: 1
      }
    }
  }
}
