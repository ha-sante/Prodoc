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
param collectiveResourcePrefixLabel string
param generalTag object = { channel: 'prodoc-quick-deploy' }



// 1.
// STORAGE ACCOUNT INSTANCE
// STORAGE ACCOUNT - BLOB SERVICE
// STORAGE ACCOUNT - CONTAINER
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
// STORAGE ACCOUNT - SHARED ACCESS SIGNATURE
var sasConfig = {
  signedResourceTypes: 'cos'
  signedPermission: 'rwdlacup'
  signedServices: 'b'
  signedExpiry: '2123-01-01T12:00:00Z'
  signedProtocol: 'https'
  keyToSign: 'key1'
}
// STORAGE ACCOUNT - CONNECTION STRINGS FOR UPLOADS
var accountSasToken = prodoc_storage_account.listAccountSas(prodoc_storage_account.apiVersion, sasConfig).accountSasToken
var connectionStringSAS = 'BlobEndpoint=${prodoc_storage_account.properties.primaryEndpoints.blob};SharedAccessSignature=${accountSasToken}'

output accountSasToken string = accountSasToken

// 2.
// MYSQL ISNTANCE
@description('Provide the administrator login name for the MySQL server.')
param administratorLogin string

@description('Provide the administrator login password for the MySQL server.')
@secure()
param administratorLoginPassword string

@description('The tier of the particular SKU. High Availability is available only for GeneralPurpose and MemoryOptimized sku.')
@allowed([
  'Burstable'
  'Generalpurpose'
  'MemoryOptimized'
])
param serverEdition string = 'Burstable'

@description('Server version')
@allowed([
  '5.7'
  '8.0.21'
])
param version string = '8.0.21'

@description('Availability Zone information of the server. (Leave blank for No Preference).')
param availabilityZone string = '1'

@description('High availability mode for a server : Disabled, SameZone, or ZoneRedundant')
@allowed([
  'Disabled'
  'SameZone'
  'ZoneRedundant'
])
param haEnabled string = 'Disabled'

@description('Availability zone of the standby server.')
param standbyAvailabilityZone string = '2'

param storageSizeGB int = 20
param storageIops int = 360
@allowed([
  'Enabled'
  'Disabled'
])
param storageAutogrow string = 'Enabled'

@description('The name of the sku, e.g. Standard_D32ds_v4.')
param skuName string = 'Standard_B1ms'

param backupRetentionDays int = 7
@allowed([
  'Disabled'
  'Enabled'
])
param geoRedundantBackup string = 'Disabled'
param serverName string = '${collectiveResourcePrefixLabel}-psqlserver'
param databaseName string = '${collectiveResourcePrefixLabel}-pmysqldb'

resource server 'Microsoft.DBforMySQL/flexibleServers@2021-12-01-preview' = {
  location: location
  name: serverName
  sku: {
    name: skuName
    tier: serverEdition
  }
  properties: {
    version: version
    administratorLogin: administratorLogin
    administratorLoginPassword: administratorLoginPassword
    availabilityZone: availabilityZone
    highAvailability: {
      mode: haEnabled
      standbyAvailabilityZone: standbyAvailabilityZone
    }
    storage: {
      storageSizeGB: storageSizeGB
      iops: storageIops
      autoGrow: storageAutogrow
    }
    backup: {
      backupRetentionDays: backupRetentionDays
      geoRedundantBackup: geoRedundantBackup
    }
  }
}
resource database 'Microsoft.DBforMySQL/flexibleServers/databases@2021-12-01-preview' = {
  parent: server
  name: databaseName
  properties: {
    charset: 'utf8'
    collation: 'utf8_general_ci'
  }
}

// MYSQL CONNECTION STRING
// HOST, USERNAME, PASSWORD, PORT, 
var hostPort = 3306
var hostURL = '${serverName}.mysql.database.azure.com'
var connectionStringMySQL = 'mysql://${administratorLogin}:${administratorLoginPassword}@${hostURL}:${hostPort}/${databaseName}'

output connectionStringMySQL string = connectionStringMySQL

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
      capacity: 1
      family: 'C'
      name: 'Basic'
    }
  }
}
var redisCacheRestUrl = redis_instance.properties.hostName
// var redisPort = redis_instance.properties.sslPort
var redisCacheKey = redis_instance.listKeys().primaryKey 
// var redisCacheKey = redis_instance.properties.accessKeys.primaryKey

output redisCacheRestUrl string = 'https://${redisCacheRestUrl}'
output redisCacheKey string = redisCacheKey


// 4.
// CONTAINER PRE-SETUP INSTANCES
// param appNamePostFix string = 'p-app'
var appEnvironmentName = '${collectiveResourcePrefixLabel}-p-apps-environment'
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
              name: 'EDITOR_PASSWORD_SIGNING_KEY'
              value: ''
            }
            {
              name: 'POCKETBASE_DATABASE_CONNECTION_STRING'
              value: ''
            }

            {
              name: 'PRISMA_SQL_DATABASE_SERVICE_CONNECTION_STRING'
              value: connectionStringMySQL
            }

            {
              name: 'REDIS_SERVICE_URL'
              value: ''
            }
            {
              name: 'REDIS_SERVICE_REST_URL'
              value: redisCacheRestUrl
            }
            {
              name: 'REDIS_SERVICE_REST_TOKEN'
              value: redisCacheKey
            }

            {
              name: 'NEXT_PUBLIC_AZURE_STORAGE_ACCOUNT_NAME'
              value: storageAccountName
            }
            {
              name: 'NEXT_PUBLIC_AZURE_STORAGE_CONTAINER_NAME'
              value: storageContainerName
            }
            {
              name: 'NEXT_PUBLIC_AZURE_SERVICE_CONNECTION_STRING'
              value: connectionStringSAS
            }

            {
              name: 'NEXT_PUBLIC_UPLOADCARE_SERVICE_PUBLIC_KEY'
              value: ''
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
