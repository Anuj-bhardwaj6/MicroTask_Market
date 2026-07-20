import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice.js";
import tasksReducer from "./slices/taskSlice.js";
import uiReducer from "./slices/uiSlice.js";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    tasks: tasksReducer,
    ui: uiReducer,
  },
});

export default store;
