import { configureStore } from "@reduxjs/toolkit";
import appReducer from "../slices/appSlice";

export const store = configureStore({
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["app/updateDb"],
        ignoredActionPaths: ["payload.db"],
        ignoredPaths: ["app.db"],
      },
    }),
  reducer: {
    app: appReducer,
  },
});
