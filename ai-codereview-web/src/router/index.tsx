import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy } from 'react';
import { PrivateRoute } from './PrivateRoute';

// 懒加载页面组件
const Login = lazy(() => import('@/pages/login/Login'));
const Dashboard = lazy(() => import('@/pages/dashboard'));
const Reviews = lazy(() => import('@/pages/reviews'));
const Projects = lazy(() => import('@/pages/projects'));
const LlmConfigs = lazy(() => import('@/pages/llm-configs'));
const GitConfigs = lazy(() => import('@/pages/git-configs'));

export const AppRouter = () => {
  return (
    <Routes>
      {/* 公开路由 */}
      <Route path="/login" element={<Login />} />

      {/* 私有路由 */}
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/reviews"
        element={
          <PrivateRoute>
            <Reviews />
          </PrivateRoute>
        }
      />
      <Route
        path="/projects"
        element={
          <PrivateRoute>
            <Projects />
          </PrivateRoute>
        }
      />
      <Route
        path="/llm-configs"
        element={
          <PrivateRoute>
            <LlmConfigs />
          </PrivateRoute>
        }
      />
      <Route
        path="/git-configs"
        element={
          <PrivateRoute>
            <GitConfigs />
          </PrivateRoute>
        }
      />


      {/* 默认重定向 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
