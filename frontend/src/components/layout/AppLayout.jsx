import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

export function AppLayout({ children, session }) {
  return (
    <div className="flex h-screen overflow-hidden bg-obsidian text-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col w-0 overflow-hidden">
        <Header session={session} />
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

