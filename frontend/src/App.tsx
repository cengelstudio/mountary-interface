import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
// @ts-ignore
import Disks from './pages/Disks';
// @ts-ignore
import Devices from './pages/Devices';
import Login from './pages/Login';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LayoutProvider } from './contexts/LayoutContext';
import About from './pages/About';
import DiskDetail from './pages/DiskDetail';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return <div>Loading...</div>;
    }

    return user ? <>{children}</> : <Navigate to="/login" />;
};

const App: React.FC = () => {
    return (
        <Router>
            <AuthProvider>
                <LayoutProvider>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route
                            path="/"
                            element={
                                <PrivateRoute>
                                    <Layout>
                                        <Home />
                                    </Layout>
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/disks"
                            element={
                                <PrivateRoute>
                                    <Layout>
                                        <Disks />
                                    </Layout>
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/devices"
                            element={
                                <PrivateRoute>
                                    <Layout>
                                        <Devices />
                                    </Layout>
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/disk/:id"
                            element={
                                <PrivateRoute>
                                    <Layout>
                                        <DiskDetail />
                                    </Layout>
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/about"
                            element={
                                <PrivateRoute>
                                    <Layout>
                                        <About />
                                    </Layout>
                                </PrivateRoute>
                            }
                        />
                    </Routes>
                </LayoutProvider>
            </AuthProvider>
        </Router>
    );
};

export default App;
