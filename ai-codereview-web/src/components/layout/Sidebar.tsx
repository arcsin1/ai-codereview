import { NavLink, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  FileTextOutlined,
  FolderOutlined,
  SettingOutlined,
  ApiOutlined,
  GithubOutlined,
} from '@ant-design/icons';
import { Layout, Menu, type MenuProps } from 'antd';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/store/useAppStore';
import { useAuthStore } from '@/store/useAuthStore';
import './Sidebar.less';

const { Sider } = Layout;

export const Sidebar = () => {
  const { t } = useTranslation();
  const { sidebarCollapsed } = useAppStore();
  const { user } = useAuthStore();
  const location = useLocation();
  const isAdmin = user?.role === 'ADMIN';

  const menuItems: MenuProps['items'] = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: <NavLink to="/">{t('sidebar.dashboard')}</NavLink>,
    },
    {
      key: '/reviews',
      icon: <FileTextOutlined />,
      label: <NavLink to="/reviews">{t('sidebar.reviews')}</NavLink>,
    },
    {
      key: '/projects',
      icon: <FolderOutlined />,
      label: <NavLink to="/projects">{t('sidebar.projects')}</NavLink>,
    },
    {
      key: '/llm-configs',
      icon: <SettingOutlined />,
      label: <NavLink to="/llm-configs">{t('sidebar.llmConfigs')}</NavLink>,
    },
    {
      key: '/git-configs',
      icon: <ApiOutlined />,
      label: <NavLink to="/git-configs">{t('sidebar.gitConfigs')}</NavLink>,
    },
  ].filter((item) => !isAdmin || item.key !== '/llm-configs');

  return (
    <Sider
      collapsible
      collapsed={sidebarCollapsed}
      trigger={null}
      className="sidebar"
      width={200}
      collapsedWidth={64}
    >
      <div className="sidebar-logo">
        <GithubOutlined />
        {!sidebarCollapsed && <span>AI CodeReview</span>}
      </div>
      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        className="sidebar-menu"
        items={menuItems}
      />
    </Sider>
  );
};
