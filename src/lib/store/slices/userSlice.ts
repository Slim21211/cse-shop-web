import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { User } from '@/types';
import type { RootState } from '../store';

interface UserState {
  user: User | null;
  isLoading: boolean;
}

const initialState: UserState = {
  user: null,
  isLoading: true,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload;
      state.isLoading = false;
    },

    updatePoints: (state, action: PayloadAction<number>) => {
      if (state.user) {
        state.user.points = action.payload;
      }
    },

    logout: (state) => {
      state.user = null;
    },
  },
});

export const { setUser, updatePoints, logout } = userSlice.actions;

// // Selectors
// export const selectUser = (state: RootState) => state.user.user;
// export const selectUserLoading = (state: RootState) => state.user.isLoading;

export default userSlice.reducer;
