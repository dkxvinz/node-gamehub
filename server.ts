import express from "express";
import cors from 'cors';
import { app } from "./app";
import * as os from "os";

const PORT = process.env.PORT ||3000;

app.use(express.json());

app.use(cors({
  origin: [
    "*"
  ]
}));


const ip: string = (() => {
    let address = "0.0.0.0";
    const interfaces = os.networkInterfaces();

    Object.keys(interfaces).forEach((interfaceName) => {
        interfaces[interfaceName]?.forEach((interfaceInfo) => {
            if (interfaceInfo.family === "IPv4" && !interfaceInfo.internal) {
                address = interfaceInfo.address;
            }
        });
    });

    return address;
})();

app.listen(PORT, () => {
    console.log(`GameHub API listening at http://${ip}:${PORT}`);
});


