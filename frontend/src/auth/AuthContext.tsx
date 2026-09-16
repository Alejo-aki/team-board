import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { ApiError, get, post, TOKEN_KEY } from "../api/http";
import type {
  LoginCredentials,
  LoginResponse,
  MeResponse,
  User,
} from "./types";

interface AuthContextValue {
  token: string | null;
  user: User | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem(TOKEN_KEY)
  );
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await get<MeResponse>("/me", token);
        if (active) {
          setUser(response.user);
        }
      } catch (error) {
        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
          localStorage.removeItem(TOKEN_KEY);
          if (active) {
            setToken(null);
            setUser(null);
          }
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void restoreSession();

    return () => {
      active = false;
    };
  }, [token]);

  async function login(credentials: LoginCredentials) {
    const response = await post<LoginResponse>("/login", credentials, null);
    localStorage.setItem(TOKEN_KEY, response.token);
    setToken(response.token);

    const meResponse = await get<MeResponse>("/me", response.token);
    setUser(meResponse.user);
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ token, user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth debe utilizarse dentro de AuthProvider");
  }

  return context;
}
