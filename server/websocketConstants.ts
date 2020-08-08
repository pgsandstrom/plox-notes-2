// for some reason this cant be placed in 'types/index.ts' or in other files
// it results in weird compilation errors
// perhaps I haven't properly learned how to handle frontend/backend separation in next.js quite yet.
export enum WEBSOCKET_COMMAND {
  SET_ID = "SET_ID",
  POST = "POST",
  LOAD = "LOAD",
}
