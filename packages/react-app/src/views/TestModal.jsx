import { Button, Modal } from "antd";
import React, { useState } from "react";

const TestModal = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  console.log("n-isModalVisible: ", isModalVisible);

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleOk = () => {
    setIsModalVisible(false);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  return (
    <>
      <Button type="primary" onClick={showModal}>
        Open Modal
      </Button>
      <Modal title="Basic Modal" visible={isModalVisible} onOk={handleOk} onCancel={handleCancel}>
        <p>Some contents...</p>
        <p>Some contents...</p>
        <p>Some contents...</p>
      </Modal>
    </>
  );
};

const checkProps = (prePorps, nextProps) => {
  console.log("n-nextProps: ", nextProps);
  console.log("n-prePorps: ", prePorps);
  return false;
};
export default TestModal;
