# File Tree System Documentation

## 📁 Overview

This directory contains comprehensive documentation for the **File Tree System** - a cross-feature, dynamic file tree component built with React Query + Zustand + dnd-kit for maximum performance, modularity, and scalability.

## 🎯 Key Features

- **Cross-Feature Support**: Works across workspace, files, and upload features
- **Dynamic Data Handling**: No hardcoded content, fully data-driven
- **Context-Aware**: Different behaviors based on usage context
- **Performance Optimized**: React Query + Zustand + virtualization
- **Drag & Drop**: Full dnd-kit integration with multi-item support
- **Accessibility**: Complete keyboard navigation and screen reader support
- **Mobile Responsive**: Touch-friendly interactions

## 📋 Documentation Structure

### 📄 [ARCHITECTURE.md](./ARCHITECTURE.md)

- **Complete system architecture and design patterns**
- Technology stack and component organization
- Use cases and context-specific behaviors
- State management patterns
- Performance considerations
- Security and type safety requirements

### 🔧 [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)

- **Step-by-step implementation instructions**
- Phase-by-phase development approach
- Code examples for all components
- Testing strategies and performance optimization
- Deployment checklist

## 🏗️ Component Structure

```
src/components/file-tree/
├── tree-provider.tsx              # Context provider for tree state
├── tree-container.tsx             # Main tree wrapper
├── tree-node.tsx                  # Individual tree node
└── index.ts                       # Component barrel exports

src/lib/hooks/file-tree/
├── use-tree-state.ts              # Tree state management
├── use-tree-actions.ts            # Tree actions (expand, select, etc.)
├── use-tree-drag.ts               # Drag and drop logic
└── index.ts                       # Hooks barrel exports

src/contexts/file-tree/
├── workspace-context.tsx          # Workspace-specific context menu
├── files-context.tsx              # Files feature context menu
├── upload-context.tsx             # Upload feature context menu
├── context-menu-wrapper.tsx       # Context menu wrapper component
└── index.ts                       # Context barrel exports

src/types/file-tree/
├── tree-types.ts                  # Core tree interfaces
├── context-types.ts               # Context-specific types
└── index.ts                       # Types barrel exports
```

## 🎯 Usage Contexts

### 1. **Workspace Context**

- Personal file management
- Full CRUD operations
- Context menus for all actions
- Inline folder creation icons

### 2. **Files Feature Context**

- Two-panel layout (links + workspace)
- Links as read-only expandable folders
- Drag from links to workspace
- Limited context menu options

### 3. **Upload Context**

- File organization during upload
- Dynamic folder creation
- Temporary structure management
- Upload-specific operations

## 🔧 Technology Stack

- **React Query**: Server state management and caching
- **Zustand**: Client state management for tree interactions
- **dnd-kit**: Drag and drop functionality
- **animate-ui**: Base component styling and animations
- **Radix Context Menu**: Right-click/tap-hold interactions

## 📊 Performance Features

- **Virtualization**: Handles 1000+ nodes efficiently
- **Memoization**: React.memo for optimal re-renders
- **Optimistic Updates**: Immediate UI feedback
- **Smart Caching**: React Query background refetching
- **Selective Re-renders**: Zustand subscription optimization

## 🔒 Implementation Rules

1. **NO COMPONENT LARGER THAN 500 LINES**
2. **SINGLE SOURCE OF TRUTH**: All types from `src/lib/supabase`
3. **MAXIMUM MODULARITY**: Clear separation of concerns
4. **NO OVER-ENGINEERING**: Keep components simple and straightforward
5. **2025 BEST PRACTICES**: Follow latest React/TypeScript standards

## 🚀 Quick Start

### Basic Usage

```typescript
import { TreeContainer } from '@/components/file-tree'

// Workspace usage
<TreeContainer
  contextType="workspace"
  data={workspaceData}
  multiSelect={true}
  dragEnabled={true}
  contextMenuEnabled={true}
/>

// Files feature usage
<TreeContainer
  contextType="files"
  data={linksData}
  multiSelect={true}
  dragEnabled={false}
  contextMenuEnabled={false}
/>
```

### With React Query

```typescript
const { data: workspaceData } = useQuery({
  queryKey: ['workspace-tree'],
  queryFn: fetchWorkspaceTree,
})

return (
  <TreeContainer
    contextType="workspace"
    data={workspaceData || []}
    multiSelect={true}
    dragEnabled={true}
    contextMenuEnabled={true}
  />
)
```

## 📋 Implementation Phases

### Phase 1: Core Infrastructure (Week 1)

- [x] Create directory structure
- [x] Define TypeScript interfaces
- [x] Implement Zustand store
- [x] Set up React Query hooks

### Phase 2: Core Components (Week 2)

- [x] TreeContainer component
- [x] TreeNode component
- [x] Basic drag and drop
- [x] State management integration

### Phase 3: Context System (Week 3)

- [x] Context menu wrapper
- [x] Context-specific menus
- [x] Mobile touch support
- [x] Accessibility features

## 🧪 Testing Requirements

- **Unit Tests**: All hooks and components
- **Integration Tests**: Drag and drop workflows
- **Context Menu Tests**: All menu interactions
- **Performance Tests**: Large tree handling
- **Accessibility Tests**: Screen reader compatibility

## 🔗 Related Documentation

- **[Project Architecture](../../architecture/ARCHITECTURE.md)**: Overall system design
- **[Type Architecture](../../architecture/TYPE_ARCHITECTURE.md)**: Type system design
- **[React Query Migration](../react-query-migration/)**: Server state patterns
- **[Communication Strategy](../../architecture/COMMUNICATION_STRATEGY.md)**: Component communication

## 📝 Additional Resources

### Libraries Referenced

- [React Query Documentation](https://tanstack.com/query/latest)
- [Zustand Documentation](https://zustand-demo.pmnd.rs/)
- [dnd-kit Documentation](https://dndkit.com/)
- [Radix UI Context Menu](https://www.radix-ui.com/docs/primitives/components/context-menu)

### Design Patterns

- [Component Trees Pattern](https://medium.com/better-programming/a-better-frontend-component-structure-component-trees-5a99ed6d1ece)
- [Vercel File Tree Design](https://vercel.com/design/file-tree)
- [React Complex Tree](https://rct.lukasbach.com/)

## 💡 Best Practices

### Performance

- Use React.memo for expensive components
- Implement virtualization for large trees
- Optimize Zustand subscriptions
- Debounce search and filter operations

### Accessibility

- Full keyboard navigation support
- Screen reader compatibility
- ARIA labels and descriptions
- Focus management

### Mobile Experience

- Touch-friendly interactions
- Responsive design patterns
- Gesture support for drag and drop
- Mobile-optimized context menus

---

**Status**: 📋 **Documentation Complete** - Ready for implementation
**Next Steps**: Begin Phase 1 implementation following the guide
