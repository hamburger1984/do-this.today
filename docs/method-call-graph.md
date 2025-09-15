# DoThisApp Method Call Graph

This Mermaid flowchart shows all methods in the DoThisApp class and their calling relationships. Each box represents a method, and arrows point from each method to all methods it calls.

## High-Level Architecture Overview

```mermaid
graph TD
    A[constructor] --> B[init]
    B --> C[loadTasks]
    B --> D[bindEvents]
    B --> E[refreshUI]
    
    E --> F[updateRandomizerSection]
    E --> G[updateTaskListSection] 
    E --> H[updateControlButtons]
    E --> I[updateStats]
    
    J[saveTask] --> K[saveTasks]
    J --> E
    
    L[randomizeTask] --> M[acceptTask]
    M --> N[startActiveTaskTimer]
    
    O[completeActiveTask] --> K
    O --> E
    
    P[abandonActiveTask] --> Q[saveAbandonReason]
    Q --> K
    Q --> E
```

## Detailed Method Call Relationships

Due to the complexity of the full call graph (73 methods with hundreds of relationships), here are the key architectural patterns:

### 1. Initialization Flow
```mermaid
graph LR
    constructor --> init
    init --> loadTasks
    init --> bindEvents
    init --> refreshUI
    init --> validateDataIntegrity
```

### 2. UI Update Pattern
```mermaid
graph TD
    A[Any Data Change] --> B[saveTasks]
    A --> C[refreshUI]
    C --> D[updateRandomizerSection]
    C --> E[updateTaskListSection]
    C --> F[updateControlButtons]
    C --> G[updateStats]
```

### 3. Task Lifecycle
```mermaid
graph LR
    A[randomizeTask] --> B[showSelectedTask]
    B --> C[acceptTask]
    C --> D[showActiveTask]
    D --> E[completeActiveTask]
    D --> F[abandonActiveTask]
    E --> G[showTaskCompleted]
    F --> H[saveAbandonReason]
```

### 4. Data Persistence Flow
```mermaid
graph TD
    A[saveTask] --> B[saveTasks]
    C[deleteTask] --> B
    D[completeActiveTask] --> B
    E[saveAbandonReason] --> B
    F[resetEverything] --> B
```

## Method Count Summary

- **Total Methods**: 73
- **Constructor/Initialization**: 4 methods
- **UI Management**: 15 methods  
- **Data Management**: 10 methods
- **Task Operations**: 12 methods
- **Timer/Cooldown**: 5 methods
- **Utilities**: 8 methods
- **Trash Management**: 4 methods
- **Other**: 15 methods

## Key Observations

1. **Central Hub Methods**: `refreshUI()`, `saveTasks()`, and `showToast()` are called by many other methods
2. **Initialization Flow**: Constructor → init() → multiple setup methods
3. **UI Update Pattern**: Most CRUD operations call `refreshUI()` and `updateStats()`
4. **Task Lifecycle**: Clear flow from randomization → acceptance → completion/abandonment
5. **Data Persistence**: All state changes properly call `saveTasks()`

This diagram helps visualize the application's architecture and method dependencies for easier maintenance and debugging.