import React, { useRef } from "react";
import "./App.css";

const decoder = new TextDecoder();

function App() {
  const [connected, setConnected] = React.useState(false);
  const port = useRef<SerialPort>();
  const reader = useRef<ReadableStreamDefaultReader<string>>();

  const [messages, setMessages] = React.useState<string[]>([]);

  const toggleConnection = async () => {
    if (connected && port.current && reader.current) {
      await reader.current.cancel();
      reader.current.releaseLock();
      await port.current.close();
      port.current = undefined;
      return setConnected(false);
    }

    const ports = await navigator.serial.getPorts();
    if (ports.length === 0) {
      port.current = await navigator.serial.requestPort();
    } else {
      port.current = ports[0];
    }

    await port.current.open({ baudRate: 9600 });

    reader.current = port.current.readable.getReader();

    Promise.resolve().then(async () => {
      // Listen to data coming from the serial device.
      while (true) {
        const { value, done } = await reader.current!.read();
        if (done) {
          // Allow the serial port to be closed later.
          reader.current!.releaseLock();
          break;
        }
        const decoded = decoder.decode(value);
        setMessages((messages) => [...messages, decoded]);
      }
    });

    setConnected(true);
  };

  return (
    <>
      <button onClick={toggleConnection}>
        {connected ? "Disconnect" : "Connect"}
      </button>
      <div>
        <h2>Messages</h2>
        <pre>{JSON.stringify(messages, null, 0)}</pre>
      </div>
    </>
  );
}

export default App;
