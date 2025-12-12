# Archipedia - Architectural Precedent Search Engine

A sophisticated web-based platform for discovering architectural projects through natural language descriptions or image uploads, with an integrated node-based workflow system for design exploration and analysis.

## Overview

Archipedia combines two powerful capabilities:

1. **Search Engine (Phase 1)**: Discover architectural precedents through text or image search with intelligent matching algorithms
2. **Node-Based Workflow System (Phase 2)**: Build visual workflows to explore, analyze, and generate design variations using a node-based canvas

The platform seamlessly integrates search results with workflow building, allowing architects to search for precedents, select projects, and transition into workflow mode where selected precedents become nodes on a canvas for further exploration.

## Features

### Search Engine

- **Text Search**: Describe architectural projects using natural language
- **Image Search**: Upload reference photos, sketches, or screenshots to find similar projects
- **Intelligent Matching**: Three adjustable weighting dials control result prioritization:
  - **Visual Similarity** (Blue): Form, materials, aesthetic style
  - **Spatial Logic** (Green): Layout, circulation, program organization
  - **Regional Similarity** (Orange): Climate, culture, building context
- **Advanced Filtering**: Year built, architectural style, building type, climate zone, project scale, architect nationality
- **Professional Interface**: Clean, minimal design with grid/list views, sorting, and responsive layout

### Node-Based Workflow System

- **Visual Programming**: Chain operations (nodes) to search, generate, analyze, and explore without writing code
- **Node Types**:
  - **Precedent Nodes**: Search and display architectural precedents
  - **Text Nodes**: Simple text container for storing and passing text information
  - **Image Nodes**: Image container with upload/drag-drop functionality
  - **LLM Nodes**: Language model analysis and transformation
  - **Image Generation Nodes**: AI-powered image generation
  - **Collection Nodes**: Organize and aggregate items
  - **Stacked Precedent Nodes**: Multiple precedents comparison with overlap analysis
  - **Attribute Filter Nodes**: Filter precedents by attributes
  - **Scalar Constraint Nodes**: Define custom scalar parameters with min/max constraints
  - **Relay Nodes (AND/OR/NOT)**: Small routing nodes for combining or filtering data flows
- **DAG-Based Execution**: Automatic topological sorting, cycle detection, and data flow
- **Intelligent Caching**: Avoid redundant API calls with automatic cache management
- **Type-Safe Connections**: Port type validation prevents invalid connections
- **Workflow Generation**: LLM-powered conversational workflow creation
- **Recursive Spawning**: Right-click nodes to spawn parameter variations

### Research Interface

The Results Page (`/results`) provides:
- **Search Results**: Card grid view with search results, filters, and selection
- **Fusion Weights**: Adjustable sliders for Visual, Spatial, and Regional similarity weighting
- **Node Canvas**: Drag selected precedents onto canvas to create workflow nodes
- **Right Sidebar**: Research panel with fusion weights and filters (Agent tab removed)

## Technology Stack

- **React 18+** with Vite
- **TypeScript** for type safety
- **Wouter** for routing
- **Zustand** for state management
- **React Flow** for node canvas
- **Tailwind CSS** for styling
- **Shadcn/UI** components
- **Framer Motion** for animations
- **Lucide React** for icons

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Navigate to `http://localhost:3000` to see the application.

### Building

```bash
npm run build
```

The build output will be in the `build` directory.

## Project Structure

```
src/
├── components/
│   ├── Canvas/              # Node canvas components
│   │   ├── InfiniteCanvas.tsx
│   │   ├── NodeCanvas.tsx
│   │   ├── CanvasToolbar.tsx
│   │   └── ViewModeToggle.tsx
│   ├── Nodes/               # Node type components
│   │   ├── BaseNode.tsx
│   │   ├── PrecedentNode.tsx
│   │   ├── TextNode.tsx
│   │   ├── LLMNode.tsx
│   │   ├── ImageGenNode.tsx
│   │   ├── ThreeDNode.tsx
│   │   └── ...
│   ├── SearchResults/        # Search result components
│   ├── Sidebar/              # Filter panel and node palette
│   ├── Dialogs/              # Workflow generation dialogs
│   └── ui/                   # Shadcn/UI components
├── pages/
│   ├── Homepage.tsx          # Landing page
│   ├── TextSearchPage.tsx    # Text search interface
│   ├── ImageSearchPage.tsx   # Image upload interface
│   ├── ResultsPage.tsx       # Unified results + workflow page
│   └── ProjectDetailPage.tsx
├── stores/
│   ├── searchStore.ts        # Search state management
│   ├── canvasStore.ts       # Canvas state management
│   ├── executionStore.ts    # Workflow execution state
│   └── workflowStore.ts     # Workflow state
├── lib/
│   ├── NodeRegistry.ts      # Node type definitions
│   ├── CacheManager.ts      # Caching system
│   ├── DataFlowValidator.ts # Connection validation
│   ├── workflowEngine.ts    # Execution engine
│   ├── workflowGenerator.ts # LLM workflow generation
│   ├── layoutAlgorithms.ts  # Auto-layout functions
│   └── nodeFactory.ts       # Node creation utilities
├── types/
│   └── nodes.ts             # TypeScript interfaces
└── styles/
    └── globals.css          # Global styles
```

