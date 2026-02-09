import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { PageLoader } from "@/components/ui/loader";

import AuthPage from "@/pages/auth";
import NotFound from "@/pages/not-found";
import TeachersPage from "@/pages/admin/teachers";
import AdminHomeworkPage from "@/pages/admin/homework";
import SettingsPage from "@/pages/admin/settings";
import TeacherEntryPage from "@/pages/teacher/entry";

// Protected Route Wrapper
function ProtectedRoute({ component: Component, allowedRoles }: { component: React.ComponentType, allowedRoles?: string[] }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <PageLoader />;
  
  if (!user) {
    return <Redirect to="/auth" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Redirect to={user.role === "admin" ? "/admin/homework" : "/teacher/entry"} />;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/auth" component={AuthPage} />
      
      {/* Root Redirect */}
      <Route path="/">
        <Redirect to="/auth" />
      </Route>

      {/* Admin Routes */}
      <Route path="/admin/teachers">
        <ProtectedRoute component={TeachersPage} allowedRoles={["admin"]} />
      </Route>
      <Route path="/admin/homework">
        <ProtectedRoute component={AdminHomeworkPage} allowedRoles={["admin"]} />
      </Route>
      <Route path="/admin/settings">
        <ProtectedRoute component={SettingsPage} allowedRoles={["admin"]} />
      </Route>

      {/* Teacher Routes */}
      <Route path="/teacher/entry">
        <ProtectedRoute component={TeacherEntryPage} allowedRoles={["teacher"]} />
      </Route>

      {/* Fallback */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <Toaster />
            <Router />
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
