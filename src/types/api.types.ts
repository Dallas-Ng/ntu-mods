export interface ApiModules {
  modules: Module[]
  total: number
  moduleLevels: string[]
}

export interface ApiModule {
  module: Module
}

export interface ApiModuleIndexes {
  total: number
  indexes: { [indexKey: string]: Index[] }
}

export interface ApiModuleRelated {
  related: Module[]
}