## Workflow System Architecture

### Core Components

#### 1. Node Registry (`src/lib/NodeRegistry.ts`)
Centralized definition of all node types with ports, parameters, metadata, and type compatibility checking.

#### 2. Cache Manager (`src/lib/CacheManager.ts`)
Intelligent caching system that:
- Generates cache keys from node parameters and inputs
- Stores execution results to avoid redundant API calls
- Supports TTL (time-to-live) for cache expiration
- Automatically evicts oldest entries when cache is full

#### 3. Data Flow Validator (`src/lib/DataFlowValidator.ts`)
Type-safe connection validation:
- Validates port type compatibility
- Checks for missing ports
- Detects invalid edge connections
- Provides warnings for unused outputs

#### 4. Workflow Engine (`src/lib/workflowEngine.ts`)
DAG-based execution with:
- Topological sorting for correct execution order
- Cycle detection to prevent infinite loops
- Caching integration for performance
- Parallel execution of independent nodes
- Error handling with status tracking

### Execution Flow

1. **Validation**: Check for cycles, validate edge types, check for missing required inputs
2. **Topological Sort**: Determine execution order based on dependencies
3. **Execution**: For each node in order:
   - Check cache (if enabled)
   - If cached: return cached result instantly
   - If not cached: execute node
   - Store result in cache
   - Update node visual status
   - Pass outputs to downstream nodes
4. **Progress Tracking**: Update execution store with progress, log each node execution
5. **Completion**: Mark all nodes as complete, show results in node previews

### Data Flow

Data flows between nodes through ports:
- **Input Ports**: Receive data from connected upstream nodes
- **Output Ports**: Send data to connected downstream nodes
- **Port Types**: `text`, `image`, `video`, `audio`, `3d`, `data`, `any`

### Example Workflows

**Text Processing Chain:**
```
[Precedent Node] → [Text Node] → [LLM Node] → [Text Node]
```

**Image Generation Pipeline:**
```
[Text Node] → [LLM Node] → [Image Gen Node]
```

**Multi-Branch Workflow:**
```
                    → [Image Gen A]
[Text Node] → [LLM] → [Image Gen B]
                    → [3D Node]
```

## Usage

### Search Workflow

1. Navigate to homepage (`/`)
2. Choose text search (`/search/text`) or image search (`/search/image`)
3. Enter query or upload image
4. View results in grid view (`/results`)
5. Adjust fusion weights (Visual, Spatial, Regional) to control result prioritization
6. Use filters to narrow results by typology, climate, and other attributes
7. Select multiple projects using checkboxes
8. Drag selected projects onto the canvas to create workflow nodes

### Workflow Building

1. **Add Nodes**: Use node palette (left sidebar) to add different node types:
   - **Text Node**: Simple container for text information
   - **Image Node**: Click to upload or drag & drop images
   - **Scalar Node**: Create custom parameters with title and units
   - **Attribute Filter**: Filter precedents by attributes
   - **Relay Nodes**: AND/OR/NOT for routing and combining data flows
2. **Connect Nodes**: Drag from output port (right side) to input port (left side)
3. **Configure Nodes**: Set parameters in the right-side Node Inspector panel
4. **Run Individual Nodes**: Click "RUN" button on any node to execute it
5. **Run Entire Workflow**: Click "Run Workflow" button in toolbar
6. **View Results**: Execution status and results appear in node previews

### Node Features

- **Text Node**: Simple text container - no generation, just stores and passes text
- **Image Node**: Upload images via click or drag & drop
- **Scalar Node**: Create custom parameters with:
  - Custom title
  - Custom units (e.g., m, kg, %)
  - Min/max value constraints
  - Template-based quick add or fully custom creation
