# DoThisApp Method Call Graph

This Mermaid flowchart shows all methods in the DoThisApp class and their calling relationships. Each box represents a method, and arrows point from each method to all methods it calls.

```mermaid
flowchart TD
    %% Constructor and Initialization
    constructor["constructor()"]
    init["init()"]
    validateDataIntegrity["validateDataIntegrity()"]
    bindEvents["bindEvents()"]
    
    %% Data Management
    saveTasks["saveTasks()"]
    loadTasks["loadTasks()"]
    getMaxTaskId["getMaxTaskId()"]
    
    %% Page Navigation
    showMainPage["showMainPage()"]
    showTrashPage["showTrashPage()"]
    
    %% UI State Management
    toggleTaskList["toggleTaskList()"]
    toggleSettings["toggleSettings()"]
    applySectionStates["applySectionStates()"]
    
    %% Task Editing
    showTaskEdit["showTaskEdit()"]
    hideTaskEdit["hideTaskEdit()"]
    handleTaskTypeToggle["handleTaskTypeToggle()"]
    handleEditTaskTypeToggle["handleEditTaskTypeToggle()"]
    toggleCooldownOptions["toggleCooldownOptions()"]
    toggleEditCooldownOptions["toggleEditCooldownOptions()"]
    
    %% Task CRUD Operations
    saveTask["saveTask()"]
    saveTaskEdit["saveTaskEdit()"]
    deleteTask["deleteTask()"]
    
    %% UI Synchronization
    refreshUI["refreshUI()"]
    updateRandomizerSection["updateRandomizerSection()"]
    updateTaskListSection["updateTaskListSection()"]
    updateControlButtons["updateControlButtons()"]
    renderTasks["renderTasks()"]
    
    %% Task Status and Stats
    getTaskStatus["getTaskStatus()"]
    getExecutionStats["getExecutionStats()"]
    getTimeAgo["getTimeAgo()"]
    getCooldownMs["getCooldownMs()"]
    calculateNextAvailableTime["calculateNextAvailableTime()"]
    formatCooldown["formatCooldown()"]
    formatCooldownTime["formatCooldownTime()"]
    getAvailableTasks["getAvailableTasks()"]
    isTaskActive["isTaskActive()"]
    
    %% UI Component Updates
    toggleEmptyState["toggleEmptyState()"]
    updateRandomizeButton["updateRandomizeButton()"]
    updateDefaultTasksButton["updateDefaultTasksButton()"]
    updateRandomizerText["updateRandomizerText()"]
    updateTaskListCollapse["updateTaskListCollapse()"]
    updateStats["updateStats()"]
    
    %% Task Randomization
    randomizeTask["randomizeTask()"]
    showSelectedTask["showSelectedTask()"]
    acceptTask["acceptTask()"]
    showActiveTask["showActiveTask()"]
    showTaskCompleted["showTaskCompleted()"]
    nextTask["nextTask()"]
    
    %% Cooldown Management
    startCooldownChecking["startCooldownChecking()"]
    stopCooldownChecking["stopCooldownChecking()"]
    
    %% Active Task Management
    completeActiveTask["completeActiveTask()"]
    abandonActiveTask["abandonActiveTask()"]
    showAbandonReasonModal["showAbandonReasonModal()"]
    hideAbandonReasonModal["hideAbandonReasonModal()"]
    saveAbandonReason["saveAbandonReason()"]
    resetRandomizer["resetRandomizer()"]
    checkActiveTask["checkActiveTask()"]
    
    %% Timer Management
    startActiveTaskTimer["startActiveTaskTimer()"]
    clearActiveTaskTimer["clearActiveTaskTimer()"]
    updateActiveTaskTimer["updateActiveTaskTimer()"]
    
    %% UI Utilities
    setLoadingState["setLoadingState()"]
    showToast["showToast()"]
    escapeHtml["escapeHtml()"]
    
    %% Data Management and Debug
    cleanupCorruptedData["cleanupCorruptedData()"]
    debugData["debugData()"]
    exportTasksAsJson["exportTasksAsJson()"]
    addDefaultTasks["addDefaultTasks()"]
    resetEverything["resetEverything()"]
    debugDataConsole["debugDataConsole()"]
    cleanupCompletedOneOffTasks["cleanupCompletedOneOffTasks()"]
    
    %% Trash Management
    renderTrashList["renderTrashList()"]
    restoreTask["restoreTask()"]
    deleteTaskForever["deleteTaskForever()"]
    clearAllTrash["clearAllTrash()"]
    
    %% Method Call Relationships
    constructor --> init
    
    init --> loadTasks
    init --> cleanupCompletedOneOffTasks
    init --> bindEvents
    init --> applySectionStates
    init --> refreshUI
    init --> updateTaskListCollapse
    init --> checkActiveTask
    init --> validateDataIntegrity
    
    bindEvents --> saveTask
    bindEvents --> randomizeTask
    bindEvents --> acceptTask
    bindEvents --> nextTask
    bindEvents --> completeActiveTask
    bindEvents --> abandonActiveTask
    bindEvents --> handleTaskTypeToggle
    bindEvents --> toggleTaskList
    bindEvents --> toggleSettings
    bindEvents --> addDefaultTasks
    bindEvents --> exportTasksAsJson
    bindEvents --> resetEverything
    bindEvents --> debugDataConsole
    bindEvents --> cleanupCorruptedData
    bindEvents --> showTrashPage
    bindEvents --> showMainPage
    bindEvents --> clearAllTrash
    bindEvents --> saveAbandonReason
    bindEvents --> hideAbandonReasonModal
    
    loadTasks --> getMaxTaskId
    
    showMainPage --> refreshUI
    
    showTrashPage --> renderTrashList
    
    toggleTaskList --> refreshUI
    toggleTaskList --> saveTasks
    
    toggleSettings --> saveTasks
    
    showTaskEdit --> showToast
    showTaskEdit --> toggleTaskList
    showTaskEdit --> renderTasks
    
    hideTaskEdit --> renderTasks
    
    handleTaskTypeToggle --> toggleCooldownOptions
    
    handleEditTaskTypeToggle --> toggleEditCooldownOptions
    
    saveTask --> showToast
    saveTask --> saveTasks
    saveTask --> refreshUI
    saveTask --> updateStats
    saveTask --> updateRandomizeButton
    saveTask --> toggleCooldownOptions
    
    saveTaskEdit --> showToast
    saveTaskEdit --> saveTasks
    saveTaskEdit --> refreshUI
    saveTaskEdit --> updateStats
    saveTaskEdit --> updateRandomizeButton
    saveTaskEdit --> hideTaskEdit
    
    deleteTask --> saveTasks
    deleteTask --> refreshUI
    deleteTask --> updateStats
    deleteTask --> showToast
    deleteTask --> updateRandomizeButton
    deleteTask --> updateDefaultTasksButton
    deleteTask --> resetRandomizer
    
    refreshUI --> updateRandomizerSection
    refreshUI --> updateTaskListSection
    refreshUI --> updateControlButtons
    refreshUI --> updateStats
    
    updateRandomizerSection --> updateRandomizerText
    updateRandomizerSection --> updateRandomizeButton
    
    updateTaskListSection --> updateTaskListCollapse
    updateTaskListSection --> renderTasks
    updateTaskListSection --> toggleEmptyState
    
    updateControlButtons --> updateDefaultTasksButton
    
    renderTasks --> getTaskStatus
    renderTasks --> formatCooldown
    renderTasks --> getExecutionStats
    renderTasks --> escapeHtml
    renderTasks --> isTaskActive
    
    getTaskStatus --> calculateNextAvailableTime
    getTaskStatus --> formatCooldownTime
    
    getExecutionStats --> getTimeAgo
    
    calculateNextAvailableTime --> getCooldownMs
    
    getAvailableTasks --> getTaskStatus
    
    updateRandomizeButton --> getAvailableTasks
    updateRandomizeButton --> startCooldownChecking
    updateRandomizeButton --> stopCooldownChecking
    
    updateTaskListCollapse --> saveTasks
    
    randomizeTask --> stopCooldownChecking
    randomizeTask --> getAvailableTasks
    randomizeTask --> showToast
    randomizeTask --> setLoadingState
    randomizeTask --> showSelectedTask
    
    acceptTask --> stopCooldownChecking
    acceptTask --> saveTasks
    acceptTask --> refreshUI
    acceptTask --> showActiveTask
    acceptTask --> startActiveTaskTimer
    acceptTask --> showToast
    
    nextTask --> updateRandomizeButton
    
    startCooldownChecking --> stopCooldownChecking
    startCooldownChecking --> getAvailableTasks
    startCooldownChecking --> updateRandomizeButton
    
    completeActiveTask --> clearActiveTaskTimer
    completeActiveTask --> saveTasks
    completeActiveTask --> refreshUI
    completeActiveTask --> updateStats
    completeActiveTask --> updateRandomizeButton
    completeActiveTask --> showTaskCompleted
    
    abandonActiveTask --> showAbandonReasonModal
    
    saveAbandonReason --> showToast
    saveAbandonReason --> clearActiveTaskTimer
    saveAbandonReason --> saveTasks
    saveAbandonReason --> refreshUI
    saveAbandonReason --> resetRandomizer
    saveAbandonReason --> hideAbandonReasonModal
    
    checkActiveTask --> saveTasks
    checkActiveTask --> showToast
    checkActiveTask --> resetRandomizer
    checkActiveTask --> showActiveTask
    checkActiveTask --> startActiveTaskTimer
    
    startActiveTaskTimer --> clearActiveTaskTimer
    startActiveTaskTimer --> setLoadingState
    startActiveTaskTimer --> saveTasks
    startActiveTaskTimer --> showToast
    startActiveTaskTimer --> resetRandomizer
    startActiveTaskTimer --> updateActiveTaskTimer
    
    setLoadingState --> getAvailableTasks
    
    cleanupCorruptedData --> saveTasks
    cleanupCorruptedData --> refreshUI
    cleanupCorruptedData --> updateStats
    cleanupCorruptedData --> showToast
    
    debugData --> getExecutionStats
    
    exportTasksAsJson --> showToast
    
    addDefaultTasks --> saveTasks
    addDefaultTasks --> refreshUI
    addDefaultTasks --> updateStats
    addDefaultTasks --> updateRandomizeButton
    addDefaultTasks --> updateDefaultTasksButton
    addDefaultTasks --> showToast
    
    resetEverything --> clearActiveTaskTimer
    resetEverything --> refreshUI
    resetEverything --> updateStats
    resetEverything --> updateDefaultTasksButton
    resetEverything --> resetRandomizer
    resetEverything --> toggleSettings
    resetEverything --> showToast
    
    debugDataConsole --> debugData
    debugDataConsole --> showToast
    
    cleanupCompletedOneOffTasks --> saveTasks
    
    renderTrashList --> escapeHtml
    
    restoreTask --> saveTasks
    restoreTask --> renderTrashList
    restoreTask --> showToast
    
    deleteTaskForever --> saveTasks
    deleteTaskForever --> renderTrashList
    deleteTaskForever --> showToast
    
    clearAllTrash --> showToast
    clearAllTrash --> saveTasks
    clearAllTrash --> renderTrashList
    
    %% Styling for better readability
    classDef init fill:#e1f5fe
    classDef ui fill:#f3e5f5
    classDef data fill:#e8f5e8
    classDef task fill:#fff3e0
    classDef timer fill:#ffebee
    
    class constructor,init,validateDataIntegrity,bindEvents init
    class refreshUI,updateRandomizerSection,updateTaskListSection,updateControlButtons,renderTasks,toggleEmptyState,updateRandomizeButton,updateDefaultTasksButton,updateRandomizerText,updateTaskListCollapse,updateStats,showMainPage,showTrashPage,toggleTaskList,toggleSettings ui
    class saveTasks,loadTasks,getMaxTaskId,cleanupCorruptedData,debugData,exportTasksAsJson,addDefaultTasks,resetEverything,debugDataConsole,cleanupCompletedOneOffTasks data
    class saveTask,saveTaskEdit,deleteTask,randomizeTask,acceptTask,completeActiveTask,abandonActiveTask,getTaskStatus,getAvailableTasks,isTaskActive task
    class startActiveTaskTimer,clearActiveTaskTimer,updateActiveTaskTimer,startCooldownChecking,stopCooldownChecking timer
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