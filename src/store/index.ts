'use client'

import { configureStore, combineReducers } from '@reduxjs/toolkit'
import { persistStore, persistReducer } from 'redux-persist'
import storage from './reduxStorage'

import authReducer from './authSlice'

// reducers combine karo
const rootReducer = combineReducers({
  auth: authReducer,
})

// persist config
const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth'], // sirf auth reducer ko persist karna hai
}

const persistedReducer = persistReducer(persistConfig, rootReducer)

// store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // redux-persist ke liye zaroori hai
    }),
})

export const persistor = persistStore(store)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
