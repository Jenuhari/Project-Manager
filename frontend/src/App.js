import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import ProjectDetails from './pages/ProjectDetails';
import Profile from './pages/Profile';
import ForgotPassword from './pages/ForgotPassword';  
import ResetPassword from './pages/ResetPassword';    
import 'bootstrap/dist/css/bootstrap.min.css';
import TasksPage from './pages/TasksPage';  
import UsersPage from'./pages/UsersPage';
import { setAuthToken } from './services/projectService';
import ActivityLogs from "./pages/ActivityLogs";
import SearchResults from "./pages/SearchResults";
import MainLayout from "./layouts/MainLayout";
import './index.css';  

setAuthToken(localStorage.getItem('token'));



function App() {
  const token = localStorage.getItem('token');
  const isAuthenticated = !!token;

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />  // Add this route
        <Route path="/reset-password" element={<ResetPassword />} />    // Add this route
        <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/project/:id" element={isAuthenticated ? <ProjectDetails /> : <Navigate to="/login" />} /> 
        {/* <Route path="/Tasks" element={<TasksPage />} /> */}
        {/* <Route path="/users" element={<UsersPage/>} /> */}
        {/* <Route path="/logs" element={<Navigate to="/activity-logs" replace />} /> */}
        {/* <Route path="/activity-logs" element={token ? <ActivityLogs /> : <Navigate to="/login" replace />} />  */}
        <Route path="/login" element={<Login />} />
         {/* Pages WITH Sidebar */}
    <Route
      path="/dashboard"
      element={
        <MainLayout>
          <Dashboard />
        </MainLayout>
      }
    />

    <Route
      path="/tasks"
      element={
        <MainLayout>
          <TasksPage />
        </MainLayout>
      }
    />

    <Route
      path="/users"
      element={
        <MainLayout>
          <UsersPage />
        </MainLayout>
      }
    />

    <Route
      path="/profile"
      element={
        <MainLayout>
          <Profile />
        </MainLayout>
      }
    />

    <Route
      path="/activity-logs"
      element={
        <MainLayout>
          <ActivityLogs />
        </MainLayout>
      }
    />
    <Route
      path="/projects"
      element={
        <MainLayout>
          <ProjectDetails />
        </MainLayout>
      }
    />

    {/* Search results */}
    <Route
      path="/search"
      element={
        <MainLayout>
          <SearchResults />
        </MainLayout>
      }
      />
        <Route
  path="/project/:id"
  element={isAuthenticated ? <ProjectDetails /> : <Navigate to="/login" />}
/>
        <Route path="search" element={<SearchResults />} />
        <Route path="*" element={<Navigate to={token ? "/dashboard" : "/login"} replace />} />
        <Route path="/profile" element={isAuthenticated ? <Profile /> : <Navigate to="/login" />} />
        <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
      </Routes>
    </Router>
  );
}

export default App;