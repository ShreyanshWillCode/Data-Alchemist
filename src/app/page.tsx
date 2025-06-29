"use client";
import React, { useState, useMemo, useCallback } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { DataGrid, type Column } from "react-data-grid";
import "react-data-grid/lib/styles.css";
import { Search, Filter, Plus, Download, Settings, FileDown, Upload, FileText, Wand2, AlertTriangle, CheckCircle, XCircle } from "lucide-react";

// ============================================================================
// AI SERVICE TYPES AND INTERFACES
// ============================================================================

/** AI service response structure */
interface AIResponse {
  success: boolean;
  data?: any;
  error?: string;
}

/** Natural language modification command structure */
interface ModificationCommand {
  action: 'update' | 'set' | 'change';
  field: string;
  value: string | number;
  condition?: {
    field: string;
    operator: 'equals' | 'contains' | 'greater' | 'less';
    value: string | number;
  };
  dataset: DatasetType;
}

/** AI rule recommendation structure */
interface RuleRecommendation {
  id: string;
  type: string;
  description: string;
  confidence: number;
  reasoning: string;
  suggestedParameters: Record<string, unknown>;
}

/** AI validation insight structure */
interface ValidationInsight {
  type: 'warning' | 'error' | 'info';
  message: string;
  field?: string;
  rowIndex?: number;
  suggestedFix?: string;
}

// ============================================================================
// AI SERVICE STUB (Replace with actual OpenAI API calls)
// ============================================================================

/**
 * AI service for natural language processing and data analysis
 * This is a stub implementation - replace with actual OpenAI API calls
 */
class AIService {
  /**
   * Parse natural language modification commands
   */
  static async parseModificationCommand(command: string, datasets: Record<DatasetType, DataRow[]>): Promise<ModificationCommand | null> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const lowerCommand = command.toLowerCase();
    
    // Parse "Change all PriorityLevels to 5"
    const priorityMatch = lowerCommand.match(/change\s+all\s+prioritylevels?\s+to\s+(\d+)/i);
    if (priorityMatch) {
      return {
        action: 'change',
        field: 'PriorityLevel',
        value: parseInt(priorityMatch[1]),
        dataset: 'clients'
      };
    }
    
    // Parse "Set MaxLoadPerPhase to 2 for GroupB workers"
    const loadMatch = lowerCommand.match(/set\s+maxloadperphase\s+to\s+(\d+)\s+for\s+(\w+)\s+workers?/i);
    if (loadMatch) {
      return {
        action: 'set',
        field: 'MaxLoadPerPhase',
        value: parseInt(loadMatch[1]),
        condition: {
          field: 'WorkerGroup',
          operator: 'equals',
          value: loadMatch[2]
        },
        dataset: 'workers'
      };
    }
    
    // Parse "Update all GroupA clients priority to 4"
    const groupMatch = lowerCommand.match(/update\s+all\s+(\w+)\s+clients?\s+priority\s+to\s+(\d+)/i);
    if (groupMatch) {
      return {
        action: 'update',
        field: 'PriorityLevel',
        value: parseInt(groupMatch[2]),
        condition: {
          field: 'GroupTag',
          operator: 'equals',
          value: groupMatch[1]
        },
        dataset: 'clients'
      };
    }
    
