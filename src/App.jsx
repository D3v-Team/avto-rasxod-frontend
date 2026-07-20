import { Route, Routes } from "react-router";
import "./App.css";
import { Toaster } from "react-hot-toast";
import ErrorPage from "./pages/ErrorPage";
import Login from "./pages/Login/Login";
import superAdminRoutes from "./routes/AdminRoutes";
import AdminLayout from "./layouts/AdminLayout";
import RequireAuth from "./auth/RequireAuth";
import { Navigate } from "react-router";

function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route element={<RequireAuth role="super_admin" />}>
          <Route path="/admin" element={<AdminLayout />}>
            {superAdminRoutes.map((r) => (
              <Route key={r.name} path={r.path} element={r.element} />
            ))}
          </Route>
        </Route>
        <Route path="*" element={<ErrorPage />} />
      </Routes>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
        }}
      />
    </>
  );
}

export default App;
