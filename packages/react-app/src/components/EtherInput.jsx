import { Input } from "antd";
import React, { useEffect, useState } from "react";
import { getPriceModePrefix } from "../constants";
import { ethers } from "ethers";

// small change in useEffect, display currentValue if it's provided by user

/**
  ~ What it does? ~

  Displays input field for ETH/USD amount, with an option to convert between ETH and USD

  ~ How can I use? ~

  <EtherInput
    autofocus
    price={price}
    value=100
    placeholder="Enter amount"
    onChange={value => {
      setAmount(value);
    }}
  />

  ~ Features ~

  - Provide price={price} of ether and easily convert between USD and ETH
  - Provide value={value} to specify initial amount of ether
  - Provide placeholder="Enter amount" value for the input
  - Control input change by onChange={value => { setAmount(value);}}

  ~ Notes ~
  The onChange handler receives amount in "eth"
**/

export default function EtherInput(props) {
  const [mode, setMode] = useState();
  const [display, setDisplay] = useState();
  const [value, setValue] = useState();

  const { value: defaultValueInEth, price, onChange: triggerOnChange, placeholder, autoFocus } = props;

  useEffect(() => {
    // If defaultValueInEth which is the "value" coming from parent is finite and user hasn't entered any value locally,
    // then only set value coming from parent to local else keep it as controlled.
    if (isFinite(defaultValueInEth) && isNaN(value)) {
      setValue(defaultValueInEth);
      setDisplay(defaultValueInEth);
    }
  }, [defaultValueInEth]);

  useEffect(() => {
    if (!mode) {
      setMode(price ? "USD" : "ETH");
    }
  }, [price]);

  useEffect(() => {
    if (!value) {
      setDisplay("");
    }
  }, [value]);

  const handleInputChange = async e => {
    const newValue = e.target.value;
    if (mode === "USD") {
      const possibleNewValue = parseFloat(newValue);
      if (possibleNewValue) {
        const ethValue = possibleNewValue / price;
        setValue(ethValue);
        if (typeof triggerOnChange === "function") {
          triggerOnChange(ethValue);
        }
        setDisplay(newValue);
      } else {
        setDisplay(newValue);
      }
    } else {
      try {
        // If it's a value input by user, the parseEther works fine else it throws error.
        // In case the value is invalid, we do not setValue as after setting invalid value,
        // we try to convert from ETH to USD, it'll show NaN instead.
        const inBigNumber = ethers.utils.parseEther(newValue);
        if (inBigNumber) {
          setValue(newValue);
        }
      } catch (error) {
        // Ignoring the case where we get invalid eth value.
      }

      if (typeof triggerOnChange === "function") {
        triggerOnChange(newValue);
      }
      setDisplay(newValue);
    }
  };

  const handleConversionClick = () => {
    if (mode === "USD") {
      setMode("ETH");
      setDisplay(value);
    } else {
      setMode("USD");
      if (value) {
        const usdValue = "" + (parseFloat(value) * price).toFixed(2);
        setDisplay(usdValue);
      } else {
        setDisplay(value);
      }
    }
  };

  return (
    <Input
      placeholder={placeholder ? placeholder : "amount in " + mode}
      autoFocus={autoFocus}
      prefix={getPriceModePrefix(mode)}
      value={display}
      addonAfter={
        !price ? (
          ""
        ) : (
          <div style={{ cursor: "pointer" }} onClick={handleConversionClick}>
            {`${mode} 🔀`}
          </div>
        )
      }
      onChange={handleInputChange}
    />
  );
}
