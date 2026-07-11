// No published types for this package. It's a side-effect-only import (a
// module-scope singleton that patches touch events into native HTML5 drag
// events) — nothing is consumed from it, so an ambient empty-module
// declaration is all TypeScript needs to stop erroring on the import.
declare module "drag-drop-touch";