    return null;
  }

  /**
   * Generate rule recommendations based on data patterns
   */
  static async generateRuleRecommendations(datasets: Record<DatasetType, DataRow[]>): Promise<RuleRecommendation[]> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const recommendations: RuleRecommendation[] = [];
    
    // Analyze task co-occurrence patterns
    const clients = datasets.clients || [];
    const taskCooccurrence = new Map<string, number>();
    
    clients.forEach(client => {
      const taskIds = String(client.RequestedTaskIDs || '').split(',').filter(Boolean);
      for (let i = 0; i < taskIds.length; i++) {
        for (let j = i + 1; j < taskIds.length; j++) {
          const pair = `${taskIds[i]}-${taskIds[j]}`;
          taskCooccurrence.set(pair, (taskCooccurrence.get(pair) || 0) + 1);
        }
      }
    });
    
    // Find most common task pairs
    const sortedPairs = Array.from(taskCooccurrence.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
    
    sortedPairs.forEach(([pair, count]) => {
      if (count >= 2) {
        const [task1, task2] = pair.split('-');
        recommendations.push({
          id: `coRun-${task1}-${task2}`,
          type: 'coRun',
          description: `Tasks ${task1} and ${task2} often co-occur (${count} times)`,
          confidence: Math.min(count / 5, 0.9),
          reasoning: `Found ${count} clients requesting both tasks together`,
          suggestedParameters: { taskIds: [task1, task2] }
        });
      }
    });
    
    // Analyze worker load patterns
    const workers = datasets.workers || [];
    const groupLoads = new Map<string, { total: number; count: number }>();
    
    workers.forEach(worker => {
      const group = String(worker.WorkerGroup || '');
      const load = Number(worker.MaxLoadPerPhase || 0);
      const current = groupLoads.get(group) || { total: 0, count: 0 };
      current.total += load;
      current.count += 1;
      groupLoads.set(group, current);
    });
    
    groupLoads.forEach((stats, group) => {
      const avgLoad = stats.total / stats.count;
      if (avgLoad > 3) {
        recommendations.push({
          id: `loadLimit-${group}`,
          type: 'loadLimit',
          description: `${group} workers have high average load (${avgLoad.toFixed(1)})`,
          confidence: 0.8,
          reasoning: `Average MaxLoadPerPhase for ${group} is ${avgLoad.toFixed(1)}, suggesting potential overload`,
          suggestedParameters: { group, maxLoad: Math.floor(avgLoad * 0.8) }
        });
      }
    });
    
    return recommendations;
  }

  /**
   * Generate AI-based validation insights
   */
  static async generateValidationInsights(datasets: Record<DatasetType, DataRow[]>): Promise<ValidationInsight[]> {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const insights: ValidationInsight[] = [];
    
    // Analyze priority distribution
    const clients = datasets.clients || [];
    const priorities = clients.map(c => Number(c.PriorityLevel)).filter(p => !isNaN(p));
    
    if (priorities.length > 0) {
      const avgPriority = priorities.reduce((a, b) => a + b, 0) / priorities.length;
      const priorityVariance = priorities.reduce((sum, p) => sum + Math.pow(p - avgPriority, 2), 0) / priorities.length;
      
      if (priorityVariance < 0.5) {
        insights.push({
          type: 'warning',
          message: `Low priority variance detected. Most clients have similar priority levels (avg: ${avgPriority.toFixed(1)})`,
          suggestedFix: 'Consider diversifying priority levels for better resource allocation'
        });
      }
    }
    
    // Check for skill gaps
    const workers = datasets.workers || [];
    const tasks = datasets.tasks || [];
    
    const workerSkills = new Set<string>();
    workers.forEach(w => {
      String(w.Skills || '').split(',').forEach(skill => {
        if (skill.trim()) workerSkills.add(skill.trim().toLowerCase());
      });
    });
    
    const requiredSkills = new Set<string>();
    tasks.forEach(t => {
      String(t.RequiredSkills || '').split(',').forEach(skill => {
        if (skill.trim()) requiredSkills.add(skill.trim().toLowerCase());
      });
    });
    
    const missingSkills = Array.from(requiredSkills).filter(skill => !workerSkills.has(skill));
    if (missingSkills.length > 0) {
      insights.push({
        type: 'error',
        message: `Missing worker skills: ${missingSkills.join(', ')}`,
        suggestedFix: `Add workers with skills: ${missingSkills.join(', ')}`
      });
    }
    
    return insights;
  }

  /**
   * Suggest corrections for validation errors
   */
  static async suggestCorrections(error: string, row: DataRow, datasetType: DatasetType): Promise<string | null> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Fix malformed JSON
    if (error.includes('Invalid JSON')) {
      const attributes = String(row.AttributesJSON || '');
      if (attributes && attributes !== 'INVALID_JSON') {
        try {
          // Try to fix common JSON issues
          const fixed = attributes
            .replace(/(\w+):/g, '"$1":') // Add quotes to keys
            .replace(/'/g, '"'); // Replace single quotes with double quotes
          JSON.parse(fixed);
          return fixed;
        } catch {
          return '{}'; // Return empty object if can't fix
        }
      }
    }
    
    // Fix unknown TaskIDs
    if (error.includes('RequestedTaskIDs')) {
      const taskIds = String(row.RequestedTaskIDs || '');
      const validTaskIds = taskIds.split(',').filter(id => id.trim().startsWith('T'));
      if (validTaskIds.length > 0) {
        return validTaskIds.join(',');
      }
    }
    
    return null;
  }
}

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/** Supported dataset types */
type DatasetType = 'clients' | 'workers' | 'tasks';

/** Configuration for each dataset upload */
const DATASET_CONFIGS: Array<{ key: DatasetType; label: string }> = [
  { key: "clients", label: "Clients" },
  { key: "workers", label: "Workers" },
  { key: "tasks", label: "Tasks" },
];

/** Available rule types for the rules builder */
const RULE_TYPES = [
  { value: "coRun", label: "Co-Run Tasks" },
  { value: "slotRestriction", label: "Slot Restriction" },
  { value: "loadLimit", label: "Load Limit" },
  { value: "phaseWindow", label: "Phase Window" },
  { value: "regexMatch", label: "Regex Match" },
  { value: "precedenceOverride", label: "Precedence Override" },
] as const;

/** Rule structure for the rules builder */
interface Rule {
  id?: number;
  type: string;
  description: string;
  parameters: Record<string, unknown>;
}

/** Exported rules structure */
interface RulesExport {
  version: string;
  rules: Omit<Rule, 'id'>[];
  metadata: {
    createdAt: string;
    totalRules: number;
  };
}

/** Prioritization weights for task allocation */
interface PrioritizationWeights {
  priorityLevel: number;
  maxConcurrent: number;
  skillFit: number;
  fairness: number;
  cost: number;
  efficiency: number;
}

/** Generic row data type */
type DataRow = Record<string, unknown>;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Parses natural language search queries and filters data accordingly
 * @param query - The search query string
 * @param data - Array of data rows to filter
 * @returns Filtered array of data rows
 */
function parseNaturalLanguageQuery(query: string, data: DataRow[]): DataRow[] {
  if (!query.trim() || !data.length) return data;
  
  const lowerQuery = query.toLowerCase();
  const filters: Array<(row: DataRow) => boolean> = [];
  
  // Parse common search patterns
  const searchPatterns = [
    {
      pattern: /priority\s*>\s*(\d+)/,
      filter: (value: string) => (row: DataRow) => Number(row.PriorityLevel) > parseInt(value)
    },
    {
      pattern: /priority\s*<\s*(\d+)/,
      filter: (value: string) => (row: DataRow) => Number(row.PriorityLevel) < parseInt(value)
    },
    {
      pattern: /duration\s*>\s*(\d+)/,
      filter: (value: string) => (row: DataRow) => Number(row.Duration) > parseInt(value)
    },
    {
      pattern: /duration\s*<\s*(\d+)/,
      filter: (value: string) => (row: DataRow) => Number(row.Duration) < parseInt(value)
    },
    {
      pattern: /group\s*=\s*(\w+)/,
      filter: (group: string) => (row: DataRow) => 
        String(row.GroupTag || row.WorkerGroup || "").toLowerCase().includes(group.toLowerCase())
    },
    {
      pattern: /skills\s*=\s*([^,]+)/,
      filter: (skill: string) => (row: DataRow) => 
        String(row.Skills || row.RequiredSkills || "").toLowerCase().includes(skill.trim().toLowerCase())
    }
  ];

  // Apply pattern matching
  for (const { pattern, filter } of searchPatterns) {
    const match = lowerQuery.match(pattern);
    if (match) {
      filters.push(filter(match[1]));
      break; // Use first matching pattern
    }
  }
  
  // Fallback to general text search if no patterns match
  if (filters.length === 0) {
    filters.push((row: DataRow) => 
      Object.values(row).some(value => 
        String(value).toLowerCase().includes(lowerQuery)
      )
    );
  }
  
  return data.filter(row => filters.every(filter => filter(row)));
}

