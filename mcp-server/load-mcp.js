// load-mcp.js
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Function to load modules directly from file paths
export async function loadMcpModules() {
  const sdkPath = join(__dirname, 'node_modules/@modelcontextprotocol/sdk/dist/esm');
  
  // Import server modules
  const serverIndexPath = join(sdkPath, 'server/index.js');
  console.error(`Trying to import Server module from: ${serverIndexPath}`);
  const serverModule = await import(`file://${serverIndexPath}`);
  
  // Import stdio module
  const stdioPath = join(sdkPath, 'server/stdio.js');
  console.error(`Trying to import StdioServerTransport from: ${stdioPath}`);
  const stdioModule = await import(`file://${stdioPath}`);
  
  // Log available exports from server module to help debug
  console.error('Server module exports:', Object.keys(serverModule));
  
  // Check if the schemas are directly available in the server module
  const CallToolRequestSchema = serverModule.CallToolRequestSchema || 
                              (serverModule.default && serverModule.default.CallToolRequestSchema);
  
  const ListToolsRequestSchema = serverModule.ListToolsRequestSchema || 
                               (serverModule.default && serverModule.default.ListToolsRequestSchema);
  
  if (!CallToolRequestSchema || !ListToolsRequestSchema) {
    console.error('Could not find schemas in server module, looking for types/schemas');
    
    // Try to import types.js which might contain the schemas
    try {
      const typesPath = join(sdkPath, 'types.js');
      const typesModule = await import(`file://${typesPath}`);
      console.error('Types module exports:', Object.keys(typesModule));
      
      if (typesModule.CallToolRequestSchema && typesModule.ListToolsRequestSchema) {
        return {
          Server: serverModule.Server,
          StdioServerTransport: stdioModule.StdioServerTransport,
          CallToolRequestSchema: typesModule.CallToolRequestSchema,
          ListToolsRequestSchema: typesModule.ListToolsRequestSchema,
        };
      }
    } catch (e) {
      console.error('Error importing types module:', e);
    }
    
    throw new Error('Unable to locate the required schema definitions');
  }
  
  return {
    Server: serverModule.Server,
    StdioServerTransport: stdioModule.StdioServerTransport,
    CallToolRequestSchema,
    ListToolsRequestSchema,
  };
}