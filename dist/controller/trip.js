"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
exports.handleResponse = handleResponse;
const express_1 = __importDefault(require("express"));
const dbconnect_1 = __importDefault(require("../db/dbconnect"));
exports.router = express_1.default.Router();
// ------------------------------------------------------------
// DESTINATIONS CRUD
// ------------------------------------------------------------
// Get all destinations
exports.router.get("/destinations", (req, res) => {
    dbconnect_1.default.all("SELECT * FROM destination", [], (err, rows) => {
        handleResponse(res, err, rows);
    });
});
// Get a specific destination
exports.router.get("/destinations/:id", (req, res) => {
    const id = req.params.id;
    dbconnect_1.default.get("SELECT * FROM destination WHERE idx = ?", [id], (err, row) => {
        handleResponse(res, err, row, 404, "Destination not found");
    });
});
// Create a new destination
exports.router.post("/destinations", (req, res) => {
    const { zone } = req.body;
    dbconnect_1.default.run("INSERT INTO destination (zone) VALUES (?)", [zone], function (err) {
        handleResponse(res, err, { message: "Destination created successfully", id: this.lastID }, 500, "Failed to create destination");
    });
});
// Update a destination
exports.router.put("/destinations/:id", (req, res) => {
    const id = req.params.id;
    const { zone } = req.body;
    dbconnect_1.default.run("UPDATE destination SET zone = ? WHERE idx = ?", [zone, id], function (err) {
        handleResponse(res, err, { message: "Destination updated successfully" }, 404, "Destination not found", this.changes);
    });
});
// Delete a destination
exports.router.delete("/destinations/:id", (req, res) => {
    const id = req.params.id;
    dbconnect_1.default.run("DELETE FROM destination WHERE idx = ?", [id], function (err) {
        handleResponse(res, err, { message: "Destination deleted successfully" }, 404, "Destination not found", this.changes);
    });
});
// ------------------------------------------------------------
// TRIPS CRUD
// ------------------------------------------------------------
// GET /trip - get all trips
exports.router.get("/", (req, res) => {
    const sql = `
    SELECT 
        t.idx, 
        t.name, 
        t.country, 
        t.coverimage, 
        t.detail, 
        t.price, 
        t.duration,
        d.zone AS destination_zone 
    FROM 
        trip AS t
    JOIN 
        destination AS d ON t.destinationid = d.idx
    `;
    dbconnect_1.default.all(sql, [], (err, rows) => {
        handleResponse(res, err, rows);
    });
});
// GET /trip/search?name=xxx - search trips by name
exports.router.get("/search/fields", (req, res) => {
    const name = req.query.name ? String(req.query.name) : "";
    if (!name.trim()) {
        return res.json([]);
    }
    const sql = "SELECT * FROM trip WHERE name LIKE ?";
    dbconnect_1.default.all(sql, [`%${name}%`], (err, rows) => {
        if (err)
            return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});
// Get a specific trip
exports.router.get("/:id", (req, res) => {
    const id = req.params.id;
    const sql = `
    SELECT 
        t.idx, 
        t.name, 
        t.country, 
        t.coverimage, 
        t.detail, 
        t.price, 
        t.duration,
        d.zone AS destination_zone 
    FROM 
        trip AS t
    JOIN 
        destination AS d ON t.destinationid = d.idx
    WHERE 
        t.idx = ?
    `;
    dbconnect_1.default.get(sql, [id], (err, row) => {
        handleResponse(res, err, row, 404, "Trip not found");
    });
});
// Create a new trip
exports.router.post("/", (req, res) => {
    const { name, country, destinationid, coverimage, detail, price, duration } = req.body;
    dbconnect_1.default.run("INSERT INTO trip (name, country, destinationid, coverimage, detail, price, duration) VALUES (?, ?, ?, ?, ?, ?, ?)", [name, country, destinationid, coverimage, detail, price, duration], function (err) {
        handleResponse(res, err, { message: "Trip created successfully", id: this.lastID }, 500, "Failed to create trip");
    });
});
// Update a trip
exports.router.put("/:id", (req, res) => {
    const id = req.params.id;
    const { name, country, destinationid, coverimage, detail, price, duration } = req.body;
    dbconnect_1.default.run("UPDATE trip SET name = ?, country = ?, destinationid = ?, coverimage = ?, detail = ?, price = ?, duration = ? WHERE idx = ?", [name, country, destinationid, coverimage, detail, price, duration, id], function (err) {
        handleResponse(res, err, { message: "Trip updated successfully" }, 404, "Trip not found", this.changes);
    });
});
// Delete a trip
exports.router.delete("/:id", (req, res) => {
    const id = req.params.id;
    dbconnect_1.default.run("DELETE FROM trip WHERE idx = ?", [id], function (err) {
        handleResponse(res, err, { message: "Trip deleted successfully" }, 404, "Trip not found", this.changes);
    });
});
// ------------------------------------------------------------
// CUSTOMERS CRUD
// ------------------------------------------------------------
// Get all customers
exports.router.get("/customers", (req, res) => {
    dbconnect_1.default.all("SELECT * FROM customer", [], (err, rows) => {
        if (err) {
            handleResponse(res, err);
            return;
        }
        // Remove password from each customer object
        const sanitizedRows = rows.map(row => {
            const sanitizedRow = { ...rows };
            return sanitizedRow;
        });
        handleResponse(res, null, sanitizedRows);
    });
});
// Get a specific customer
exports.router.get("/customers/:id", (req, res) => {
    const id = req.params.id;
    dbconnect_1.default.get("SELECT * FROM customer WHERE idx = ?", [id], (err, row) => {
        if (err) {
            handleResponse(res, err, null, 404, "Customer not found");
            return;
        }
        if (!row) {
            handleResponse(res, null, null, 404, "Customer not found");
            return;
        }
        const sanitizedRow = { ...row };
        handleResponse(res, null, sanitizedRow);
    });
});
// Create a new customer
exports.router.post("/customers", (req, res) => {
    const { fullname, phone, email, image, password } = req.body;
    dbconnect_1.default.run("INSERT INTO customer (fullname, phone, email, image, password) VALUES (?, ?, ?, ?, ?)", [fullname, phone, email, image, password], function (err) {
        handleResponse(res, err, { message: "Customer created successfully", id: this.lastID }, 500, "Failed to create customer");
    });
});
// Update a customer
exports.router.put("/customers/:id", (req, res) => {
    const id = req.params.id;
    const { fullname, phone, email, image } = req.body;
    dbconnect_1.default.run("UPDATE customer SET fullname = ?, phone = ?, email = ?, image = ? WHERE idx = ?", [fullname, phone, email, image, id], function (err) {
        handleResponse(res, err, { message: "Customer updated successfully" }, 404, "Customer not found", this.changes);
    });
});
// Delete a customer
exports.router.delete("/customers/:id", (req, res) => {
    const id = req.params.id;
    dbconnect_1.default.run("DELETE FROM customer WHERE idx = ?", [id], function (err) {
        handleResponse(res, err, { message: "Customer deleted successfully" }, 404, "Customer not found", this.changes);
    });
});
exports.router.post("/customers/login", (req, res) => {
    const { phone, password } = req.body;
    // Basic validation (you should add more robust validation in a real app)
    if (!phone || !password) {
        res.status(400).json({ error: "Phone and password are required" });
        return;
    }
    const sql = "SELECT * FROM customer WHERE phone = ? AND password = ?";
    dbconnect_1.default.get(sql, [phone, password], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (!row) {
            res.status(401).json({ error: "Invalid phone or password" });
            return;
        }
        // Successful login - remove password from response
        const customerData = { ...row }; // Create a copy
        res.json({ message: "Login successful", customer: customerData });
    });
});
// ------------------------------------------------------------
// MEETINGS CRUD
// ------------------------------------------------------------
// Get all meetings
exports.router.get("/meetings", (req, res) => {
    dbconnect_1.default.all("SELECT * FROM meeting", [], (err, rows) => {
        handleResponse(res, err, rows);
    });
});
// Get a specific meeting
exports.router.get("/meetings/:id", (req, res) => {
    const id = req.params.id;
    dbconnect_1.default.get("SELECT * FROM meeting WHERE idx = ?", [id], (err, row) => {
        handleResponse(res, err, row, 404, "Meeting not found");
    });
});
// Create a new meeting
exports.router.post("/meetings", (req, res) => {
    const { detail, meetingdatetime, latitude, longitude } = req.body;
    dbconnect_1.default.run("INSERT INTO meeting (detail, meetingdatetime, latitude, longitude) VALUES (?, ?, ?, ?)", [detail, meetingdatetime, latitude, longitude], function (err) {
        handleResponse(res, err, { message: "Meeting created successfully", id: this.lastID }, 500, "Failed to create meeting");
    });
});
// Update a meeting
exports.router.put("/meetings/:id", (req, res) => {
    const id = req.params.id;
    const { detail, meetingdatetime, latitude, longitude } = req.body;
    dbconnect_1.default.run("UPDATE meeting SET detail = ?, meetingdatetime = ?, latitude = ?, longitude = ? WHERE idx = ?", [detail, meetingdatetime, latitude, longitude, id], function (err) {
        handleResponse(res, err, { message: "Meeting updated successfully" }, 404, "Meeting not found", this.changes);
    });
});
// Delete a meeting
exports.router.delete("/meetings/:id", (req, res) => {
    const id = req.params.id;
    dbconnect_1.default.run("DELETE FROM meeting WHERE idx = ?", [id], function (err) {
        handleResponse(res, err, { message: "Meeting deleted successfully" }, 404, "Meeting not found", this.changes);
    });
});
// ------------------------------------------------------------
// BOOKINGS CRUD
// ------------------------------------------------------------
// Get all bookings
exports.router.get("/bookings", (req, res) => {
    dbconnect_1.default.all("SELECT * FROM booking", [], (err, rows) => {
        handleResponse(res, err, rows);
    });
});
// Get a specific booking
exports.router.get("/bookings/:id", (req, res) => {
    const id = req.params.id;
    dbconnect_1.default.get("SELECT * FROM booking WHERE idx = ?", [id], (err, row) => {
        handleResponse(res, err, row, 404, "Booking not found");
    });
});
// Create a new booking
exports.router.post("/bookings", (req, res) => {
    const { customerid, bookdatetime, tripid, meetingid } = req.body;
    dbconnect_1.default.run("INSERT INTO booking (customerid, bookdatetime, tripid, meetingid) VALUES (?, ?, ?, ?)", [customerid, bookdatetime, tripid, meetingid], function (err) {
        handleResponse(res, err, { message: "Booking created successfully", id: this.lastID }, 500, "Failed to create booking");
    });
});
// Update a booking
exports.router.put("/bookings/:id", (req, res) => {
    const id = req.params.id;
    const { customerid, bookdatetime, tripid, meetingid } = req.body;
    dbconnect_1.default.run("UPDATE booking SET customerid = ?, bookdatetime = ?, tripid = ?, meetingid = ? WHERE idx = ?", [customerid, bookdatetime, tripid, meetingid, id], function (err) {
        handleResponse(res, err, { message: "Booking updated successfully" }, 404, "Booking not found", this.changes);
    });
});
// Delete a booking
exports.router.delete("/bookings/:id", (req, res) => {
    const id = req.params.id;
    dbconnect_1.default.run("DELETE FROM booking WHERE idx = ?", [id], function (err) {
        handleResponse(res, err, { message: "Booking deleted successfully" }, 404, "Booking not found", this.changes);
    });
});
// Helper function to handle API responses
function handleResponse(res, err, data, notFoundStatusCode = 404, notFoundMessage = "Not found", changes = null) {
    if (err) {
        res.status(500).json({ error: err.message });
        return;
    }
    if (!data && !changes) {
        res.status(notFoundStatusCode).json({ error: notFoundMessage });
        return;
    }
    res.json(data);
}
