import {
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  UserOutlined,
  LogoutOutlined,
  GlobalOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { Button, Dropdown, Avatar, Layout, Typography, Space } from "antd";
import type { MenuProps } from "antd";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/store/useAuthStore";
import { useAppStore } from "@/store/useAppStore";
import "./Header.less";

const { Header: AntHeader } = Layout;
const { Text } = Typography;

export const Header = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user: authUser, logout } = useAuthStore();
  const { sidebarCollapsed, toggleSidebar } = useAppStore();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleLanguageChange = ({ key }: { key: string }) => {
    i18n.changeLanguage(key);
  };

  const languageItems: MenuProps["items"] = [
    {
      key: "en",
      label: "English",
      icon: <span className="lang-icon">🇺🇸</span>,
    },
    {
      key: "zh",
      label: "中文",
      icon: <span className="lang-icon">🇨🇳</span>,
    },
  ];

  const userItems: MenuProps["items"] = [
    {
      key: "profile",
      label: t('header.profile'),
      icon: <UserOutlined />,
      onClick: () => navigate("/profile"),
    },
    {
      type: "divider",
    },
    {
      key: "logout",
      label: t('common.logout'),
      icon: <LogoutOutlined />,
      onClick: handleLogout,
      danger: true,
    },
  ];

  const currentLang = i18n.language.startsWith('zh') ? '中文' : 'English';
  const currentLangIcon = i18n.language.startsWith('zh') ? '🇨🇳' : '🇺🇸';

  return (
    <AntHeader className="header">
      <div className="header-left">
        <Button
          type="text"
          className="menu-btn"
          icon={
            sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />
          }
          onClick={toggleSidebar}
        />
      </div>

      <div className="header-right">
        <Space size={16}>
          {/* Language Switcher */}
          <Dropdown
            menu={{
              items: languageItems,
              onClick: handleLanguageChange,
              selectedKeys: [i18n.language],
            }}
            placement="bottomRight"
            trigger={["click"]}
          >
            <Button type="text" className="lang-btn">
              <Space>
                <span>{currentLangIcon}</span>
                <span>{currentLang}</span>
                <GlobalOutlined />
              </Space>
            </Button>
          </Dropdown>

          <Dropdown
            menu={{ items: userItems }}
            placement="bottomRight"
            trigger={["click"]}
          >
            <div className="user-dropdown">
              <Avatar
                size="small"
                style={{ backgroundColor: "#5b4eff" }}
                icon={<UserOutlined />}
              />
              <Text className="username">{authUser?.username || t('header.user')}</Text>
            </div>
          </Dropdown>
        </Space>
      </div>
    </AntHeader>
  );
};
