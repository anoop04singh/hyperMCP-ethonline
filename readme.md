# **HyperMCP**

**Built by [@0xanoop](https://x.com/0xanoop)** for the **Envio AI + Tooling Hackathon at ETHONLINE**

---

## **Overview**

**HyperMCP** is a **Model Context Protocol (MCP)** server that integrates **Envio's blockchain indexing capabilities** directly into AI assistants such as **Claude Desktop**.
It offers **35+ intelligent tools** for developers to build, query, and manage blockchain indexers using natural language.

---

## **What is Envio?**

Envio provides **high-performance blockchain data infrastructure** through:

| Component      | Description                                                          |
| -------------- | -------------------------------------------------------------------- |
| **HyperIndex** | Real-time blockchain indexing framework (100× faster than subgraphs) |
| **HyperSync**  | Ultra-fast blockchain data queries across 70+ networks               |
| **HyperRPC**   | High-performance RPC endpoints                                       |

---

## **What is MCP?**

The **Model Context Protocol (MCP)** allows AI assistants to securely connect with external data sources and tools.
**HyperMCP** implements this protocol to make Envio’s stack accessible via **conversational AI**.

---

## **Features**

### **HyperIndex Tools (15+ commands)**

#### Project Initialization

* Initialize new indexer projects from scratch
* Import contracts from block explorers (70+ networks)
* Import contracts from local ABI files
* Use pre-built templates (ERC20, Greeter, etc.)

#### Development Workflow

* Run development mode with hot reloading
* Generate TypeScript/JavaScript types from config
* Validate configuration files
* Generate event handler templates
* Create GraphQL schemas

#### Environment Management

* Start/stop local Docker containers
* Manage database migrations
* Benchmark performance
* Configure multi-chain environments

---

### **HyperSync Tools (5+ commands)**

#### Data Querying

* Query blockchain event logs with advanced filters
* Query transactions by address, hash, or block range
* Stream real-time blockchain events
* Build custom queries with field selection
* Access 70+ EVM-compatible networks

#### Query Optimization

* Automatic pagination
* Efficient field selection
* Reverse search (latest-first)
* Implicit data joins (logs → transactions → blocks)

---

### **Documentation Tools (5+ commands)**

* Semantic search across HyperIndex, HyperSync, and HyperRPC docs
* Retrieve configuration references and code examples
* Context-aware error troubleshooting
* Migration guides from other platforms

---

### **Configuration Tools (5+ commands)**

* Create `config.yaml` templates
* Add networks and contracts dynamically
* Validate configuration syntax
* Generate complete project structures
* Multi-chain setup helpers

---

## **Quick Start**

### **Prerequisites**

* Node.js 18+
* npm or pnpm
* Claude Desktop app
* Envio CLI *(optional for full functionality)*

---

### **Installation**

```bash
git clone https://github.com/anoop04singh/hyperMCP-ethonline
cd hyperMCP-ethonline
npm install
npm run build
```

Install Envio CLI *(optional but recommended)*:

```bash
npm install -g envio
```

Get a **HyperSync API Token** from [envio.dev/app/api-tokens](https://envio.dev/app/api-tokens)

---

## **Connect to Claude Desktop**

### Step 1: Locate Config File

| OS          | Path                                                              |
| ----------- | ----------------------------------------------------------------- |
| **Windows** | `%APPDATA%\Claude\claude_desktop_config.json`                     |
| **macOS**   | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| **Linux**   | `~/.config/Claude/claude_desktop_config.json`                     |

---

### Step 2: Add HyperMCP Configuration

```json
{
  "mcpServers": {
    "hypermcp": {
      "command": "node",
      "args": ["/absolute/path/to/hypermcp/dist/index.js"],
      "env": {
        "HYPERSYNC_API_TOKEN": "your-api-token-here"
      }
    }
  }
}
```

> Replace `/absolute/path/to/hypermcp` with your actual project path.

---

### Step 3: Restart Claude Desktop

* Press **Ctrl+R** (Windows/Linux) or **Cmd+R** (macOS)
* Or quit and reopen the app

---

### Step 4: Verify Connection

Click the **tools icon** in Claude’s interface.
If you see 35+ HyperMCP tools, you’re ready to go.

---

## **Usage Examples**

### Example 1: Create USDC Indexer on Base

**You say:**

> "Help me create an indexer for USDC transfers on Base, starting from block 10000000."

**Claude will:**

* Import USDC contract via explorer
* Generate transfer event handler
* Validate configuration
* Provide setup instructions

---

### Example 2: Query Recent Uniswap V3 Swaps

**You say:**

> "Show me the last 10 Uniswap V3 swaps on Ethereum with amounts and prices."

**Claude will:**

* Get Ethereum endpoint
* Query swap events
* Decode and format results with transaction details

---

### Example 3: Multi-Chain NFT Indexer

**You say:**

> "Set up an indexer for Bored Ape Yacht Club transfers on Ethereum and Base."

**Claude will:**

* Import contracts for both chains
* Configure multi-chain template
* Generate `Transfer` handlers
* Enable unordered multi-chain mode

---

### Example 4: Debug Configuration

**You say:**

> "My config.yaml isn’t working. Can you check what’s wrong?"

**Claude will:**

* Validate the config file
* Diagnose errors
* Suggest exact fixes

---

## **Available Tools**

### **HyperIndex Commands**

| Tool                                     | Description                   |
| ---------------------------------------- | ----------------------------- |
| hyperindex_check_installation            | Verify Envio CLI installation |
| hyperindex_init_project                  | Create new indexer project    |
| hyperindex_init_contract_import_explorer | Import contract via explorer  |
| hyperindex_init_contract_import_local    | Import from local ABI         |
| hyperindex_init_template                 | Use pre-built template        |
| hyperindex_dev                           | Start development mode        |
| hyperindex_codegen                       | Generate types from config    |
| hyperindex_start / stop                  | Manage local environment      |
| hyperindex_local_docker_up / down        | Manage Docker                 |
| hyperindex_local_db_migrate_setup        | Setup database schema         |
| hyperindex_benchmark_summary             | View performance metrics      |
| hyperindex_validate_config               | Validate config               |
| hyperindex_generate_handler              | Generate handler template     |

---

### **HyperSync Commands**

| Tool                           | Description             |
| ------------------------------ | ----------------------- |
| hypersync_query_logs           | Query event logs        |
| hypersync_query_transactions   | Query transactions      |
| hypersync_build_query          | Build custom query      |
| hypersync_get_network_endpoint | Get network URL         |
| hypersync_stream_events        | Stream real-time events |

---

### **Documentation Commands**

| Tool                      | Description                |
| ------------------------- | -------------------------- |
| docs_search               | Search Envio documentation |
| docs_get_config_reference | Get config references      |
| docs_get_examples         | Retrieve code examples     |
| docs_troubleshoot_error   | Get error solutions        |

---

### **Configuration Commands**

| Tool                   | Description            |
| ---------------------- | ---------------------- |
| config_create_template | Generate `config.yaml` |
| config_add_network     | Add network            |
| config_add_contract    | Add contract           |

---

## **Project Structure**

```
hypermcp/
├── src/
│   ├── index.ts                 # Main MCP server
│   ├── tools/
│   │   ├── hyperindex.ts        # HyperIndex CLI tools
│   │   ├── hypersync.ts         # HyperSync tools
│   │   ├── documentation.ts     # Documentation tools
│   │   └── config.ts            # Config tools
│   └── utils/
│       ├── networks.ts          # Network config
│       ├── validators.ts        # Validation logic
│       ├── templates.ts         # Code templates
│       ├── errors.ts            # Error handling
│       └── constants.ts         # Constants
├── dist/                        # Compiled JS
├── package.json
├── tsconfig.json
└── README.md
```

---

## **Architecture**

```
┌─────────────────┐
│  Claude Desktop │
│   (AI Assistant)│
└────────┬────────┘
         │  MCP Protocol
         ▼
┌─────────────────┐
│    HyperMCP     │
│    MCP Server   │
└────────┬────────┘
         │
    ┌────┼────┐
    ▼    ▼    ▼
┌───────┐ ┌──────┐ ┌──────┐
│ Envio │ │ Sync │ │ Docs │
│  CLI  │ │ Tool │ │ API  │
└───────┘ └──────┘ └──────┘
```

---

## **Testing**

### Manual

```bash
node dist/index.js
```

Expected output:

```
Envio MCP Server running on stdio
```

### Using MCP Inspector

```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

This opens a UI to:

* View all available tools
* Test functions interactively
* Inspect requests and responses

---

## **Debugging**

### Check Logs

**macOS:**

```bash
tail -f ~/Library/Logs/Claude/mcp*.log
```

**Windows:**

```bash
type %APPDATA%\Claude\logs\mcp*.log
```

### Common Issues

| Problem                | Solution                           |
| ---------------------- | ---------------------------------- |
| Tools not showing      | Verify config path and JSON syntax |
| Envio binary not found | `npm install -g envio`             |
| Permission errors      | Run terminal as Administrator      |
| API token issues       | Get new token and restart Claude   |

---

## **Key Benefits**

- Natural Language Interface
- Instant Documentation Access
- Error Prevention and Validation
- Automatic Code Generation
- Multi-Chain Compatibility
- Real-Time Blockchain Queries
- Template-Based Setup
- Best-Practice Recommendations

---

## **Links**

* [Envio Documentation](https://docs.envio.dev)
* [HyperSync Explorer](https://hypersync.xyz)
* [Model Context Protocol](https://modelcontextprotocol.io)
* [Envio Discord](https://discord.gg/envio)
* [GitHub Repository](https://github.com/anoop04singh/hyperMCP-ethonline)


---

## **Roadmap**

* Add support for **Fuel blockchain indexing**
* Implement **GraphQL query builder**
* Add **subgraph migration tools**
* Create **visual config editor**
* Add **deployment to hosted service**
* Enable **real-time sync monitoring**
* Add **custom RPC endpoint support**
* Provide **example templates**

---

## **Stats**

| Metric             | Value                           |
| ------------------ | ------------------------------- |
| MCP Tools          | 35+                             |
| Supported Networks | 70+                             |
| Core Modules       | 3 (HyperIndex, HyperSync, Docs) |
| Language           | 100% TypeScript                 |
| Data               | Real-time blockchain streaming  |

---

*Built by [@0xanoop](https://x.com/0xanoop) for the Envio AI + Tooling Hackathon*
