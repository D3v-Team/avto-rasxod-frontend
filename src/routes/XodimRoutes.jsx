import Dashboard from "../pages/Dashboard/Dashboard";
import FuelPage from "../pages/FuelPage/FuelPage";
import CarPage from "../pages/CarPage/CarPage";
import CostPage from "../pages/CostPage/CostPage";
import AdminPage from "../pages/AdminPage/AdminPage";
import ZapchastPage from "../pages/ZapchastPage/ZapchastPage";

const xodimRoutes = [
  {
    name: "dashboard",
    path: "dashboard",
    element: <Dashboard />,
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
    name: "admins",
    path: "admins",
    element: <AdminPage />,
  },
  {
    name: "zapchast",
    path: "zapchast",
    element: <ZapchastPage />,
  },
];
export default xodimRoutes;