import mysql from "mysql2/promise";


const conn = mysql.createPool({
    connectionLimit:10,
    host:"202.28.34.210",
    user:"66011212011",
    password:"66011212011",
    database:"db66011212011",
    port:3309
})

console.log("เชื่อมได้ยัง 😒");


export default conn;