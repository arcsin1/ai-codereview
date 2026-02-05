import React, { useRef, useImperativeHandle, forwardRef, useState, useCallback, useEffect, memo } from "react";
import { Modal as AntModal } from "antd";
import type { ModalProps } from "antd";

type IModalProps = {
  root?: string;
  content?: React.ReactNode | (() => React.ReactNode);
} & ModalProps;

type ModalItem = {
  id: string;
  content: React.ReactNode;
  props: IModalProps;
  resolve?: (value: boolean) => void; // 异步 confirm 使用
};

type ModalRef = {
  show: (content: React.ReactNode | (() => React.ReactNode), options?: IModalProps) => string;
  close: (id?: string) => void;
  closeAll: () => void;
  confirmAsync: (content: React.ReactNode | (() => React.ReactNode), options?: IModalProps) => Promise<boolean>;
};

// 单个 Modal 组件，独立渲染，安全关闭
const SingleModal = memo(({ modal, onClose, zIndex }: { modal: ModalItem; onClose: (id: string, result?: boolean) => void; zIndex: number }) => {
  const { id, content, props, resolve } = modal;
  const [visible, setVisible] = useState(true);

  // 内部关闭逻辑
  const handleOk = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    props.onOk?.(e);
    resolve?.(true);
    setVisible(false); // 先执行动画
  }, [props, resolve]);

  const handleCancel = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    props.onCancel?.(e);
    resolve?.(false);
    setVisible(false); // 先执行动画
  }, [props, resolve]);

  // 动画结束后通知父组件卸载
  const afterClose = useCallback(() => {
    onClose(id);
  }, [id, onClose]);

  const getContainer = props.root
    ? () => document.getElementById(props.root!) ?? document.body
    : undefined;

  // 外部标记 closeFlag，控制动画
  useEffect(() => {
    if ((props as any)._closeFlag) {
      setVisible(false);
    }
  }, [props]);

  return (
    <AntModal
      key={id}
      open={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      afterClose={afterClose}
      footer={props.footer !== undefined ? props.footer : null}
      destroyOnHidden
      closable
      maskClosable={false}
      getContainer={getContainer}
      width={props.width ?? 400}
      wrapClassName="custom-modal"
      style={{ overflow: "hidden", zIndex }}
      zIndex={zIndex}
      {...props}
    >
      {content}
    </AntModal>
  );
});

// 多 Modal 容器
const ModalContainer = forwardRef<ModalRef>((_, ref) => {
  const [modals, setModals] = useState<Record<string, ModalItem>>({});
  const idCounter = useRef(0);

  // 打开普通 Modal
  const show = useCallback((content: React.ReactNode | (() => React.ReactNode), options: IModalProps = {}) => {
    const id = `modal_${++idCounter.current}`;
    const modalContent = typeof content === "function" ? content() : content;
    setModals(prev => ({ ...prev, [id]: { id, content: modalContent, props: options } }));
    return id;
  }, []);

  // 安全关闭指定 Modal 或最后一个
  const close = useCallback((id?: string) => {
    setModals(prev => {
      const copy = { ...prev };
      if (id) {
        const modal = copy[id];
        if (modal) copy[id] = { ...modal, props: { ...modal.props, _closeFlag: true } as IModalProps & { _closeFlag: boolean } };
      } else {
        const keys = Object.keys(copy);
        const lastId = keys[keys.length - 1];
        const modal = copy[lastId];
        if (modal) copy[lastId] = { ...modal, props: { ...modal.props, _closeFlag: true } as IModalProps };
      }
      return copy;
    });
  }, []);

  // 卸载 Modal
  const removeModal = useCallback((id: string) => {
    setModals(prev => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  }, []);

  // 关闭所有
  const closeAll = useCallback(() => {
    setModals(prev => {
      const copy: Record<string, ModalItem> = {};
      Object.entries(prev).forEach(([id, modal]) => {
        copy[id] = { ...modal, props: { ...modal.props, _closeFlag: true } as IModalProps & { _closeFlag: boolean } };
      });
      return copy;
    });
  }, []);

  // 异步 confirm
  const confirmAsync = useCallback((content: React.ReactNode | (() => React.ReactNode), options: IModalProps = {}) => {
    return new Promise<boolean>(resolve => {
      const id = `modal_${++idCounter.current}`;
      const modalContent = typeof content === "function" ? content() : content;
      setModals(prev => ({
        ...prev,
        [id]: { id, content: modalContent, props: options, resolve }
      }));
    });
  }, []);

  useImperativeHandle(ref, () => ({ show, close, closeAll, confirmAsync }), [show, close, closeAll, confirmAsync]);

  return (
    <>
      {Object.values(modals).map((modal, index) => (
        <SingleModal
          key={modal.id}
          modal={modal}
          onClose={removeModal}
          zIndex={1000 + index}
        />
      ))}
    </>
  );
});

// 全局 Provider
const ModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const modalRef = useRef<ModalRef>(null);

  useEffect(() => {
    modalInstance = modalRef.current;
    return () => {
      modalInstance = null;
    };
  }, []);

  return (
    <>
      {children}
      <ModalContainer ref={modalRef} />
    </>
  );
};

// 全局 API
let modalInstance: ModalRef | null = null;

const modal = {
  show: (content: React.ReactNode | (() => React.ReactNode), options?: IModalProps) =>
    modalInstance?.show(content, options) || "",
  close: (id?: string) => modalInstance?.close(id),
  closeAll: () => modalInstance?.closeAll(),
  confirmAsync: (content: React.ReactNode | (() => React.ReactNode), options?: IModalProps) =>
    modalInstance?.confirmAsync(content, options) || Promise.resolve(false),
};

export { modal, ModalProvider };
