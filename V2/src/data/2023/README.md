```ts
// Truncated Module Data
// Includes S1 and S2
const TRUN_M_DATA = {
  [moduleKey: string]: string // Title of Module
}

// Module Indexes
// Includes S1 and S2
const M_INDEXES = {
  [moduleKey: string]: [indexKey: string]: Index[]
}

// Modules Data
// Includes S1 and S2
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
