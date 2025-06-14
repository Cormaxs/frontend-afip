import { SidePanel } from "./components/menu.jsx";
import { LoadRoutes } from "./routes/routes";

function App() {
  return (
    <div className="flex h-screen">
      <SidePanel />
      <main className="flex-1 overflow-auto p-4">
        <LoadRoutes />
      </main>
    </div>
  );
}

export default App;