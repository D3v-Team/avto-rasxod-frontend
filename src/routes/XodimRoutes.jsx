import Dashboard from "../pages/Dashboard/Dashboard";
import FuelPage from "../pages/FuelPage/FuelPage";
import CarPage from "../pages/CarPage/CarPage";
import CostPage from "../pages/CostPage/CostPage";

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
];
export default xodimRoutes;