- **Relay Nodes**: Small, compact nodes for routing data:
  - **AND**: Combine multiple inputs
  - **OR**: Union of multiple inputs
  - **NOT**: Exclude one set from another

## Design System

### Colors
- Canvas Background: `#F5F1E8` (Warm beige)
- Precedent Nodes: `#FFC800` (Yellow)
- Text Nodes: `#F5F1E8` (Beige)
- 3D Nodes: `#90A4AE` (Gray)
- AI Nodes: `#4CAF50` (Green)
- Overseer Nodes: `#4CAF50` (Green, 4px border)
- Primary Blue: `#4A90E2` (Visual similarity)
- Secondary Green: `#7ED321` (Spatial logic)
- Tertiary Orange: `#F5A623` (Regional similarity)

### Typography
- Headings: Space Grotesk (Bold)
- Body: Inter (Regular)
- Scale from 11px to 48px

### Node Dimensions
- Width: 280px
- Min-height: 180px
- Border radius: 12px
- Border: 2px solid (4px for overseer)
- Backdrop blur: 8px

## Deployment

### Vercel (Recommended)

1. **Install Vercel CLI** (optional):
   ```bash
   npm install -g vercel
   ```

2. **Build your project**:
   ```bash
   npm run build
   ```

3. **Deploy via Dashboard**:
   - Go to [vercel.com](https://vercel.com)
   - Sign up/login with GitHub
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel will auto-detect it's a Vite project
   - Click "Deploy"

4. **Or deploy via CLI**:
   ```bash
   vercel
   ```

### Netlify

1. Build your project: `npm run build`
2. Go to [netlify.com](https://netlify.com)
3. Drag and drop your `build` folder
4. Or connect your GitHub repo for automatic deployments

### GitHub Pages

1. Install gh-pages: `npm install --save-dev gh-pages`
2. Update `package.json` scripts:
   ```json
   "predeploy": "npm run build",
   "deploy": "gh-pages -d build"
   ```
3. Update `vite.config.ts` with base path
4. Deploy: `npm run deploy`
5. Enable GitHub Pages in repository settings

## Development Workflow

### Git Setup

1. **Create GitHub Repository**:
   - Go to [github.com/new](https://github.com/new)
   - Name your repository
   - Don't initialize with README

2. **Connect Local Repository**:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git add .
   git commit -m "Initial commit"
   git push -u origin main
   ```

3. **Daily Workflow**:
   ```bash
   git add .
   git commit -m "Description of changes"
   git push
   ```

### Troubleshooting

**Build Fails?**
- Check that all dependencies are in `package.json`
- Run `npm install` locally first
- Check build logs

**Routes Not Working?**
- For Vite SPA, configure redirects in hosting platform
- Or add `_redirects` file in `public/`: `/*    /index.html   200`

**Authentication Errors?**
- Use Personal Access Token instead of password
- GitHub → Settings → Developer settings → Personal access tokens

## Extending the System

### Adding a New Node Type

1. **Define Type** in `src/types/nodes.ts`:
   ```typescript
   export interface MyCustomNodeData extends BaseNodeData {
     type: 'custom';
     myParameter: string;
   }
   ```

2. **Add Execution Logic** in `src/lib/workflowEngine.ts`:
   ```typescript
   async function executeMyCustomNode(
     node: Node<NodeData>,
     context: NodeExecutionContext
   ): Promise<NodeExecutionResult> {
     const input = context.inputs.input || '';
     const result = // ... process the input
     return {
       outputs: { output: result },
       status: 'success',
     };
   }
   ```

3. **Create Component** in `src/components/Nodes/`:
   ```typescript
   export const MyCustomNode: React.FC<MyCustomNodeProps> = ({ data, selected }) => {
     return (
       <BaseNode data={data} selected={selected}>
         {/* Your node UI */}
       </BaseNode>
     );
   };
   ```

4. **Register** in `NodeRegistry.ts` and canvas component

## Future Enhancements

- Real search API integration
- Real LLM and image generation API integration
- User accounts and saved searches
- Advanced spatial analysis
- Climate zone mapping
- Export/import workflows
- Undo/redo functionality
- Keyboard shortcuts
- Real-time collaboration
- Workflow templates
- Performance metrics and analytics

## Attributions

This project includes components from [shadcn/ui](https://ui.shadcn.com/) used under [MIT license](https://github.com/shadcn-ui/ui/blob/main/LICENSE.md).

This project includes photos from [Unsplash](https://unsplash.com) used under [license](https://unsplash.com/license).

## License

Part of the ARCHIPEDIA Design System project.
