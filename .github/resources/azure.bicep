param location string = resourceGroup().location
// param appPlanName string = '${uniqueString(resourceGroup().id)}plan'

// CREATE A AZURE CONTAINER APP INSTANCE - WITH THE PRODOC IMAGE
// CREATE A AZURE STORAGE INSTANCE
// CREATE A AZURE MYSQL DATABASE INSTANCE
// CREATE A AZURE REDIS CACHING INSTANCE
// az bicep build --file azure.bicep --outdir .

// APP SERVICE GROUP
// resource appServicePlan 'Microsoft.Web/serverfarms@2020-12-01' = {
//   name: appPlanName
//   location: location
//   sku: {
//     name: 'F1'
//     capacity: 1
//   }
// }

param containerEnvironmentLabel string = 'prodoc-environments-app'
var logAnalyticsWorkspaceName = '${containerEnvironmentLabel}-logs-workspace'
var containerPort = 3000

resource logAnalyticsWorkspace 'Microsoft.OperationalInsights/workspaces@2020-03-01-preview' = {
  name: logAnalyticsWorkspaceName
  location: location
}

resource container_app_environment 'Microsoft.App/managedEnvironments@2022-03-01' = {
  name: 'prodoc-apps-environment'
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalyticsWorkspace.properties.customerId
        sharedKey: logAnalyticsWorkspace.listKeys().primarySharedKey
      }
    }
    vnetConfiguration: {
      internal: false

    }
  }
}

// CONTAINER APP INSTANCE
resource prodoc_container_app_instance 'Microsoft.App/containerApps@2022-11-01-preview' = {
  name: 'prodoc-app-instance'
  location: location
  tags: {
    channel: 'prodoc-quick-deploy'
  }
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
              value: 'leave-empty-or-set-to-use'
            }
            {
              name: 'EDITOR_PASSWORD_SIGNING_KEY'
              value: 'leave-empty-or-set-to-use'
            }
            {
              name: 'POCKETBASE_DATABASE_CONNECTION_STRING'
              value: 'leave-empty-or-set-to-use'
            }
            {
              name: 'PRISMA_SQL_DATABASE_SERVICE_CONNECTION_STRING'
              value: 'set-mysql-connection-string-to-use'
            }
            {
              name: 'REDIS_SERVICE_URL'
              value: 'leave-empty-or-set-to-use'
            }
            {
              name: 'REDIS_SERVICE_REST_URL'
              value: 'leave-empty-or-set-to-use'
            }
            {
              name: 'REDIS_SERVICE_REST_TOKEN'
              value: 'leave-empty-or-set-to-use'
            }
            {
              name: 'NEXT_PUBLIC_AZURE_SERVICE_CONNECTION_STRING'
              value: 'leave-empty-or-set-to-use'
            }
            {
              name: 'NEXT_PUBLIC_UPLOADCARE_SERVICE_PUBLIC_KEY'
              value: 'leave-empty-or-set-to-use'
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
    workloadProfileName: 'prodoc-app-instance-workload-profile'
  }
}

// STORAGE ACCOUNT INSTANCE
// resource storageaccount 'Microsoft.Storage/storageAccounts@2021-02-01' = {
//   name: 'prodoc-storage-account-instance'
//   location: location
//   kind: 'StorageV2'
//   sku: {
//     name: 'Standard_RAGZRS'
//   }
// }

// // REDIS INSTANCE
// resource redisCache 'Microsoft.Cache/redis@2022-06-01' = {
//   name: 'prodoc-redis-instance'
//   location: location
//   properties: {
//     redisVersion: '6.0.7'
//     replicasPerMaster: 1
//     shardCount: 1
//     sku: {
//       capacity: 1
//       family: 'P1v2'
//       name: 'Standard'
//     }
//   }
// }

// // MYSQL ISNTANCE
// resource mysqlServer 'Microsoft.DBforMySQL/servers@2017-12-01'= {
//   name: 'prodoc-mysql-instance'
//   location: location
//   sku: {
//     name: skuName
//     tier: SkuTier
//     capacity: skuCapacity
//     size: '${SkuSizeMB}'  //a string is expected here but a int for the storageProfile...
//     family: skuFamily
//   }
//   properties: {
//     createMode: 'Default'
//     version: '8.0'
//     administratorLogin: 'prodoc'
//     administratorLoginPassword: 'prodoc'
//     storageProfile: {
//       storageMB: 1000
//       backupRetentionDays: 7
//       geoRedundantBackup: 'Disabled'
//     }
//   }
// } 
