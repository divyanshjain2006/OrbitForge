# Deployment notes

The client is built with Vite and proxies `/api` to the Express server in development. The server requires a MongoDB connection configured through `server/.env` (`MONGODB_URI`). Production deployment and database operations have not been validated in this final pass. Follow the root README for local commands and treat this prototype’s current no-auth API as local/demo-only.
