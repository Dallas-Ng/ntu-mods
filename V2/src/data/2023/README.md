```ts
// Truncated Module Data
const TRUN_M_DATA = {
  [moduleKey: string]: string // Title of Module
}

// Module Indexes
const M_INDEXES = {
  [moduleKey: string]: [indexKey: string]: Index[]
}

// Modules Data
const M_DATA = {
  [moduleKey: string]: Module
}

// All Exams
const EXAMS = {
  [moduleKey: string]: Exam
}


// Validations
M_DATA.length === M_DATA.length
M_DATA.indexes.length = M_INDEXES.length
```
