const express = require('express');
const app = express();
const fs = require('fs');
const path = require('path');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const readFile = (filename) => {
    return new Promise((resolve, reject) => {
        fs.readFile(filename, 'utf8', (err, data) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(JSON.parse(data));
        });
    });
};

const writeFile = (filename, data) => {
    return new Promise((resolve, reject) => {
        fs.writeFile(filename, JSON.stringify(data, null, 2), 'utf-8', (err) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(true);
        });
    });
};

app.get('/', async (req, res) => {
    try {
        const tasks = await readFile('./views/tasks.json');
        res.render('index', { tasks, error: null });
    } catch (error) {
        res.status(500).send("Error reading task data");
    }
});

app.post('/', async (req, res) => {
    let error = null;
    if (!req.body.task || req.body.task.trim().length === 0) {
        error = 'Please insert correct task data';
        try {
            const tasks = await readFile('./views/tasks.json');
            res.render('index', { tasks, error });
        } catch (err) {
            res.status(500).send("Error reading task data");
        }
        return;
    }
    try {
        const tasks = await readFile('./views/tasks.json');
        const index = tasks.length > 0 ? tasks[tasks.length - 1].id + 1 : 0;
        const newTask = { id: index, task: req.body.task };
        tasks.push(newTask);
        await writeFile('./views/tasks.json', tasks);
        res.redirect('/');
    } catch (error) {
        res.status(500).send("Error processing task");
    }
});

app.get('/delete-task/:taskId', async (req, res) => {
    const deleteTaskId = parseInt(req.params.taskId);
    try {
        let tasks = await readFile('./views/tasks.json');
        const initialLength = tasks.length;
        tasks = tasks.filter(task => task.id !== deleteTaskId);
        if (tasks.length === initialLength) {
            return res.status(404).send("Task not found");
        }
        await writeFile('./views/tasks.json', tasks);
        res.redirect('/');
    } catch (error) {
        res.status(500).send("Error deleting task");
    }
});

app.get('/clear-all', async (req, res) => {
    try {
        await writeFile('./views/tasks.json', []);
        res.redirect('/');
    } catch (error) {
        res.status(500).send("Error clearing tasks");
    }
});

const server = app.listen(3001, () => {
    console.log("Server running on port 3001");
});

module.exports = app;