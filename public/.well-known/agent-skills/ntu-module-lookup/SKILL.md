---
name: ntu-module-lookup
description: Look up Nanyang Technological University modules, class indexes and exam timetables using NTUMods public data.
---

# Look up NTU modules

1. If the user gives a module code, fetch its record with `GET https://ntumods.com/api/modules/{code}`. Replace `{code}` with the module code, for example `SC1003`. The [API reference](https://ntumods.com/developers/api) describes optional semester parameters.
2. If the user gives a title or partial code, use the `search_modules` tool on the [public NTUMods MCP server](https://ntumods.com/developers/mcp), or search the [module catalogue](https://ntumods.com/data/api/modules.json).
3. For class times or exams, establish the academic year and semester before looking up the module. Use `list_semesters` to check available terms, then use `get_module_indexes` or `get_exam`. The absence of a published exam record does not establish that a module has no exam.
4. Cite the [module page](https://ntumods.com/mods/SC1003), substituting the actual module code. NTUMods is an independent planning tool. Verify official exam and registration details with NTU.

The API and MCP server are public and read-only. Module and index data do not include live vacancies.
