# Azure Deployment Channel

### The one click deploy setup
Prodoc offers one click deploy that utilizes Azures ARM to deploy the following services:
- For files - Azure Storage Account + container
- For database - Azure Cosmos DB for Mongo
- For caching - Azure Redis
- For Prodoc - Azure containers apps
- By pre-set all the configuration choices go for the lowest priced options in their category and all are co-located in the same resource group location.


### How to use it:
- Click on the azure deploy button found on the Github readme homepage
- Go to the Prodoc resource group created to find all the deployed resources
- Customize each to suit your needs.


### Things to do after
- Update CORS in your storage account as showcased here - this is a security requirement to limit uploads and calls to only the domain of the hosted service.


### Advanced recommendations
- MySql instances can be made more secure by putting them in azure vnets.
- Firewall rules can be set on services to limit them only the resources that use them.
- CORs rules can be set on services to limit them to only the resources that use them.

