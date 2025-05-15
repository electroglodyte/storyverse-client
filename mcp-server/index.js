// index.js
const { setupServer } = require('./server');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');

// Create function to run SQL script against Supabase
const runSqlSetup = async () => {
  // Implementation...
};

// Start server with DB initialization
async function runServer() {
  try {
    console.error("Starting MCP server...");
    
    // Try to run database setup
    await runSqlSetup().catch(err => console.error("DB setup error:", err));
    
    const server = setupServer();
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("StoryVerse MCP Server running with database access");
  } catch (error) {
    console.error("Fatal error running server:", error);
    process.exit(1);
  }
}

runServer();