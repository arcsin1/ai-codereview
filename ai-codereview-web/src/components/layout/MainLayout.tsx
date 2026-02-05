import { type ReactNode } from 'react';
import { Layout } from 'antd';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { useAppStore } from '@/store/useAppStore';
import './MainLayout.less';

const { Content } = Layout;

interface MainLayoutProps {
  children: ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  const { sidebarCollapsed } = useAppStore();

  return (
    <Layout className="main-layout">
      <Sidebar />
      <Layout style={{ marginLeft: sidebarCollapsed ? 64 : 200, transition: 'margin-left 0.2s' }}>
        <Header />
        <Content className="main-content">
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};
