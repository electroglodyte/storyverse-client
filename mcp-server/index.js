// index.js
import { setupServer } from './server.js';
import { loadMcpModules } from './load-mcp.js';

// Start server with DB initialization
async function runServer() {
  try {
    console.error("Starting MCP server...");
    
    // Load MCP modules directly from file paths
    const { StdioServerTransport } = await loadMcpModules();
    
    const server = await setupServer();
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("StoryVerse MCP Server running with database access");
  } catch (error) {
    console.error("Fatal error running server:", error);
    process.exit(1);
  }
}

runServer();