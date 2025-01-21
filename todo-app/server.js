const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 8080;

app.use(bodyParser.json());

const users = [];
const checklists = [];
const secretKey = '3f5e1a2b4c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2';

//Using JWT for authentication
const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, secretKey, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// 1.1 Get Auth API

// 1. Request Token
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username && u.password === password);
    if (!user) return res.sendStatus(401);

    const token = jwt.sign({ username: user.username }, secretKey);
    res.json({ token });
});

// 2. Register
app.post('/register', (req, res) => {
    const { email, password, username } = req.body;
    const user = { email, password, username };
    const existingUser  = users.find(user => user.email === email || user.username === username);
    if (existingUser ) {
        return res.status(409).json({ message: 'Email or username already taken' });
    }
    users.push(user);
    res.status(201).json({ message: 'User  registered successfully' });
});

// 1.2 Get Checklist API
// 1. Get All Checklists
app.get('/checklist', authenticateToken, (req, res) => {
    res.json(checklists);
});

// 2. Create new checklist
app.post('/checklist', authenticateToken, (req, res) => {
    const { name } = req.body;
    const checklist = { id: checklists.length + 1, name };
    checklists.push(checklist);
    res.status(201).json(checklist);
});

// 3. Delete checklist by ID
app.delete('/checklist/:checklistId', authenticateToken, (req, res) => {
    const { checklistId } = req.params;
    const index = checklists.findIndex(c => c.id == checklistId);
    if (index === -1) return res.sendStatus(404);

    checklists.splice(index, 1);
    res.sendStatus(204);
});

// 1.3 GET Cheklist Item API
// 1. Get all Checklist Item by checklist id
app.get('/checklist/:checklistId/item', authenticateToken, (req, res) => {
    const { checklistId } = req.params;
    const checklist = checklists.find(c => c.id == checklistId);
    if (!checklist) return res.sendStatus(404);

    res.json(checklist.items || []);
});

// 2. Create new checklist item in checklist
app.post('/checklist/:checklistId/item', authenticateToken, (req, res) => {
    const { checklistId } = req.params;
    const { itemName } = req.body;
    const checklist = checklists.find(c => c.id == checklistId);
    if (!checklist) return res.sendStatus(404);

    const item = { id: (checklist.items?.length || 0) + 1, name: itemName, status: false };
    checklist.items = checklist.items || [];
    checklist.items.push(item);
    res.status(201).json(item);
});

// 3. Get checklist item by checklist ID and item ID
app.get('/checklist/:checklistId/item/:checklistItemId', authenticateToken, (req, res) => {
    const { checklistId, checklistItemId } = req.params;
    const checklist = checklists.find(c => c.id == checklistId);
    if (!checklist || !checklist.items) return res.sendStatus(404);

    const item = checklist.items.find(i => i.id == checklistItemId);
    if (!item) return res.sendStatus(404);

    res.json(item);
});

// 4. Update status of checklist item by checklist item ID
app.put('/checklist/:checklistId/item/:checklistItemId', authenticateToken, (req, res) => {
    const { checklistId, checklistItemId } = req.params;
    const checklist = checklists.find(c => c.id == checklistId);
    if (!checklist || !checklist.items) return res.sendStatus(404);

    const item = checklist.items.find(i => i.id == checklistItemId);
    if (!item) return res.sendStatus(404);

    item.status = !item.status;

    res.json(item);
});

// 5. Delete item by checklist item ID
app.delete('/checklist/:checklistId/item/:checklistItemId', authenticateToken, (req, res) => {
    const { checklistId, checklistItemId } = req.params;
    const checklist = checklists.find(c => c.id == checklistId);
    if (!checklist || !checklist.items) return res.sendStatus(404);

    const index = checklist.items.findIndex(i => i.id == checklistItemId);
    if (index === -1) return res.sendStatus(404);

    checklist.items.splice(index, 1);
    res.sendStatus(204);
});

// 6. Rename item by checklist item ID
app.put('/checklist/:checklistId/item/rename/:checklistItemId', authenticateToken, (req, res) => {
    const { checklistId, checklistItemId } = req.params;
    const { itemName } = req.body;
    const checklist = checklists.find(c => c.id == checklistId);
    if (!checklist || !checklist.items) return res.sendStatus(404);

    const item = checklist.items.find(i => i.id == checklistItemId);
    if (!item) return res.sendStatus(404);

    item.name = itemName;

    res.json(item);
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});