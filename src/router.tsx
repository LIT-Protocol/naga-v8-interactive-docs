import { createBrowserRouter } from "react-router-dom";
import { HomePage } from "./pages";

import LoggedInDashboard from "./components/lit-logged-page/LoggedInDashboard";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />,
    children: [
      {
        index: true,
        element: <LoggedInDashboard />,
      },
    ],
  },
]);