import { MODULE_FACULTY } from "./constants"

export const getModuleFaculty = (
  moduleCode: string,
  searchTerms: string[]
): ModuleFaculty => {
  // By right all searchTerms should have a faculty key
  // We use ACC for default for now
  // It is not possible to have a module with no faculty (i think)
  let keyToReturn = "" as ModuleFaculty

  searchTerms.forEach((searchTerm) => {
    const keys = searchTerm.split(";")

    for (const key of keys) {
      for (const moduleFaculty in MODULE_FACULTY) {
        if (key === moduleFaculty) {
          keyToReturn = key as ModuleFaculty
        }
      }
    }
  })

  return keyToReturn
}
