import { createSlice } from "@reduxjs/toolkit";

const taskSlice = createSlice({
  name: "tasks",
  initialState: {
    filters: {
      category: "all",
      status: "all",
      search: "",
    },
    selectedTaskId: null,
  },
  reducers: {
    setFilter(state, action) {
      const { key, value } = action.payload;
      state.filters[key] = value;
    },
    resetFilters(state) {
      state.filters = { category: "all", status: "all", search: "" };
    },
    setSelectedTaskId(state, action) {
      state.selectedTaskId = action.payload;
    },
  },
});

export const { setFilter, resetFilters, setSelectedTaskId } = taskSlice.actions;
export default taskSlice.reducer;
