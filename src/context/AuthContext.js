import { createContext, useEffect, useState } from "react";
import { db } from "../db/database";

export const AuthContext = createContext({
  role: null,
  setRole: () => {},
  user: null,
  setUser: () => {},
  loading: true,
});

export const AuthProvider = ({ children }) => {
  const [role, setRole] = useState(null);

  // 🔥 null = cargando | false = no logueado | string = logueado
  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const session = await db.getFirstAsync(
          "SELECT * FROM session LIMIT 1"
        );

        if (session?.rol) {
          setRole(session.rol);
          setUser(session.usuario); // ✅ logueado
        } else {
          setRole(null);
          setUser(false); // 🔥 clave: no logueado
        }

      } catch (e) {
        console.log("❌ SESSION LOAD ERROR:", e);
        setRole(null);
        setUser(false); // 🔥 fallback correcto
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        role,
        setRole,
        user,
        setUser,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
