import React from "react";
import { Steps, Typography, Input, InputNumber, Card, Button, Checkbox, Form, Space } from "antd";
import { DeleteOutlined, PlusOutlined, MinusCircleOutlined } from "@ant-design/icons";
import { ethers } from "ethers";

import { EtherInput, AddressInput, Address } from "../components";
import { useStore } from "../store/useStore";
import { useState } from "react";

const FACTORY_CONTRACT = "MultiSigFactory";

export default function CreateWallet() {
  const [state, dispatch] = useStore();
  const { address, price, mainnetProvider, tx, writeContracts, refreshToggle, setRefreshToggle } = state;
  const [owners, setOwners] = useState([]);
  const [preComputedAddress, setPreComputedAddress] = useState(undefined);
  // console.log(`n-🔴 => CreateWallet => preComputedAddress`, preComputedAddress);
  const [form] = Form.useForm();

  const onSubmit = values => {
    // console.log(`n-🔴 => onFinish => values`, values);

    const signaturesRequired = values["signatureCount"];
    const walletName = values["walletName"];
    const ownerList = [values["owner"], ...owners];
    const amount = values["amount"] ? values["amount"] : 0;

    try {
      tx(
        // create 2
        writeContracts[FACTORY_CONTRACT].create2(ownerList, signaturesRequired, walletName, {
          value: ethers.utils.parseEther("" + parseFloat(amount).toFixed(12)),
        }),
        async update => {
          if (update && (update.error || update.reason)) {
            console.log("tx update error!");
          }

          if (update && update.code) {
            //     setTxSent(false);
          }

          if (update && (update.status === "confirmed" || update.status === 1)) {
            console.log("tx update confirmed!");

            let computed_wallet_address = await writeContracts[FACTORY_CONTRACT].computedAddress(walletName);
            // console.log(`n-🔴 => onSubmit => computed_wallet_address`, computed_wallet_address);

            form.resetFields();
            setPreComputedAddress(undefined);
            setRefreshToggle(prev => !prev);
          }
        },
      ).catch(err => {
        throw err;
      });
    } catch (e) {
      console.log("CREATE MUTLI-SIG SUBMIT FAILED: ", e);
    }
  };

  const onFinishFailed = errorInfo => {
    // console.log(`n-🔴 => onFinishFailed => errorInfo`, errorInfo);
  };

  const checkWalletExist = async walletName => {
    if (!walletName) {
      setPreComputedAddress(() => undefined);
      return;
    }
    let computed_wallet_address = await writeContracts[FACTORY_CONTRACT].computedAddress(walletName);
    // console.log(`n-🔴 => checkWalletExist => computed_wallet_address`, computed_wallet_address);

    let isContractExists = await writeContracts[FACTORY_CONTRACT].provider.getCode(computed_wallet_address);
    if (isContractExists !== "0x") {
      setPreComputedAddress(() => undefined);
      return true;
    }
    setPreComputedAddress(() => computed_wallet_address);
    return false;
  };

  const updateOwner = (value, index) => {
    // for a single addresss
    if (value.length <= 42) {
      const newOwners = [...owners];
      newOwners[index] = value;
      setOwners(newOwners);
    }

    // if value is multiple addresses with comma
    if (value.length > 42) {
      //       addMultipleAddress(value);
    }
  };

  const addOwnerField = () => {
    const newOwners = [...owners, ""];
    setOwners(newOwners);
  };
  const removeOwnerField = index => {
    const newOwners = [...owners];
    newOwners.splice(index, 1);
    setOwners(newOwners);
  };

  return (
    <div className="w-full flex flex-col items-center">
      <Card title="Create new wallet" className="w-1/2">
        <div className="">
          <Form
            form={form}
            name="walletCreate"
            labelCol={{
              span: 8,
            }}
            wrapperCol={{
              span: 16,
            }}
            initialValues={{
              remember: true,
            }}
            onFinish={onSubmit}
            onFinishFailed={onFinishFailed}
            autoComplete="off"
          >
            <div className="m-2">
              <Form.Item
                label="Name"
                name="walletName"
                validateTrigger="onBlur"
                rules={[
                  {
                    required: true,
                    message: "Please enter wallet name!",
                    validateTrigger: "onBlur",
                  },
                  ({ getFieldValue }) => ({
                    validateTrigger: "onBlur",
                    async validator(_, value) {
                      let walletName = value;
                      let isExist = await checkWalletExist(walletName);
                      // console.log(`n-🔴 => validator => isExist`, isExist);
                      if (isExist) {
                        return Promise.reject(new Error("wallet already exists"));
                      }

                      return Promise.resolve();
                    },
                  }),
                ]}
                extra={
                  preComputedAddress && (
                    <div className="mt-2">
                      <div>Your wallet will be deploy on this address</div>
                      <Address address={preComputedAddress} fontSize={15} />
                    </div>
                  )
                }
              >
                <Input />
              </Form.Item>
            </div>
            <div className="mt-5">
              {address && (
                <Form.Item
                  label="Owners"
                  name="owner"
                  rules={[
                    {
                      required: true,
                      message: "Please enter  at least 1 owner!",
                    },
                  ]}
                  initialValue={address}
                >
                  <AddressInput disabled={true} autoFocus ensProvider={mainnetProvider} placeholder={"Owner address"} />
                </Form.Item>
              )}
            </div>
            {/* extra owners */}
            <div className="mt-5 flex flex-col items-end">
              <div className="text-xs text-gray-400 self-center mr-16">Other owners</div>
              {owners.map((owner, index) => (
                <div key={index} className="flex items-center justify-center">
                  <div className="m-2 w--full flex ">
                    <AddressInput
                      autoFocus
                      ensProvider={mainnetProvider}
                      placeholder={"Owner address"}
                      value={owner}
                      onChange={val => updateOwner(val, index)}
                    />
                  </div>

                  <Button danger onClick={() => removeOwnerField(index)}>
                    <DeleteOutlined />
                  </Button>
                </div>
              ))}
              <div className="m-2">
                <Button onClick={addOwnerField}>
                  <PlusOutlined />
                </Button>
              </div>
            </div>

            <div className="mt--5">
              <Form.Item
                label="Signature's count"
                name="signatureCount"
                rules={[
                  {
                    required: true,
                    message: "Please enter  required signature count!",
                  },
                ]}
              >
                <InputNumber min={0} />
              </Form.Item>
            </div>

            <div className="mt-5">
              <Form.Item
                label="Initial fund (optional)"
                name="amount"
                rules={[
                  {
                    required: false,
                  },
                ]}
              >
                <EtherInput price={price} mode="USD" />
              </Form.Item>
            </div>

            <Form.Item
              wrapperCol={{
                offset: 8,
                span: 20,
              }}
            >
              <Button type="primary" htmlType="submit">
                Submit
              </Button>
            </Form.Item>
          </Form>
        </div>
      </Card>
    </div>
  );
}
