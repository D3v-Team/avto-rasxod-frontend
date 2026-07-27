import Dashboard from "../pages/Dashboard/Dashboard";
import AdminPage from "../pages/AdminPage/AdminPage";
import FuelPage from "../pages/FuelPage/FuelPage";
import CarPage from "../pages/CarPage/CarPage";
import CostPage from "../pages/CostPage/CostPage";
import Admin from "../pages/AdminPage/Adminlar/Admin";
import ZapchastPage from "../pages/ZapchastPage/ZapchastPage";

const superAdminRoutes = [
  {
    name: "dashboard",
    path: "dashboard",
    element: <Dashboard />,
  },
  {
    name: "admins",
    path: "admins",
    element: <AdminPage />,
  },
  {
    name: "cars",
    path: "cars",
    element: <CarPage />,
  },
  {
    name: "fuel",
    path: "fuel",
    element: <FuelPage />,
  },
  {
    name: "costs",
    path: "costs",
    element: <CostPage />,
  },
  {
    name: "admin",
    path: "admin",
    element: <Admin />,
  },
  {
    name: "zapchast",
    path: "zapchast",
    element: <ZapchastPage />,
  },
];
export default superAdminRoutes;
