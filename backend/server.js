const express = require('express');
const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises;
const app = express();
const port = 3000;
const companies = require('./data/companies.json');  // Load companies data once
const usersFilePath= path.join(__dirname, 'data', 'users.json');
const scoresFilePath = path.join(__dirname, 'data', 'scores.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'login.html'));
});

app.get('/api/companies', (req, res) => {
    res.json(companies);  // Return the loaded companies data
});

// Endpoint to get skills based on company name
app.get('/api/skills', (req, res) => {
    const companyName = req.query.company;
    console.log('Requested company:', companyName);

    if (!companyName) {
        return res.status(400).json({ error: 'Company name is required' });
    }

    const company = companies.find(c => c.name === companyName);

    if (!company || !company.skills) {
        return res.status(404).json({ error: 'Company not found or no skills available' });
    }

    res.json(company.skills);
});

// Endpoint to get questions based on the skill
app.get('/api/questions', (req, res) => {
    const skill = req.query.skill;
    if (skill) {
        const questionsData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'questions.json')));
        const questions = questionsData[skill] || [];
        res.json(questions);
    } else {
        res.status(400).send('Skill is required');
    }
});

// Endpoint to handle user sign-up

app.post('/api/signup', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        let data;
        try {
            data = await fs.promises.readFile(usersFilePath, 'utf8');
        } catch (err) {
            console.error('Error reading users file:', err);
            return res.status(500).json({ message: 'Unable to read users file' });
        }

        let users;
        try {
            users = JSON.parse(data);
        } catch (parseError) {
            console.error('Error parsing users file:', parseError);
            return res.status(500).json({ message: 'Error parsing users file' });
        }

        const userExists = users.find(user => user.email === email);

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        users.push({ username, email, password });

        try {
            await fs.promises.writeFile(usersFilePath, JSON.stringify(users, null, 2));
            res.status(201).json({ message: 'User created successfully' });
        } catch (writeErr) {
            console.error('Error writing users file:', writeErr);
            return res.status(500).json({ message: 'Unable to save user' });
        }
    } catch (error) {
        console.error('Unexpected error in signup route:', error);
        res.status(500).json({ message: 'An unexpected error occurred' });
    }
});


app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('Received login request:', { email, password });

        if (!email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const data = await fs.promises.readFile(usersFilePath, 'utf8');
        const users = JSON.parse(data);
        console.log('Users data:', users);

        const user = users.find(user => user.email === email && user.password === password);

        if (user) {
            console.log('Login successful for user:', email);
            res.status(200).json({ message: 'Login successful' });
        } else {
            console.log('Login failed for user:', email);
            res.status(400).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        console.error('Error in login route:', error);
        res.status(500).json({ message: 'An error occurred during login' });
    }
});
app.post('/api/reset-password', async (req, res) => {
    const { email, newPassword } = req.body;

    try {
        // Read the users.json file
        const data = await fsPromises.readFile(usersFilePath, 'utf8');
        let users = JSON.parse(data);

        const userIndex = users.findIndex(u => u.email === email);

        if (userIndex === -1) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Update the user's password (plain text)
        users[userIndex].password = newPassword;

        // Write the updated users back to the file
        await fsPromises.writeFile(usersFilePath, JSON.stringify(users, null, 2));

        res.json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        console.error('Error resetting password:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.get('/startQuiz', (req, res) => {
    const skill = req.query.skill;
    // Render the quiz page for the specific skill
    res.render('quizPage', { skill: skill });
});

let scores = {};
// fs.readFile('scores.json', (err, data) => {
//     if (err) {
//         console.error(err);
//     } else {
//         scores = JSON.parse(data);
//     }
// });/
fs.readFile(scoresFilePath, 'utf8', (err, data) => {
    if (err) {
        console.error("Error reading scores.json:", err);
    } else {
        try {
            scores = JSON.parse(data);
            console.log("Scores loaded:", scores); // Optional: Log the loaded scores
        } catch (parseError) {
            console.error("Error parsing scores.json:", parseError);
        }
    }
});

app.post('/api/save-score', (req, res) => {
    const { email, company, skill, score } = req.body;
    
    if (!email || !company || !skill || score === undefined) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    fs.readFile(scoresFilePath, (err, data) => {
        if (err && err.code !== 'ENOENT') {
            console.error('Error reading scores file:', err);
            return res.status(500).json({ message: 'Error saving score' });
        }

        let scores = [];
        if (data) {
            try {
                scores = JSON.parse(data);
            } catch (parseErr) {
                console.error('Error parsing scores file:', parseErr);
                return res.status(500).json({ message: 'Error parsing scores data' });
            }
        }

        // Find or create the score object
        let scoreObj = scores.find(s => s.email === email && s.company === company && s.skill === skill);
        if (scoreObj) {
            scoreObj.score = parseFloat(score);
        } else {
            scores.push({ email, company, skill, score: parseFloat(score) });
        }

        // Calculate overall score
        const companyScores = scores.filter(s => s.email === email && s.company === company);
        const totalScore = companyScores.reduce((sum, s) => sum + s.score, 0);
        const overallScore = companyScores.length > 0 ? totalScore / companyScores.length : 0;

        // Update or add overall score
        let overallScoreObj = scores.find(s => s.email === email && s.company === company && s.skill === 'overallScore');
        if (overallScoreObj) {
            overallScoreObj.score = overallScore;
        } else {
            scores.push({ email, company, skill: 'overallScore', score: overallScore });
        }

        fs.writeFile(scoresFilePath, JSON.stringify(scores, null, 2), (writeErr) => {
            if (writeErr) {
                console.error('Error writing scores file:', writeErr);
                return res.status(500).json({ message: 'Error saving score' });
            }
            res.json({ 
                message: 'Score saved successfully', 
                overallScore, 
                skillScores: companyScores.filter(s => s.skill !== 'overallScore')
            });
        });
    });
});

app.get('/api/overall-score', (req, res) => {
    const { email, company } = req.query;
    
    if (!email || !company) {
        return res.status(400).json({ message: 'Missing required query parameters' });
    }
    
    fs.readFile(scoresFilePath, 'utf8', (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') {
                return res.json({ overallScore: 0, skillScores: [] });
            }
            console.error('Error reading scores file:', err);
            return res.status(500).json({ message: 'Error fetching overall score' });
        }

        try {
            const scores = JSON.parse(data);
            const companyScores = scores.filter(s => s.email === email && s.company === company);
            
            const overallScoreObj = companyScores.find(s => s.skill === 'overallScore');
            const overallScore = overallScoreObj ? overallScoreObj.score : 0;
            
            const skillScores = companyScores
                .filter(s => s.skill !== 'overallScore')
                .map(({ skill, score }) => ({ skill, score }));

            res.json({ overallScore, skillScores });
        } catch (parseErr) {
            console.error('Error parsing scores file:', parseErr);
            res.status(500).json({ message: 'Error parsing scores data' });
        }
    });
});


app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