/**
 * Parses uploaded files (CSV or XLSX) and converts to structured data
 * @param file - The uploaded file
 * @param onDataParsed - Callback with parsed data
 */
function parseUploadedFile(file: File, onDataParsed: (data: DataRow[]) => void): void {
  const fileExtension = file.name.split(".").pop()?.toLowerCase();
  
  if (fileExtension === "csv") {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results: Papa.ParseResult<DataRow>) => onDataParsed(results.data),
    });
  } else if (fileExtension === "xlsx") {
    const reader = new FileReader();
    reader.onload = (event) => {
      const data = new Uint8Array(event.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json<DataRow>(sheet, { defval: "" });
      onDataParsed(jsonData);
    };
    reader.readAsArrayBuffer(file);
  } else {
    alert(`Unsupported file type: ${fileExtension}. Please upload .csv or .xlsx files.`);
  }
}

/**
 * Generates DataGrid columns from data structure
 * @param data - Array of data rows
 * @returns Array of column configurations
 */
function generateDataGridColumns(data: DataRow[]): Column<DataRow>[] {
  if (!data?.length) return [];
  
  return Object.keys(data[0]).map((key) => ({
    key,
    name: key,
    editable: true,
    resizable: true,
    width: 140,
  }));
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validates client data according to business rules
 * @param data - Array of client data rows
 * @returns Array of validation error messages
 */
function validateClientData(data: DataRow[]): string[] {
  const errors: string[] = [];
  const clientIds = new Set<string>();
  const requiredColumns = ['ClientID', 'ClientName', 'PriorityLevel', 'RequestedTaskIDs', 'GroupTag', 'AttributesJSON'];

  // Validate required columns
  if (data.length > 0) {
    const missingColumns = requiredColumns.filter(col => !Object.keys(data[0]).includes(col));
    if (missingColumns.length > 0) {
      errors.push(`Missing required columns: ${missingColumns.join(', ')}`);
    }
  }

  // Validate each row
  data.forEach((row, index) => {
    const rowNumber = index + 1;
    
    // Check for duplicate ClientID
    const clientId = String(row.ClientID || '');
    if (clientId && clientIds.has(clientId)) {
      errors.push(`Row ${rowNumber}: Duplicate ClientID "${clientId}"`);
    } else if (clientId) {
      clientIds.add(clientId);
    }

    // Validate PriorityLevel range (1-5)
    const priority = Number(row.PriorityLevel);
    if (isNaN(priority) || priority < 1 || priority > 5) {
      errors.push(`Row ${rowNumber}: PriorityLevel must be 1-5, got "${row.PriorityLevel}"`);
    }

    // Validate RequestedTaskIDs format (comma-separated T-prefixed IDs)
    const taskIds = String(row.RequestedTaskIDs || '');
    if (taskIds && !/^T\d+(,T\d+)*$/.test(taskIds)) {
      errors.push(`Row ${rowNumber}: RequestedTaskIDs should be comma-separated T-prefixed IDs, got "${taskIds}"`);
    }

    // Validate AttributesJSON format
    const attributes = String(row.AttributesJSON || '');
    if (attributes && attributes !== 'INVALID_JSON') {
      try {
        JSON.parse(attributes);
      } catch {
        errors.push(`Row ${rowNumber}: Invalid JSON in AttributesJSON: "${attributes}"`);
      }
    }
  });

  return errors;
}

/**
 * Validates worker data according to business rules
 * @param data - Array of worker data rows
 * @returns Array of validation error messages
 */
function validateWorkerData(data: DataRow[]): string[] {
  const errors: string[] = [];
  const workerIds = new Set<string>();
  const requiredColumns = ['WorkerID', 'WorkerName', 'Skills', 'AvailableSlots', 'MaxLoadPerPhase', 'WorkerGroup', 'QualificationLevel'];

  // Validate required columns
  if (data.length > 0) {
    const missingColumns = requiredColumns.filter(col => !Object.keys(data[0]).includes(col));
    if (missingColumns.length > 0) {
      errors.push(`Missing required columns: ${missingColumns.join(', ')}`);
    }
  }

  // Validate each row
  data.forEach((row, index) => {
    const rowNumber = index + 1;
    
    // Check for duplicate WorkerID
    const workerId = String(row.WorkerID || '');
    if (workerId && workerIds.has(workerId)) {
      errors.push(`Row ${rowNumber}: Duplicate WorkerID "${workerId}"`);
    } else if (workerId) {
      workerIds.add(workerId);
    }

    // Validate AvailableSlots format (JSON array of numbers)
    const slots = String(row.AvailableSlots || '');
    if (slots && slots !== 'not_a_list') {
      try {
        const parsedSlots = JSON.parse(slots);
        if (!Array.isArray(parsedSlots) || !parsedSlots.every(slot => Number.isInteger(Number(slot)))) {
          errors.push(`Row ${rowNumber}: AvailableSlots should be array of numbers, got "${slots}"`);
        }
      } catch {
        errors.push(`Row ${rowNumber}: AvailableSlots should be valid JSON array, got "${slots}"`);
      }
    }

    // Validate MaxLoadPerPhase (non-negative)
    const maxLoad = Number(row.MaxLoadPerPhase);
    if (isNaN(maxLoad) || maxLoad < 0) {
      errors.push(`Row ${rowNumber}: MaxLoadPerPhase must be >= 0, got "${row.MaxLoadPerPhase}"`);
    }

    // Validate QualificationLevel range (1-5)
    const qualificationLevel = Number(row.QualificationLevel);
    if (isNaN(qualificationLevel) || qualificationLevel < 1 || qualificationLevel > 5) {
      errors.push(`Row ${rowNumber}: QualificationLevel must be 1-5, got "${row.QualificationLevel}"`);
    }
  });

  return errors;
}

/**
 * Validates task data according to business rules
 * @param data - Array of task data rows
 * @returns Array of validation error messages
 */
function validateTaskData(data: DataRow[]): string[] {
  const errors: string[] = [];
  const taskIds = new Set<string>();
  const requiredColumns = ['TaskID', 'TaskName', 'Category', 'Duration', 'RequiredSkills', 'PreferredPhases', 'MaxConcurrent'];

  // Validate required columns
  if (data.length > 0) {
    const missingColumns = requiredColumns.filter(col => !Object.keys(data[0]).includes(col));
    if (missingColumns.length > 0) {
      errors.push(`Missing required columns: ${missingColumns.join(', ')}`);
    }
  }

  // Validate each row
  data.forEach((row, index) => {
    const rowNumber = index + 1;
    
    // Check for duplicate TaskID
    const taskId = String(row.TaskID || '');
    if (taskId && taskIds.has(taskId)) {
      errors.push(`Row ${rowNumber}: Duplicate TaskID "${taskId}"`);
    } else if (taskId) {
      taskIds.add(taskId);
    }

    // Validate Duration (positive number)
    const duration = Number(row.Duration);
    if (isNaN(duration) || duration <= 0) {
      errors.push(`Row ${rowNumber}: Duration must be > 0, got "${row.Duration}"`);
    }

    // Validate PreferredPhases format (JSON array or range format)
    const phases = String(row.PreferredPhases || '');
    if (phases && phases !== '7') {
      try {
        const parsedPhases = JSON.parse(phases);
        if (!Array.isArray(parsedPhases) || !parsedPhases.every(phase => Number.isInteger(Number(phase)))) {
          errors.push(`Row ${rowNumber}: PreferredPhases should be array of numbers, got "${phases}"`);
        }
      } catch {
        // Check if it's a range format like "1-3"
        if (!/^\d+-\d+$/.test(phases)) {
          errors.push(`Row ${rowNumber}: PreferredPhases should be JSON array or range format, got "${phases}"`);
        }
      }
    }

    // Validate MaxConcurrent (positive number)
    const maxConcurrent = Number(row.MaxConcurrent);
    if (isNaN(maxConcurrent) || maxConcurrent <= 0) {
      errors.push(`Row ${rowNumber}: MaxConcurrent must be > 0, got "${row.MaxConcurrent}"`);
    }
  });

  return errors;
}

/**
 * Routes validation to appropriate function based on dataset type
 * @param datasetType - Type of dataset to validate
 * @param data - Array of data rows to validate
 * @returns Array of validation error messages
 */
function validateDataset(datasetType: DatasetType, data: DataRow[]): string[] {
  const validationFunctions = {
    clients: validateClientData,
    workers: validateWorkerData,
    tasks: validateTaskData,
  };
  
  return validationFunctions[datasetType]?.(data) || [];
}

// ============================================================================
// REACT COMPONENTS
// ============================================================================

/**
 * File upload component with drag-and-drop support and file icon
 */
function FileUpload({ label, onDataParsed }: { 
  label: string; 
  onDataParsed: (data: DataRow[]) => void;
}) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      parseUploadedFile(file, onDataParsed);
    }
  }, [onDataParsed]);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.name.endsWith('.csv') || file.name.endsWith('.xlsx')) {
        setSelectedFile(file);
        parseUploadedFile(file, onDataParsed);
      }
    }
  }, [onDataParsed]);

  const handleFileInputClick = useCallback(() => {
    const fileInput = document.getElementById(`file-input-${label.toLowerCase()}`) as HTMLInputElement;
    fileInput?.click();
  }, [label]);

  return (
    <div className="flex flex-col gap-3">
      <label className="font-semibold text-gray-700">{label}</label>
      
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200
          ${isDragOver 
            ? 'border-blue-400 bg-blue-50' 
            : selectedFile 
              ? 'border-green-400 bg-green-50' 
              : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
          }
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleFileInputClick}
      >
        <input
          id={`file-input-${label.toLowerCase()}`}
          type="file"
          accept=".csv,.xlsx"
          onChange={handleFileChange}
          className="hidden"
        />
        
        <div className="flex flex-col items-center gap-3">
          {selectedFile ? (
            <>
              <div className="flex items-center gap-2 text-green-600">
                <FileText className="w-8 h-8" />
                <span className="font-medium">File Selected</span>
              </div>
              <div className="text-sm text-gray-600 max-w-full truncate">
                {selectedFile.name}
              </div>
              <div className="text-xs text-gray-500">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </div>
            </>
          ) : (
            <>
              <Upload className="w-8 h-8 text-gray-400" />
              <div className="text-sm text-gray-600">
                <span className="font-medium">Click to upload</span> or drag and drop
              </div>
              <div className="text-xs text-gray-500">
                CSV or XLSX files only
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Interactive data grid component with inline editing
 */
function DataGridTable({ data, onDataChange }: {
  data: DataRow[];
  onDataChange: (rows: DataRow[]) => void;
}) {
  const columns = useMemo(() => generateDataGridColumns(data), [data]);
  
  return (
    <div className="h-96 border rounded bg-white/80 mt-2">
      <DataGrid
        columns={columns}
        rows={data}
        onRowsChange={onDataChange}
        className="rdg-light"
      />
    </div>
  );
}

/**
 * Displays validation errors in a user-friendly format
 */
function ValidationSummary({ errors }: { errors: string[] }) {
  if (!errors.length) return null;
  
  return (
    <div className="bg-red-100 border border-red-300 text-red-700 rounded p-2 text-xs mt-2">
      <b>Validation Issues ({errors.length}):</b>
      <ul className="list-disc ml-4 mt-1">
        {errors.map((error, index) => (
          <li key={index} className="text-xs">{error}</li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Natural language search input with smart query parsing
 */
function SearchBar({ onSearch }: { onSearch: (query: string) => void }) {
  const [query, setQuery] = useState("");
  
  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = event.target.value;
    setQuery(newQuery);
    onSearch(newQuery);
  }, [onSearch]);

  return (
    <div className="flex gap-2 items-center">
      <Search className="w-4 h-4 text-gray-500" />
      <input
        type="text"
        placeholder="Search: 'Priority > 3', 'Duration < 2', 'Group = GroupA', 'Skills = Python'..."
        value={query}
        onChange={handleSearchChange}
        className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}

/**
 * Natural language data modification component
 */
function NaturalLanguageModifier({ 
  datasets, 
  onDataChange 
}: { 
  datasets: Record<DatasetType, DataRow[]>;
  onDataChange: (datasetType: DatasetType, rows: DataRow[]) => void;
}) {
  const [command, setCommand] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [preview, setPreview] = useState<{
    command: ModificationCommand;
    affectedRows: number;
    preview: DataRow[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCommandSubmit = useCallback(async () => {
    if (!command.trim()) return;
    
    setIsProcessing(true);
    setError(null);
    setPreview(null);
    
    try {
      const parsedCommand = await AIService.parseModificationCommand(command, datasets);
      
      if (!parsedCommand) {
        setError("Could not understand the command. Try: 'Change all PriorityLevels to 5' or 'Set MaxLoadPerPhase to 2 for GroupB workers'");
        return;
      }
      
      // Generate preview
      const currentData = datasets[parsedCommand.dataset] || [];
      const previewData = currentData.map(row => {
        const newRow = { ...row };
        
        // Check if row matches condition
        let shouldUpdate = true;
        if (parsedCommand.condition) {
          const { field, operator, value } = parsedCommand.condition;
          const rowValue = row[field];
          
          switch (operator) {
            case 'equals':
              shouldUpdate = String(rowValue) === String(value);
              break;
            case 'contains':
              shouldUpdate = String(rowValue).toLowerCase().includes(String(value).toLowerCase());
              break;
            case 'greater':
              shouldUpdate = Number(rowValue) > Number(value);
              break;
            case 'less':
              shouldUpdate = Number(rowValue) < Number(value);
              break;
          }
        }
        
        if (shouldUpdate) {
          newRow[parsedCommand.field] = parsedCommand.value;
        }
        
        return newRow;
      });
      
      const affectedRows = previewData.filter((row, index) => 
        JSON.stringify(row) !== JSON.stringify(currentData[index])
      ).length;
      
      setPreview({
        command: parsedCommand,
        affectedRows,
        preview: previewData
      });
      
    } catch (err) {
      setError("Failed to process command. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }, [command, datasets]);

  const applyChanges = useCallback(() => {
    if (!preview) return;
    
    onDataChange(preview.command.dataset, preview.preview);
    setCommand("");
    setPreview(null);
    setError(null);
  }, [preview, onDataChange]);

  const cancelPreview = useCallback(() => {
    setPreview(null);
    setError(null);
  }, []);

  return (
    <div className="bg-white/90 rounded-lg shadow p-4">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <Wand2 className="w-4 h-4" />
        Natural Language Modifier
      </h3>
      
      <div className="space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Try: 'Change all PriorityLevels to 5' or 'Set MaxLoadPerPhase to 2 for GroupB workers'"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleCommandSubmit()}
            className="flex-1 px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isProcessing}
          />
          <button
            onClick={handleCommandSubmit}
            disabled={isProcessing || !command.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                Apply
              </>
            )}
          </button>
        </div>
        
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-100 border border-red-300 text-red-700 rounded text-sm">
            <AlertTriangle className="w-4 h-4" />
            {error}
          </div>
        )}
        
        {preview && (
          <div className="border border-blue-300 bg-blue-50 rounded p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-blue-800">Preview Changes</h4>
              <div className="flex gap-2">
                <button
                  onClick={cancelPreview}
                  className="px-3 py-1 text-blue-600 hover:bg-blue-100 rounded text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={applyChanges}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors flex items-center gap-1"
                >
                  <CheckCircle className="w-3 h-3" />
                  Apply Changes ({preview.affectedRows} rows)
                </button>
              </div>
            </div>
            
            <div className="text-sm text-blue-700">
              <p><strong>Action:</strong> {preview.command.action} {preview.command.field} to {preview.command.value}</p>
              {preview.command.condition && (
                <p><strong>Condition:</strong> {preview.command.condition.field} {preview.command.condition.operator} {preview.command.condition.value}</p>
              )}
              <p><strong>Dataset:</strong> {preview.command.dataset}</p>
              <p><strong>Affected Rows:</strong> {preview.affectedRows}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Prioritization weights configuration panel
 */
function PrioritizationPanel({ weights, onWeightsChange }: {
  weights: PrioritizationWeights;
  onWeightsChange: (weights: PrioritizationWeights) => void;
}) {
  const updateWeight = useCallback((key: keyof PrioritizationWeights, value: number) => {
    onWeightsChange({ ...weights, [key]: value });
  }, [weights, onWeightsChange]);

  const weightConfigs = [
    { key: 'priorityLevel' as const, label: 'Priority Level (Client-based)' },
    { key: 'maxConcurrent' as const, label: 'Max Concurrent (Task-based)' },
    { key: 'skillFit' as const, label: 'Skill Fit' },
    { key: 'fairness' as const, label: 'Fairness' },
    { key: 'cost' as const, label: 'Cost' },
    { key: 'efficiency' as const, label: 'Efficiency' },
  ];

  return (
    <div className="bg-white/90 rounded-lg shadow p-4">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <Settings className="w-4 h-4" />
        Prioritization Weights
      </h3>
      
      <div className="space-y-4">
        {weightConfigs.map(({ key, label }) => (
          <div key={key}>
            <label className="text-sm font-medium">{label}</label>
            <input
              type="range"
              min="0"
              max="10"
              value={weights[key]}
              onChange={(e) => updateWeight(key, Number(e.target.value))}
              className="w-full"
            />
            <span className="text-xs text-gray-600">{weights[key]}/10</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Rules builder for creating data processing rules
 */
function RulesBuilder({ onExport }: { onExport: (rules: RulesExport) => void }) {
  const [rules, setRules] = useState<Rule[]>([]);
  const [newRule, setNewRule] = useState<Omit<Rule, 'id'>>({
    type: "coRun",
    description: "",
    parameters: {}
  });

  const addRule = useCallback(() => {
    if (newRule.description.trim()) {
      setRules(prev => [...prev, { ...newRule, id: Date.now() }]);
      setNewRule({ type: "coRun", description: "", parameters: {} });
    }
  }, [newRule]);

  const removeRule = useCallback((id: number) => {
    setRules(prev => prev.filter(rule => rule.id !== id));
  }, []);

  const exportRules = useCallback(() => {
    const rulesExport: RulesExport = {
      version: "1.0",
      rules: rules.map(rule => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, ...ruleWithoutId } = rule;
        return ruleWithoutId;
      }),
      metadata: {
        createdAt: new Date().toISOString(),
        totalRules: rules.length
      }
    };
    onExport(rulesExport);
  }, [rules, onExport]);

  return (
    <div className="bg-white/90 rounded-lg shadow p-4 max-w-full">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <Filter className="w-4 h-4" />
        Rules Builder
      </h3>
      
      <div className="space-y-4">
        <div className="flex flex-col gap-2">
          <select
            value={newRule.type}
            onChange={(e) => setNewRule(prev => ({ ...prev, type: e.target.value }))}
            className="w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {RULE_TYPES.map(rule => (
              <option key={rule.value} value={rule.value}>{rule.label}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Rule description..."
            value={newRule.description}
            onChange={(e) => setNewRule(prev => ({ ...prev, description: e.target.value }))}
            className="w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={addRule}
            className="w-full px-3 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 flex items-center justify-center gap-1 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Rule
          </button>
        </div>
        
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {rules.map(rule => (
            <div key={rule.id} className="flex items-center justify-between p-3 bg-gray-50 rounded border">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-blue-600">
                  {RULE_TYPES.find(r => r.value === rule.type)?.label}
                </div>
                <div className="text-gray-600 text-sm truncate">
                  {rule.description}
                </div>
              </div>
              <button
                onClick={() => rule.id && removeRule(rule.id)}
                className="ml-2 text-red-500 hover:text-red-700 text-sm px-2 py-1 rounded hover:bg-red-50 transition-colors"
              >
                Remove
              </button>
            </div>
          ))}
          {rules.length === 0 && (
            <div className="text-center text-gray-500 text-sm py-4">
              No rules added yet
            </div>
          )}
        </div>
        
        {rules.length > 0 && (
          <button
            onClick={exportRules}
            className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 flex items-center justify-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export Rules (rules.json)
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Final export component for downloading all processed data
 */
function FinalExport({ datasets, rules, weights }: {
  datasets: Record<DatasetType, DataRow[]>;
  rules: RulesExport;
  weights: PrioritizationWeights;
}) {
  const exportAllFiles = useCallback(() => {
    // Export clean CSV files
    Object.entries(datasets).forEach(([key, data]) => {
      if (data.length > 0) {
        const csv = Papa.unparse(data);
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${key}.csv`;
        link.click();
        URL.revokeObjectURL(url);
      }
    });

    // Export rules.json
    const rulesBlob = new Blob([JSON.stringify(rules, null, 2)], { type: 'application/json' });
    const rulesUrl = URL.createObjectURL(rulesBlob);
    const link = document.createElement('a');
    link.href = rulesUrl;
    link.download = 'rules.json';
    link.click();
    URL.revokeObjectURL(rulesUrl);

    // Export prioritization.json
    const weightsBlob = new Blob([JSON.stringify(weights, null, 2)], { type: 'application/json' });
    const weightsUrl = URL.createObjectURL(weightsBlob);
    const weightsLink = document.createElement('a');
    weightsLink.href = weightsUrl;
    weightsLink.download = 'prioritization.json';
    weightsLink.click();
    URL.revokeObjectURL(weightsUrl);
  }, [datasets, rules, weights]);

  const hasData = Object.values(datasets).some(data => data.length > 0);

  return (
    <div className="bg-white/90 rounded-lg shadow p-4">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <FileDown className="w-4 h-4" />
        Final Export
      </h3>
      
      <button
        onClick={exportAllFiles}
        disabled={!hasData}
        className="w-full px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
      >
        <Download className="w-4 h-4" />
        Export All Files
      </button>
      
      <div className="text-xs text-gray-600 mt-2">
        Downloads: clients.csv, workers.csv, tasks.csv, rules.json, prioritization.json
      </div>
    </div>
  );
}

/**
 * AI Rule Recommendations component
 */
function AIRuleRecommendations({ 
  datasets, 
  onAddRule 
}: { 
  datasets: Record<DatasetType, DataRow[]>;
  onAddRule: (rule: Omit<Rule, 'id'>) => void;
}) {
  const [recommendations, setRecommendations] = useState<RuleRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const generateRecommendations = useCallback(async () => {
    setIsLoading(true);
    try {
      const newRecommendations = await AIService.generateRuleRecommendations(datasets);
      setRecommendations(newRecommendations);
      setIsVisible(true);
    } catch (error) {
      console.error('Failed to generate recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [datasets]);

  const acceptRecommendation = useCallback((recommendation: RuleRecommendation) => {
    const newRule: Omit<Rule, 'id'> = {
      type: recommendation.type,
      description: recommendation.description,
      parameters: recommendation.suggestedParameters
    };
    onAddRule(newRule);
    
    // Remove the accepted recommendation
    setRecommendations(prev => prev.filter(r => r.id !== recommendation.id));
  }, [onAddRule]);

  const ignoreRecommendation = useCallback((id: string) => {
    setRecommendations(prev => prev.filter(r => r.id !== id));
  }, []);

  const hasData = Object.values(datasets).some(data => data.length > 0);

  return (
    <div className="bg-white/90 rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Wand2 className="w-4 h-4" />
          AI Rule Recommendations
        </h3>
        <button
          onClick={generateRecommendations}
          disabled={isLoading || !hasData}
          className="px-3 py-1 bg-purple-500 text-white rounded text-sm hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
        >
          {isLoading ? (
            <>
              <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Wand2 className="w-3 h-3" />
              Smart Scan
            </>
          )}
        </button>
      </div>
      
      {isVisible && recommendations.length === 0 && !isLoading && (
        <div className="text-center text-gray-500 text-sm py-4">
          No patterns detected for rule recommendations
        </div>
      )}
      
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {recommendations.map(recommendation => (
          <div key={recommendation.id} className="border border-gray-200 rounded p-3 bg-gray-50">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-purple-600">
                  {recommendation.type}
                </div>
                <div className="text-gray-700 text-sm mt-1">
                  {recommendation.description}
                </div>
                <div className="text-gray-500 text-xs mt-1">
                  {recommendation.reasoning}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  Confidence: {(recommendation.confidence * 100).toFixed(0)}%
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => acceptRecommendation(recommendation)}
                  className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 transition-colors flex items-center gap-1"
                >
                  <CheckCircle className="w-3 h-3" />
                  Accept
                </button>
                <button
                  onClick={() => ignoreRecommendation(recommendation.id)}
                  className="px-2 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600 transition-colors flex items-center gap-1"
                >
                  <XCircle className="w-3 h-3" />
                  Ignore
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * AI-based Error Correction component
 */
function AIErrorCorrection({ 
  errors, 
  data, 
  datasetType, 
  onDataChange 
}: { 
  errors: string[];
  data: DataRow[];
  datasetType: DatasetType;
  onDataChange: (rows: DataRow[]) => void;
}) {
  const [corrections, setCorrections] = useState<Map<number, string>>(new Map());
  const [isProcessing, setIsProcessing] = useState(false);

  const generateCorrections = useCallback(async () => {
    if (errors.length === 0) return;
    
    setIsProcessing(true);
    const newCorrections = new Map<number, string>();
    
    try {
      for (let i = 0; i < errors.length; i++) {
        const error = errors[i];
        const rowMatch = error.match(/Row (\d+):/);
        if (rowMatch) {
          const rowIndex = parseInt(rowMatch[1]) - 1;
          if (rowIndex >= 0 && rowIndex < data.length) {
            const correction = await AIService.suggestCorrections(error, data[rowIndex], datasetType);
            if (correction) {
              newCorrections.set(i, correction);
            }
          }
        }
      }
      setCorrections(newCorrections);
    } catch (error) {
      console.error('Failed to generate corrections:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [errors, data, datasetType]);

  const applyCorrection = useCallback((errorIndex: number, correction: string) => {
    const error = errors[errorIndex];
    const rowMatch = error.match(/Row (\d+):/);
    if (rowMatch) {
      const rowIndex = parseInt(rowMatch[1]) - 1;
      if (rowIndex >= 0 && rowIndex < data.length) {
        const newData = [...data];
        const newRow = { ...newData[rowIndex] };
        
        // Apply the correction based on error type
        if (error.includes('AttributesJSON')) {
          newRow.AttributesJSON = correction;
        } else if (error.includes('RequestedTaskIDs')) {
          newRow.RequestedTaskIDs = correction;
        }
        
        newData[rowIndex] = newRow;
        onDataChange(newData);
        
        // Remove the correction from the map
        setCorrections(prev => {
          const newMap = new Map(prev);
          newMap.delete(errorIndex);
          return newMap;
        });
      }
    }
  }, [errors, data, onDataChange]);

  if (errors.length === 0) return null;

  return (
    <div className="bg-white/90 rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Wand2 className="w-4 h-4" />
          AI Error Correction
        </h3>
        <button
          onClick={generateCorrections}
          disabled={isProcessing}
          className="px-3 py-1 bg-orange-500 text-white rounded text-sm hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
        >
          {isProcessing ? (
            <>
              <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Wand2 className="w-3 h-3" />
              Auto-Fix
            </>
          )}
        </button>
      </div>
      
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {errors.map((error, index) => (
          <div key={index} className="border border-red-200 rounded p-2 bg-red-50">
            <div className="text-red-700 text-sm mb-1">{error}</div>
            {corrections.has(index) && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-green-600">Suggested fix:</span>
                <code className="text-xs bg-green-100 px-1 rounded">{corrections.get(index)}</code>
                <button
                  onClick={() => applyCorrection(index, corrections.get(index)!)}
                  className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 transition-colors flex items-center gap-1"
                >
                  <CheckCircle className="w-3 h-3" />
                  Apply
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * AI Validator component for smart data analysis
 */
function AIValidator({ 
  datasets 
}: { 
  datasets: Record<DatasetType, DataRow[]>;
}) {
  const [insights, setInsights] = useState<ValidationInsight[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const runSmartScan = useCallback(async () => {
    setIsLoading(true);
    try {
      const newInsights = await AIService.generateValidationInsights(datasets);
      setInsights(newInsights);
      setIsVisible(true);
    } catch (error) {
      console.error('Failed to generate insights:', error);
    } finally {
      setIsLoading(false);
    }
  }, [datasets]);

  const hasData = Object.values(datasets).some(data => data.length > 0);

  const getInsightIcon = (type: ValidationInsight['type']) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'info': return <CheckCircle className="w-4 h-4 text-blue-500" />;
    }
  };

  const getInsightColor = (type: ValidationInsight['type']) => {
    switch (type) {
      case 'warning': return 'border-yellow-300 bg-yellow-50';
      case 'error': return 'border-red-300 bg-red-50';
      case 'info': return 'border-blue-300 bg-blue-50';
    }
  };

  return (
    <div className="bg-white/90 rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Wand2 className="w-4 h-4" />
          AI Smart Validator
        </h3>
        <button
          onClick={runSmartScan}
          disabled={isLoading || !hasData}
          className="px-3 py-1 bg-indigo-500 text-white rounded text-sm hover:bg-indigo-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
        >
          {isLoading ? (
            <>
              <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
              Scanning...
            </>
          ) : (
            <>
              <Wand2 className="w-3 h-3" />
              Smart Scan
            </>
          )}
        </button>
      </div>
      
      {isVisible && insights.length === 0 && !isLoading && (
        <div className="text-center text-gray-500 text-sm py-4">
          No insights detected - data looks good!
        </div>
      )}
      
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {insights.map((insight, index) => (
          <div key={index} className={`border rounded p-3 ${getInsightColor(insight.type)}`}>
            <div className="flex items-start gap-2">
              {getInsightIcon(insight.type)}
              <div className="flex-1">
                <div className="text-sm font-medium">
                  {insight.type.charAt(0).toUpperCase() + insight.type.slice(1)}
                </div>
                <div className="text-sm mt-1">{insight.message}</div>
                {insight.suggestedFix && (
                  <div className="text-xs text-gray-600 mt-1">
                    <strong>Suggested:</strong> {insight.suggestedFix}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * Main Data Alchemist application component
 * Handles file uploads, data validation, search, rules building, and export
 */
export default function DataAlchemistApp() {
  // State management
  const [datasets, setDatasets] = useState<Record<DatasetType, DataRow[]>>({
    clients: [],
    workers: [],
    tasks: []
  });
  const [validationErrors, setValidationErrors] = useState<Record<DatasetType, string[]>>({
    clients: [],
    workers: [],
    tasks: []
  });
  const [searchQueries, setSearchQueries] = useState<Record<DatasetType, string>>({
    clients: "",
    workers: "",
    tasks: ""
  });
  const [filteredData, setFilteredData] = useState<Record<DatasetType, DataRow[]>>({
    clients: [],
    workers: [],
    tasks: []
  });
  const [prioritizationWeights, setPrioritizationWeights] = useState<PrioritizationWeights>({
    priorityLevel: 5,
    maxConcurrent: 3,
    skillFit: 7,
    fairness: 4,
    cost: 6,
    efficiency: 8,
  });
  const [currentRules, setCurrentRules] = useState<RulesExport>({
    version: "1.0",
    rules: [],
    metadata: { createdAt: "", totalRules: 0 }
  });

  // Apply search filters when data or queries change
  useMemo(() => {
    const filtered: Record<DatasetType, DataRow[]> = {
      clients: parseNaturalLanguageQuery(searchQueries.clients, datasets.clients),
      workers: parseNaturalLanguageQuery(searchQueries.workers, datasets.workers),
      tasks: parseNaturalLanguageQuery(searchQueries.tasks, datasets.tasks),
    };
    setFilteredData(filtered);
  }, [datasets, searchQueries]);

  // Event handlers
  const handleDataChange = useCallback((datasetType: DatasetType, rows: DataRow[]) => {
    setDatasets(prev => ({ ...prev, [datasetType]: rows }));
    setValidationErrors(prev => ({ ...prev, [datasetType]: validateDataset(datasetType, rows) }));
  }, []);

  const handleSearch = useCallback((datasetType: DatasetType, query: string) => {
    setSearchQueries(prev => ({ ...prev, [datasetType]: query }));
  }, []);

  const handleExportRules = useCallback((rules: RulesExport) => {
    setCurrentRules(rules);
    const blob = new Blob([JSON.stringify(rules, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'rules.json';
    link.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleAddRule = useCallback((rule: Omit<Rule, 'id'>) => {
    setCurrentRules(prev => ({
      ...prev,
      rules: [...prev.rules, rule],
      metadata: {
        ...prev.metadata,
        totalRules: prev.rules.length + 1
      }
    }));
  }, []);

  const handleAICorrection = useCallback((datasetType: DatasetType, rows: DataRow[]) => {
    handleDataChange(datasetType, rows);
  }, [handleDataChange]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-sky-100 p-8 flex flex-col items-center gap-8">
      <h1 className="text-3xl font-bold mb-2">🧪 Data Alchemist</h1>
      <p className="text-gray-600 max-w-xl text-center mb-4">
        Upload your <b>clients</b>, <b>workers</b>, and <b>tasks</b> datasets (.csv or .xlsx). 
        Use natural language search, build rules, and configure prioritization for data processing.
      </p>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 w-full max-w-7xl">
        {/* Main data grid area */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
          {DATASET_CONFIGS.map(({ key, label }) => (
            <div key={key} className="bg-white/90 rounded-lg shadow p-3 flex flex-col gap-2">
              <FileUpload
                label={label}
                onDataParsed={(data) => setDatasets(prev => ({ ...prev, [key]: data }))}
              />
              <SearchBar onSearch={(query) => handleSearch(key, query)} />
              <DataGridTable
                data={filteredData[key] || []}
                onDataChange={(rows) => handleDataChange(key, rows)}
              />
              <ValidationSummary errors={validationErrors[key] || []} />
              <AIErrorCorrection 
                errors={validationErrors[key] || []}
                data={datasets[key] || []}
                datasetType={key}
                onDataChange={(rows) => handleAICorrection(key, rows)}
              />
            </div>
          ))}
        </div>
        
        {/* Sidebar with configuration panels */}
        <div className="lg:col-span-1 space-y-6">
          <NaturalLanguageModifier 
            datasets={datasets}
            onDataChange={handleDataChange}
          />
          <AIRuleRecommendations 
            datasets={datasets}
            onAddRule={handleAddRule}
          />
          <AIValidator 
            datasets={datasets}
          />
          <PrioritizationPanel 
            weights={prioritizationWeights}
            onWeightsChange={setPrioritizationWeights}
          />
          <RulesBuilder onExport={handleExportRules} />
          <FinalExport 
            datasets={datasets}
            rules={currentRules}
            weights={prioritizationWeights}
          />
        </div>
      </div>
    </div>
  );
}
