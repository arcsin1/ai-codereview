
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider, message } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { useTranslation } from 'react-i18next';
import { AppRouter } from '@/router';
import { DrawerProvider } from '@/components/drawer';
import { ModalProvider } from '@/components/modal';

// 配置 antd message 全局实例
message.config({
  top: 100,
  duration: 3,
  maxCount: 3,
});

function App() {
  const { i18n } = useTranslation();
  const locale = i18n.language.startsWith('zh') ? zhCN : undefined;

  return (
    <BrowserRouter>
      <ConfigProvider locale={locale}>
        <ModalProvider>
          <DrawerProvider>
            <AppRouter />
          </DrawerProvider>
        </ModalProvider>
      </ConfigProvider>
    </BrowserRouter>
  );
}

export default App;
