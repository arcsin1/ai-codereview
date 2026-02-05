import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  forwardRef,
  memo,
} from 'react';
import { Drawer as AntDrawer, Button } from 'antd';
import type { DrawerProps } from 'antd';

export type IDrawerProps = {
  root?: string;
  content?: React.ReactNode | (() => React.ReactNode);
  showFooter?: boolean;
  okText?: React.ReactNode;
  cancelText?: React.ReactNode;
  onOk?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  /** @deprecated Use `size` instead */
  width?: number | string;
} & Omit<DrawerProps, 'width'>;

export type DrawerItem = {
  id: string;
  content: React.ReactNode;
  props: IDrawerProps;
  resolve?: (value: boolean) => void; // 异步 confirm 使用
};

export type DrawerRef = {
  show: (content: React.ReactNode | (() => React.ReactNode), options?: IDrawerProps) => string;
  close: (id?: string) => void;
  closeAll: () => void;
  confirmAsync: (
    content: React.ReactNode | (() => React.ReactNode),
    options?: IDrawerProps
  ) => Promise<boolean>;
};

const SingleDrawer = memo(
  ({
    item,
    onClose,
    zIndex,
  }: {
    item: DrawerItem;
    onClose: (id: string, result?: boolean) => void;
    zIndex: number;
  }) => {
    const { id, content, props, resolve } = item;
    const [open, setOpen] = useState(true);

    const getContainer = props.getContainer
      ? props.getContainer
      : document.getElementsByClassName('layout-content')[0]

    // 提交 & 取消
    const handleOk = useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        props.onOk?.(e);
        resolve?.(true);
        setOpen(false);
      },
      [props, resolve]
    );

    const handleCancel = useCallback(() => {
      props.onClose?.({} as any);
      resolve?.(false);
      setOpen(false);
    }, [props, resolve]);

    // 外部安全关闭标记
    useEffect(() => {
      if ((props as any)._closeFlag) {
        setOpen(false);
      }
    }, [props]);

    // 动画结束卸载
    const afterOpenChange: DrawerProps['afterOpenChange'] = useCallback(
      (nextOpen: boolean) => {
        if (!nextOpen) onClose(id);
      },
      [id, onClose]
    );

    const needDefaultFooter = (props.showFooter || resolve) && props.footer === undefined;

    const footer = needDefaultFooter ? (
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <Button onClick={handleCancel}>{props.cancelText ?? '取消'}</Button>
        <Button type="primary" onClick={handleOk}>
          {props.okText ?? '确定'}
        </Button>
      </div>
    ) : (
      (props.footer ?? null)
    );

    return (
      <AntDrawer
        open={open}
        onClose={handleCancel}
        afterOpenChange={afterOpenChange}
        destroyOnHidden
        maskClosable={false}
        getContainer={getContainer}
        size={props.width ?? 'default'}
        zIndex={zIndex}
        rootStyle={{ position: 'absolute' }}
        styles={{ body: { overflow: 'auto' }}}
        {...props}
        // 避免将自定义属性传给 DOM
        footer={footer}
      >
        {content}
      </AntDrawer>
    );
  }
);

const DrawerContainer = forwardRef<DrawerRef>((_, ref) => {
  const [drawers, setDrawers] = useState<Record<string, DrawerItem>>({});
  const idCounter = useRef(0);

  const show = useCallback<DrawerRef['show']>((content, options = {}) => {
    const id = `drawer_${++idCounter.current}`;
    const node = typeof content === 'function' ? content() : content;
    setDrawers((prev) => ({ ...prev, [id]: { id, content: node, props: options } }));
    return id;
  }, []);

  const close = useCallback<DrawerRef['close']>((id) => {
    setDrawers((prev) => {
      const copy = { ...prev };
      if (id) {
        const d = copy[id];
        if (d) copy[id] = { ...d, props: { ...d.props, _closeFlag: true } as any };
      } else {
        const keys = Object.keys(copy);
        const lastId = keys[keys.length - 1];
        const d = copy[lastId];
        if (d) copy[lastId] = { ...d, props: { ...d.props, _closeFlag: true } as any };
      }
      return copy;
    });
  }, []);

  const remove = useCallback((id: string) => {
    setDrawers((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  }, []);

  const closeAll = useCallback(() => {
    setDrawers((prev) => {
      const copy: Record<string, DrawerItem> = {};
      Object.entries(prev).forEach(([id, d]) => {
        copy[id] = { ...d, props: { ...d.props, _closeFlag: true } as any };
      });
      return copy;
    });
  }, []);

  const confirmAsync = useCallback<DrawerRef['confirmAsync']>((content, options = {}) => {
    return new Promise<boolean>((resolve) => {
      const id = `drawer_${++idCounter.current}`;
      const node = typeof content === 'function' ? content() : content;
      setDrawers((prev) => ({
        ...prev,
        [id]: { id, content: node, props: { ...options, showFooter: true }, resolve },
      }));
    });
  }, []);

  useImperativeHandle(ref, () => ({ show, close, closeAll, confirmAsync }), [
    show,
    close,
    closeAll,
    confirmAsync,
  ]);

  return (
    <>
      {Object.values(drawers).map((item, index) => (
        <SingleDrawer key={item.id} item={item} onClose={remove} zIndex={1000 + index} />
      ))}
    </>
  );
});

const DrawerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const ref = useRef<DrawerRef>(null);

  useEffect(() => {
    drawerInstance = ref.current;
    return () => {
      drawerInstance = null;
    };
  }, []);

  return (
    <>
      {children}
      <DrawerContainer ref={ref} />
    </>
  );
};

let drawerInstance: DrawerRef | null = null;

const drawer = {
  show: (content: React.ReactNode | (() => React.ReactNode), options?: IDrawerProps) =>
    drawerInstance?.show(content, options) || '',
  close: (id?: string) => drawerInstance?.close(id),
  closeAll: () => drawerInstance?.closeAll(),
  confirmAsync: (content: React.ReactNode | (() => React.ReactNode), options?: IDrawerProps) =>
    drawerInstance?.confirmAsync(content, options) || Promise.resolve(false),
};

export { drawer, DrawerProvider };
