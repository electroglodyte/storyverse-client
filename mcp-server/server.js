// server.js
import { loadMcpModules } from './load-mcp.js';
import toolsModule from './tools/index.js';
import handlersModule from './handlers/index.js';
import express from 'express';
import cors from 'cors';
import analyzeRoutes from './routes/analyze-routes.js';

// Initialize MCP server
export async function setupServer() {
  // Load MCP modules directly from file paths
  const { Server, CallToolRequestSchema, ListToolsRequestSchema } = await loadMcpModules();
  
  const server = new Server(
    {
      name: "StoryVerse MCP Server",
      version: "0.4.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Register tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    console.error("Received list_tools request");
    return {
      tools: Object.values(toolsModule)
    };
  });

  // Register tool handlers
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
      console.error(`Received call_tool request for: ${request.params.name}`);
      const { name, arguments: args } = request.params;
      
      // Look up the appropriate handler
      const handlerName = name;
      if (!handlersModule[handlerName]) {
        throw new Error(`Unknown tool: ${name}`);
      }
      
      // Call the handler
      const result = await handlersModule[handlerName](args);
      
      return result;
    } catch (error) {
      console.error("Error in call_tool handler:", error);
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  });

  // Setup RESTful API
  setupRestApi();

  return server;
}

// Setup Express-based REST API
function setupRestApi() {
  const app = express();
  
  // Middleware
  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  
  // Routes
  app.use('/', analyzeRoutes);
  
  // Default route
  app.get('/', (req, res) => {
    res.json({ message: 'StoryVerse MCP Server API', version: '0.4.0' });
  });
  
  // Start the server
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.error(`REST API running on port ${PORT}`);
  });
}