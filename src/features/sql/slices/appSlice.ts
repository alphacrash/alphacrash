import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  db: null,
};

export const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    updateDb: (state, action) => {
      state.db = action.payload;
    },
    resetDb: (state) => {
      state.db = [];
    },
  },
});

export const { updateDb, resetDb } = appSlice.actions;

export default appSlice.reducer;
