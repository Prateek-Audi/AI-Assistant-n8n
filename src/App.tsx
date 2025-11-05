import { ChatInterface } from "./components/ChatInterface";
import { Toaster } from "./components/ui/sonner";

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <ChatInterface />
      <Toaster />
    </div>
  );
}
