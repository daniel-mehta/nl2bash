# nl2bash

A safe and intelligent tool that converts natural language requests into executable bash commands. Built with safety-first principles to prevent destructive operations while providing accurate command suggestions.

## Features

- **Natural Language Processing**: Convert plain English descriptions into bash commands
- **Safety Layer**: Hard-coded blocking of dangerous operations (rm -rf, dd, etc.)
- **Risk Assessment**: Automatic risk level classification (low/medium/high)
- **Dry Run Support**: Preview commands before execution
- **Assumption Tracking**: Lists any assumptions made during command generation
- **Web Interface**: Clean React-based UI for easy interaction
- **REST API**: Programmatic access via Next.js API routes

## Safety Features

The system includes multiple layers of protection:

- **Hard-blocked Commands**: Prevents generation of inherently dangerous commands
- **Risk Escalation**: Automatically upgrades risk levels for potentially harmful operations

### Blocked Operations
- `rm -rf /` or equivalent destructive deletions
- `mkfs`, `dd` on disks
- Fork bombs and infinite loops
- `curl | sh` or piping remote scripts
- Unauthorized `sudo` usage

## Installation

### Prerequisites
- Node.js 18+
- npm or yarn
- OpenAI API key

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/daniel-mehta/nl2bash.git
   cd nl2bash
   ```

2. **Install root dependencies**
   ```bash
   npm install
   ```

3. **Install web dependencies**
   ```bash
   cd web
   npm install
   cd ..
   ```

4. **Environment Configuration**

   Create `.env` file in the `web/` directory:
   ```bash
   cd web
   cp .env.example .env
   ```

   Edit `web/.env` and add your OpenAI API key:
   ```env
   OPENAI_API_KEY=your_api_key_here
   OPENAI_MODEL=gpt-4.1-mini
   ```

## Usage

### Web Interface

1. **Start the development server**
   ```bash
   cd web
   npm run dev
   ```

2. **Open your browser** to `http://localhost:5173`

3. **Enter natural language requests** like:
   - "list all files modified in the last 24 hours"
   - "find and delete empty directories"
   - "show disk usage by directory"

### API Usage

The API endpoint accepts POST requests with natural language and OS information:

```bash
curl -X POST http://localhost:5173/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "input": "list files modified in the last 24 hours",
    "os": "linux"
  }'
```

**Response Format:**
```json
{
  "commands": ["find . -mtime -1 -type f -ls"],
  "explanations": ["Finds all files modified within the last 24 hours and lists them with details"],
  "riskLevel": "low",
  "needsConfirmation": false,
  "assumptions": ["Assuming current directory is the target search location"],
  "dryRunCommands": []
}
```

### Local API Server

For simple testing, you can also run the Express server:

```bash
npm run dev
```

This starts a server on port 3000 with a basic `/generate` endpoint.

## Development

### Project Structure

```
nl2bash/
├── src/                    # Express server (testing)
│   └── index.ts
├── web/                    # Next.js web application
│   ├── src/
│   │   ├── app/
│   │   │   ├── api/generate/route.ts    # Main API endpoint
│   │   │   └── page.tsx                 # Main UI page
│   │   ├── components/                  # React components
│   │   │   ├── CommandBox.tsx
│   │   │   ├── Examples.tsx
│   │   │   └── Assumptions.tsx
│   │   └── lib/
│   │       ├── llm.ts                   # OpenAI integration
│   │       ├── safety.ts                # Safety validation
│   │       ├── schema.ts                # Zod schemas
│   │       └── riskContext.tsx          # React context
│   └── prompt/
│       └── prompt.txt                   # System prompt
├── package.json
└── README.md
```

### Development Commands

**Root directory:**
- `npm run dev` - Start Express server with hot reload
- `npm run build` - Build TypeScript
- `npm run start` - Start production server

**Web directory:**
- `npm run dev` - Start Vite dev server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Key Files

- **`web/prompt/prompt.txt`**: System instructions for the LLM
- **`web/src/lib/safety.ts`**: Safety validation and risk assessment
- **`web/src/lib/schema.ts`**: TypeScript schemas for API responses
- **`web/src/app/api/generate/route.ts`**: Main API route handler

## API Reference

### POST /api/generate

Converts natural language to bash commands.

**Request Body:**
```json
{
  "input": "string",     // Natural language description
  "os": "linux" | "macos" // Target operating system
}
```

**Response:**
```json
{
  "commands": string[],           // Generated bash commands
  "explanations": string[],       // Command explanations
  "riskLevel": "low" | "medium" | "high",
  "needsConfirmation": boolean,   // Whether user confirmation is required
  "assumptions": string[],        // Assumptions made during generation
  "dryRunCommands": string[]      // Safe preview commands
}
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | Your OpenAI API key | Required |
| `OPENAI_MODEL` | OpenAI model to use | `gpt-4.1-mini` |
| `PORT` | Port for Express server | `3000` |

## Made By:
- George Fotabong Jr
- Daniel Mehta

## License

ISC License - see package.json for details.

## Disclaimer

While this tool includes extensive safety measures, always review generated commands before execution. The authors are not responsible for any damage caused by misuse of generated commands.


