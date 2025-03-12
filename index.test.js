const request = require("supertest");
const fs = require("fs");
const app = require("./index");

let server;

beforeAll((done) => {
    server = app.listen(4000, done);
});

afterAll((done) => {
    server.close(done);
});

describe("To-Do List API", () => {
    it("should return the to-do list", async () => {
        const response = await request(server).get("/");
        expect(response.status).toBe(200);
    });

    it("should add a new task", async () => {
        const newTask = { task: "Study Node.js" };
        const response = await request(server).post("/").send(newTask);
        expect(response.status).toBe(302);
    });

    it("should not add an empty task", async () => {
        const response = await request(server).post("/").send({ task: "" });
        expect(response.status).toBe(200);
    });

    it("should delete a task", async () => {
        await request(server).post("/").send({ task: "Task to Delete" });
        const response = await request(server).get("/delete-task/1");
        expect(response.status).toBe(302);
    });

    it("should return 404 for deleting a non-existing task", async () => {
        const response = await request(server).get("/delete-task/999");
        expect(response.status).toBe(404);
    });

    it("should clear all tasks", async () => {
        const response = await request(server).get("/clear-all");
        expect(response.status).toBe(302);
    });

    it("should handle file read error", async () => {
        jest.spyOn(fs, "readFile").mockImplementation((_, callback) => {
            callback(new Error("File read error"), null);
        });
        const response = await request(server).get("/");
        expect(response.status).toBe(500);
        fs.readFile.mockRestore();
    });

    it("should handle file write error", async () => {
        jest.spyOn(fs, "writeFile").mockImplementation((_, callback) => {
            callback(new Error("File write error"));
        });
        const response = await request(server).post("/").send({ task: "Write error test" });
        expect(response.status).toBe(500);
        fs.writeFile.mockRestore();
    });

    it("should handle clear-all file write error", async () => {
        jest.spyOn(fs, "writeFile").mockImplementation((_, callback) => {
            callback(new Error("Clear-all error"));
        });
        const response = await request(server).get("/clear-all");
        expect(response.status).toBe(500);
        fs.writeFile.mockRestore();
    });

    it("should generate sequential task IDs correctly", async () => {
        await request(server).get("/clear-all");
        await request(server).post("/").send({ task: "First Task" });
        await request(server).post("/").send({ task: "Second Task" });
        const tasks = await request(server).get("/");
        expect(tasks.text).toContain("First Task");
        expect(tasks.text).toContain("Second Task");
    });
});
