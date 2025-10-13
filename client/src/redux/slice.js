import { createSlice } from "@reduxjs/toolkit";
import { assets } from "../assets/assets";

const initialAvatar = localStorage.getItem("avatar") || "";

const userSlice = createSlice({
  name: "auth",
  initialState: {
    isLoggedIn: !!localStorage.getItem("token"),
    role: localStorage.getItem("role") || "user",
    avatar: initialAvatar || assets.userIcon,
  },
  reducers: {
    login: (state) => {
      state.isLoggedIn = true;
    },
    logout: (state) => {
      state.isLoggedIn = false;
      state.avatar = assets.userIcon;
      state.email = "";
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("avatar");
    },
    changeRole: (state, action) => {
      state.role = action.payload;
    },
    setAvatar: (state, action) => {
      const nextAvatar = action.payload || "";
      state.avatar = nextAvatar || assets.userIcon;
      if (nextAvatar) {
        localStorage.setItem("avatar", nextAvatar);
      } else {
        localStorage.removeItem("avatar");
      }
    },
  },
});

export const authAction = userSlice.actions;
export default userSlice.reducer;
