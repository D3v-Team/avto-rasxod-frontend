import { Route, Routes } from "react-router";
import "./App.css";
import { Toaster } from "react-hot-toast";
import ErrorPage from "./pages/ErrorPage";
import Login from "./pages/Login/Login";
import superAdminRoutes from "./routes/AdminRoutes";
import AdminLayout from "./layouts/AdminLayout";

function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/superadmin" element={<AdminLayout />}>
          {superAdminRoutes.map((r) => {
            return <Route key={r.name} path={r.path} element={r.element} />;
          })}
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
