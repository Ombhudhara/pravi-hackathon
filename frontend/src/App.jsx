import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import RoleRoute from './components/RoleRoute';

const PublicLayout = React.lazy(() => import('./layouts/PublicLayout'));
const AuthLayout = React.lazy(() => import('./layouts/AuthLayout'));
const AppLayout = React.lazy(() => import('./layouts/AppLayout'));

const Home = React.lazy(() => import('./pages/Home'));
const PrivacyPolicy = React.lazy(() => import('./pages/PrivacyPolicy'));
const TermsAndConditions = React.lazy(() => import('./pages/TermsAndConditions'));
const NotFound = React.lazy(() => import('./pages/NotFound'));
const Login = React.lazy(() => import('./pages/Login'));
const Signup = React.lazy(() => import('./pages/Signup'));
const Unauthorized = React.lazy(() => import('./pages/Unauthorized'));

const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const AssetInventory = React.lazy(() => import('./pages/AssetInventory'));
const AssetForm = React.lazy(() => import('./pages/AssetForm'));
const AssetDetails = React.lazy(() => import('./pages/AssetDetails'));
const MapView = React.lazy(() => import('./pages/MapView'));
const InspectionList = React.lazy(() => import('./pages/InspectionList'));
const InspectionForm = React.lazy(() => import('./pages/InspectionForm'));
const InspectionDetails = React.lazy(() => import('./pages/InspectionDetails'));
const MaintenanceList = React.lazy(() => import('./pages/MaintenanceList'));
const IssueForm = React.lazy(() => import('./pages/IssueForm'));
const IssueDetails = React.lazy(() => import('./pages/IssueDetails'));
const LifecycleHistory = React.lazy(() => import('./pages/LifecycleHistory'));
const Analytics = React.lazy(() => import('./pages/Analytics'));
const ChangePassword = React.lazy(() => import('./pages/ChangePassword'));
const UsersAdmin = React.lazy(() => import('./pages/UsersAdmin'));

const LoadingFallback = () => <div className="app-layout" style={{ justifyContent: 'center', alignItems: 'center' }}>Loading...</div>;

function App() {
  return (
    <AuthProvider>
      <Router>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsAndConditions />} />
              <Route path="/unauthorized" element={<Unauthorized />} />
            </Route>

            <Route element={<AuthLayout />}>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
            </Route>

            <Route path="/app" element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="account" element={<ChangePassword />} />
                
                <Route path="assets" element={<AssetInventory />} />
                <Route path="assets/new" element={<AssetForm />} />
                <Route path="assets/:id" element={<AssetDetails />} />
                <Route path="assets/:id/edit" element={<AssetForm />} />
                <Route path="assets/:id/inspect" element={<InspectionForm />} />
                <Route path="map" element={<MapView />} />
                <Route path="inspections" element={<InspectionList />} />
                <Route path="inspections/new" element={<InspectionForm />} />
                <Route path="inspections/:id" element={<InspectionDetails />} />
                <Route path="maintenance" element={<MaintenanceList />} />
                <Route path="maintenance/new" element={<IssueForm />} />
                <Route path="maintenance/:id" element={<IssueDetails />} />
                <Route path="maintenance/:id/edit" element={<IssueForm />} />
                <Route path="lifecycle" element={<LifecycleHistory />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="users" element={<UsersAdmin />} />

                <Route path="*" element={<NotFound />} />
              </Route>
            </Route>

            <Route path="*" element={<PublicLayout />}>
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

export default App;
