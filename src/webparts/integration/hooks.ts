import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "./store/store";

export const useAppDispatch: () => AppDispatch = useDispatch as any;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
