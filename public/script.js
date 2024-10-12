<<<<<<< HEAD
let score = 0;
let currentQuestions = [];
let currentQuestionIndex = 0;
let companyScores = {};
let currentCompany = '';
let currentSkill = '';
let currentUser = '';

// User authentication functions
function setCurrentUser(username) {
    currentUser = username;
    localStorage.setItem('currentUser', username);
}

function signup() {
    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    const confirmPassword = document.getElementById('confirmPassword').value.trim();

    if (!username || !email || !password || !confirmPassword) {
        alert('All fields are required');
        return;
    }

    if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }

    fetch('/api/signup', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, email, password })
    })
    .then(response => response.json())
    .then(data => {
        console.log('Response from server:', data);
        if (data.message === 'User created successfully') {
            alert('Sign up successful! You can now log in.');
            window.location.href = 'login.html';
        } else {
            alert(data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Sign up failed. Please try again.');
    });
}

function login() {
    const email = document.querySelector('input[type="email"]').value.trim();
    const password = document.querySelector('input[type="password"]').value.trim();

    fetch('/api/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.message === 'Login successful') {
            setCurrentUser(email);
            window.location.href = 'search.html';
        } else {
            alert(data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred during login. Please try again.');
    });
}

function checkLoggedInUser() {
    currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
        window.location.href = 'login.html';
    }
}

function displaySkills(skills) {
    const skillsSection = document.getElementById('skills-section');
    const questionsSection = document.getElementById('questions-section');
    const searchSection = document.getElementById('search');

    searchSection.style.display = 'none';
    questionsSection.style.display = 'none';
    skillsSection.innerHTML = '';

    const overallScoreContainer = document.createElement('div');
    overallScoreContainer.id = 'overall-score-container';
    overallScoreContainer.className = 'overall-score-container';
    overallScoreContainer.innerHTML = '<p>Loading overall score...</p>';
    skillsSection.appendChild(overallScoreContainer);

    const skillsContainer = document.createElement('div');
    skillsContainer.id = 'skillsContainer';
    skillsSection.appendChild(skillsContainer);

    if (skills.length > 0) {
        skills.forEach(skill => {
            const button = document.createElement('button');
            button.textContent = skill;
            button.className = 'skills-button';
            button.onclick = () => startQuiz(skill);
            skillsSection.appendChild(button);
        });
        skillsSection.style.display = 'block';
    } else {
        skillsSection.innerHTML = '<p>No skills found for this company.</p>';
    }
}

// Quiz functions
function startQuiz(skill) {
    currentSkill = skill;
    document.body.classList.add('quiz-mode');
    document.querySelector('main').classList.add('quiz-mode');
    
    document.getElementById('search').style.display = 'none';
    document.getElementById('skills-section').style.display = 'none';
    document.getElementById('questions-section').style.display = 'block';
    document.body.style.backgroundColor = "black";
    document.body.style.color = "white";
    
    fetch(`/api/questions?skill=${encodeURIComponent(skill)}`)
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(questions => {
            currentQuestions = questions;
            if (currentQuestions.length > 0) {
                score = 0;
                currentQuestionIndex = 0;
                displayCurrentQuestion();
                startTimer(25 * 60);
            } else {
                throw new Error('No questions found for this skill');
            }
        })
        .catch(error => {
            console.error('Error fetching questions:', error);
            document.getElementById('questionsContainer').innerHTML = '<p>Error loading questions. Please try again.</p>';
        });
}
async function fetchQuestions(skill) {
    try {
        const response = await fetch(`/api/questions?skill=${encodeURIComponent(skill)}`);
        if (!response.ok) {
            throw new Error('Failed to fetch questions');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching questions:', error);
        return null;
    }
}

function displayCurrentQuestion() {
    const questionsContainer = document.getElementById('questionsContainer');
    questionsContainer.innerHTML = '';
    
    if (currentQuestionIndex < currentQuestions.length) {
        const question = currentQuestions[currentQuestionIndex];
        const questionElement = document.createElement('div');
        questionElement.className = 'question';
        
        const questionText = document.createElement('p');
        questionText.textContent = `Q${currentQuestionIndex + 1}: ${question.question}`;
        questionElement.appendChild(questionText);
        
        question.options.forEach((option, index) => {
            const label = document.createElement('label');
            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = 'current-question';
            radio.value = option;
            radio.id = `option-${index}`;
            radio.dataset.correct = option === question.answer ? 'true' : 'false';
            
            label.appendChild(radio);
            label.appendChild(document.createTextNode(` ${option}`));
            
            questionElement.appendChild(label);
            questionElement.appendChild(document.createElement('br'));
        });
        
        questionsContainer.appendChild(questionElement);
        
        const nextButton = document.getElementById('nextButton');
        nextButton.style.display = 'block';
        
        const submitButton = document.getElementById('submitButton');
        submitButton.style.display = currentQuestionIndex === currentQuestions.length - 1 ? 'block' : 'none';
    } else {
        showScore();
    }
}

function nextQuestion() {
    const selectedOption = document.querySelector('input[name="current-question"]:checked');
    if (selectedOption) {
        if (selectedOption.dataset.correct === 'true') {
            score++;
        }
        currentQuestionIndex++;
        if (currentQuestionIndex < currentQuestions.length) {
            displayCurrentQuestion();
        } else {
            showScore();
        }
    } else {
        alert('Please select an option before proceeding.');
    }
}

function submitQuiz() {
    const selectedOption = document.querySelector('input[name="current-question"]:checked');
    if (selectedOption && selectedOption.dataset.correct === 'true') {
        score++;
    }
    showScore();
}

function returnToSkillsPage() {
    currentQuestions = [];
    currentQuestionIndex = 0;
    score = 0;
    
    // Hide the questions section
    document.getElementById('questions-section').style.display = 'none';
    
    // Hide the search bar and Find Skills button
    document.getElementById('search').style.display = 'none';
    
    // Show the skills section
    document.getElementById('skills-section').style.display = 'block';
    
    // Remove quiz mode styling
    document.body.classList.remove('quiz-mode');
    document.querySelector('main').classList.remove('quiz-mode');
    document.body.style.backgroundColor = "";
    document.body.style.color = "";
    
    // Instead of calling findSkills(), we'll fetch and display user scores
    findSkills();
}

// Timer function
function startTimer(duration) {
    const timerElement = document.createElement('div');
    timerElement.id = 'timer';
    timerElement.style.position = 'absolute';
    timerElement.style.bottom = '10px';
    timerElement.style.top = '100px';
    timerElement.style.left = '10px';
    document.body.appendChild(timerElement);

    let timer = duration, minutes, seconds;
    const interval = setInterval(function () {
        minutes = parseInt(timer / 60, 10);
        seconds = parseInt(timer % 60, 10);

        minutes = minutes < 10 ? '0' + minutes : minutes;
        seconds = seconds < 10 ? '0' + seconds : seconds;

        timerElement.textContent = `Time Left: ${minutes}:${seconds}`;

        if (--timer < 0) {
            clearInterval(interval);
            alert('Time is up! Submitting the quiz...');
            submitQuiz();
        }
    }, 1000);
}

function showTimer() {
    timerElement.style.display = 'block';
    document.body.appendChild(timerElement);
}

function hideTimer() {
    timerElement.style.display = 'none';
    if (timerElement.parentNode) {
        timerElement.parentNode.removeChild(timerElement);
    }
}

function resetPassword() {
    const email = document.getElementById('reset-email').value;
    
    if (email) {
        // Prompt the user for a new password
        const newPassword = prompt("Enter your new password:");
        
        if (newPassword) {
            // Send a request to the server to update the password
            fetch('/api/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, newPassword }),
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert(`Password has been reset for ${email}.`);
                    // Redirect back to the login page after a short delay
                    setTimeout(() => {
                        window.location.href = 'login.html';
                    }, 3000);
                } else {
                    alert(data.message || 'Password reset failed. Please try again.');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('An error occurred. Please try again.');
            });
        } else {
            alert('Password reset cancelled.');
        }
    } else {
        alert('Please enter a valid email address.');
    }
}
async function saveSkillScore(email, company, skill, score) {
    if (!email || !company || !skill || score === undefined) {
        console.error('Missing required fields:', { email, company, skill, score });
        throw new Error('Missing required fields');
    }

    try {
        const response = await fetch('/api/save-score', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, company, skill, score }),
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Error data:', errorData);
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Score saved successfully:', result);
        
        // Fetch and update overall score immediately after saving
        const overallScoreResponse = await fetch(`/api/overall-score?email=${encodeURIComponent(email)}&company=${encodeURIComponent(company)}`);
        const overallScoreData = await overallScoreResponse.json();
        updateOverallScoreDisplay(overallScoreData.overallScore, overallScoreData.skillScores);
        
        return result;
    } catch (error) {
        console.error('Error saving score:', error);
        console.error('Error stack:', error.stack);
        throw error;
    }
}

function calculateScore(userAnswers, correctAnswers) {
    let score = 0;
    for (let i = 0; i < userAnswers.length; i++) {
        if (userAnswers[i] === correctAnswers[i]) {
            score++;
        }
    }
    return (score / correctAnswers.length) * 100; // Return percentage
}

function showScore() {
    console.log('Showing score');
    const questionsContainer = document.getElementById('questionsContainer');
    const nextButton = document.getElementById('nextButton');
    const submitButton = document.getElementById('submitButton');
    const timerElement = document.getElementById('timer');

    const percentage = (score / currentQuestions.length) * 100;
    console.log('Calculated percentage:', percentage);

    nextButton.style.display = 'none';
    submitButton.style.display = 'none';
    if (timerElement) timerElement.style.display = 'none';

    questionsContainer.innerHTML = `
        <div class="score-container" style="width:50vh; height:50vh;">
            <h2>Quiz Completed!</h2>
            <p>Your score for ${currentSkill}: ${score} out of ${currentQuestions.length}</p>
            <div class="circle-container">
                <div class="circle">
                    <div class="progress" style="background: conic-gradient(#8dd5c3 ${percentage}%, rgb(74, 73, 73) 0%);">
                        <div class="circle-text">${Math.round(percentage)}%</div>
                    </div>
                </div>
            </div>
            <button id="backButton" style="margin-top: 20px; padding: 10px 20px; background-color: #12324b; color: white; border: none; border-radius: 5px; width:10px; cursor: pointer;"><-</button>
        </div>
    `;

    const backButton = document.getElementById('backButton');
    if (backButton) {
        backButton.addEventListener('click', returnToSkillsPage);
    }

    // Save the skill score and update overall score
    saveSkillScore(currentUser, currentCompany, currentSkill, percentage);
}

function displayErrorMessage(message) {
    const errorElement = document.getElementById('error-message');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    } else {
        alert(message);
    }
}

function displaySuccessMessage(message) {
    const successElement = document.getElementById('success-message');
    if (successElement) {
        successElement.textContent = message;
        successElement.style.display = 'block';
    } else {
        alert(message);
    }
}

function updateOverallScoreDisplay(overallScore, skillScores) {
    const container = document.getElementById('overall-score-container');
    if (container) {
        if (typeof overallScore !== 'number' || isNaN(overallScore)) {
            console.error('Invalid overall score:', overallScore);
            overallScore = 0; // Default to 0 if invalid
        }
        
        const eligibilityMessage = getEligibilityMessage(overallScore);
        const skillScoresList = Array.isArray(skillScores) ? skillScores.map(({ skill, score }) => {
            const displayScore = typeof score === 'number' && !isNaN(score) 
                ? `${Math.round(score)}%` 
                : 'Not attempted';
            return `<li>${skill}: ${displayScore}</li>`;
        }).join('') : '<li>No skill scores available</li>';

        container.innerHTML = `
            <h3>Overall Company Score</h3>
            <div class="circle-container">
                <div class="circle">
                    <div class="progress" style="background: conic-gradient(#8dd5c3 ${overallScore}%, rgb(74, 73, 73) 0%);">
                        <div class="circle-text">${Math.round(overallScore)}%</div>
                    </div>
                </div>
            </div>
            <p class="eligibility-message">${eligibilityMessage}</p>
            <h4>Individual Skill Scores:</h4>
            <ul>
                ${skillScoresList}
            </ul>
        `;
    } else {
        console.error('Overall score container not found');
    }
}
function displayCompanyInfo(company, skills) {

    const skillsSection = document.getElementById('skills-section');
    skillsSection.innerHTML = ''; // Clear previous content

    // Create and append skill buttons
    const skillButtonsContainer = document.createElement('div');
    skillButtonsContainer.className = 'skill-buttons';
    for (const [skill, score] of Object.entries(skills)) {
        if (skill !== 'overallScore') {
            const skillButton = document.createElement('button');
            skillButton.textContent = skill;
            skillButton.className = 'skill-button';
            skillButton.onclick = () => startQuiz(skill);
            skillButtonsContainer.appendChild(skillButton);
        }
    }
    skillsSection.appendChild(skillButtonsContainer);

    // Calculate and display overall score
    const overallScore = skills.overallScore || calculateOverallScore(skills);
    const overallScoreContainer = document.createElement('div');
    overallScoreContainer.className = 'overall-score-container';
    overallScoreContainer.innerHTML = `
        <h3>Overall Analytics</h3>
        <div class="circle-container">
            <div class="circle">
                <div class="progress" style="background: conic-gradient(#8dd5c3 ${overallScore}%, rgb(74, 73, 73) 0%);">
                    <div class="circle-text">${Math.round(overallScore)}%</div>
                </div>
            </div>
        </div>
        <p class="eligibility-message">${getEligibilityMessage(overallScore)}</p>
    `;
    skillsSection.appendChild(overallScoreContainer);

    skillsSection.style.display = 'block';
}

function calculateOverallScore(skills) {
    const scores = Object.values(skills)
        .filter(score => typeof score === 'number' && !isNaN(score));
    return scores.length > 0 ? scores.reduce((a, b) => a + b) / scores.length : 0;
}
function getEligibilityMessage(score) {
    if (score >= 80) {
        return "Congratulations! You are highly eligible for this company!";
    } else if (score >= 60) {
        return "You show good potential for this company. Keep improving!";
    } else {
        return "You might need more practice to be eligible for this company.";
    }
}



function displayUserScores(scores) {
   
    const userScoresSection = document.getElementById('user-scores');
    userScoresSection.innerHTML = '<h2>Your Scores</h2>';

    toggleSearchAndScores(false);

    for (const [company, skills] of Object.entries(scores)) {
        const companyDiv = document.createElement('div');
        companyDiv.className = 'company-score';
        
        const overallScore = skills.overallScore || calculateOverallScore(skills);
        
        companyDiv.innerHTML = `
            <h3>${company}</h3>
            <div class="company-content">
                <div class="overall-score">
                    <div class="circle-container">
                        <div class="circle">
                            <div class="progress" style="background: conic-gradient(#8dd5c3 ${overallScore}%, rgb(74, 73, 73) 0%);">
                                <div class="circle-text">${Math.round(overallScore)}%</div>
                            </div>
                        </div>
                    </div>
                    <p class="eligibility-message">${getEligibilityMessage(overallScore)}</p>
                </div>
                <div class="skills-container">
                    <h4>Skills:</h4>
                    <div class="skill-buttons"></div>
                    <div class="skill-scores" style="display: none;"></div>
                </div>
            </div>
        `;

        const skillButtonsContainer = companyDiv.querySelector('.skill-buttons');
        const skillScoresContainer = companyDiv.querySelector('.skill-scores');

        const individualSkillScores = Object.entries(skills).filter(([skill, score]) => skill !== 'overallScore');

        updateOverallScoreDisplay(overallScore, individualSkillScores);

        for (const [skill, score] of Object.entries(skills)) {
            if (skill !== 'overallScore') {
                // Create skill button
                const skillButton = document.createElement('button');
                skillButton.textContent = skill;
                skillButton.className = 'skill-button';
                skillButton.onclick = () => startQuiz(skill);
                skillButtonsContainer.appendChild(skillButton);

                // Create skill score display
                const skillScoreElement = document.createElement('p');
                const displayScore = typeof score === 'number' && !isNaN(score) 
                    ? `${Math.round(score)}%` 
                    : 'Not attempted';
                skillScoreElement.textContent = `${skill}: ${displayScore}`;
                skillScoresContainer.appendChild(skillScoreElement);
            }
        }

        // Add toggle button for skill scores
        const toggleButton = document.createElement('button');
        toggleButton.textContent = 'Show Skill Scores';
        toggleButton.onclick = () => {
            const scoresDisplay = skillScoresContainer.style.display;
            skillScoresContainer.style.display = scoresDisplay === 'none' ? 'block' : 'none';
            toggleButton.textContent = scoresDisplay === 'none' ? 'Hide Skill Scores' : 'Show Skill Scores';
        };
        companyDiv.querySelector('.skills-container').appendChild(toggleButton);

        userScoresSection.appendChild(companyDiv);
    }

    userScoresSection.style.display = 'block';
}
function toggleSearchAndScores(showSearch) {
    const searchSection = document.getElementById('search');
    const userScoresSection = document.getElementById('user-scores');
    const backToSearchButton = document.getElementById('backToSearchButton') || createBackToSearchButton();
    if (window.location.pathname.includes('/public/login.html') || window.location.pathname.includes('/public/signup.html')) {
        backToSearchButton.style.display = 'none';
    } else {
    if (showSearch) {
        searchSection.style.display = 'block';
        userScoresSection.style.display = 'none';
        backToSearchButton.style.display = 'none';
    } else {
        searchSection.style.display = 'none';
        userScoresSection.style.display = 'block';
        backToSearchButton.style.display = 'block';
    }
}
}




function findSkills() {
    checkLoggedInUser();
    const company = document.getElementById('company').value.trim();
    currentCompany = company;

    if (company) {
        fetch(`/api/skills?company=${encodeURIComponent(company)}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(skills => {
                displaySkills(skills);
                createOverallScoreContainer(); // Ensure container exists
                return fetch(`/api/overall-score?email=${encodeURIComponent(currentUser)}&company=${encodeURIComponent(company)}`);
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('Overall score data:', data); // Debug log
                if (data.overallScore !== undefined) {
                    updateOverallScoreDisplay(data.overallScore, data.skillScores);
                } else {
                    console.error('Overall score is undefined');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Failed to fetch skills or overall score. Please try again.');
            });
    } else {
        alert('Please enter a company name');
    }
}
// Function to create overall score container
function createOverallScoreContainer() {
  
    const skillsSection = document.getElementById('skills-section');
    let overallScoreContainer = document.getElementById('overall-score-container');
    
    if (!overallScoreContainer) {
        overallScoreContainer = document.createElement('div');
        overallScoreContainer.id = 'overall-score-container';
        overallScoreContainer.className = 'overall-score-container';
        overallScoreContainer.innerHTML = '<p>Loading overall score...</p>';
        skillsSection.insertBefore(overallScoreContainer, skillsSection.firstChild);
    }
}
function createBackToSearchButton() {
    const backToSearchButton = document.createElement('button');
    backToSearchButton.textContent = 'Back to Search';
    backToSearchButton.id = 'backToSearchButton';
    backToSearchButton.onclick = () => toggleSearchAndScores(true);
    document.body.appendChild(backToSearchButton);
    return backToSearchButton;
}
// Function to populate company dropdown
function populateCompanyDropdown() {
    fetch('/api/companies')
        .then(response => {
            if (!response.ok) {
                console.error('Error fetching companies:', response.status);
                throw new Error(`Error fetching companies: ${response.status}`);
            }
            return response.json();
        })
        .then(companies => {
            console.log('Companies received:', companies);
            const dropdown = document.getElementById('companyDropdown');
            dropdown.innerHTML = '<option value="">Select a company</option>';

            try {
                companies.forEach(company => {
                    console.log('Adding company:', company);
                    const option = document.createElement('option');
                    option.textContent = company.name;
                    option.value = company.name;
                    dropdown.appendChild(option);
                });
            } catch (error) {
                console.error('Error adding companies to dropdown:', error);
            }
        })
        .catch(error => console.error('Error fetching companies:', error));
}

document.addEventListener('DOMContentLoaded', () => {
    checkLoggedInUser();
    createOverallScoreContainer(); // Create container on page load
    toggleSearchAndScores(true);

    const companyDropdown = document.getElementById('companyDropdown');
    const searchBar = document.getElementById('company');
    if (companyDropdown && searchBar) {
        companyDropdown.addEventListener('change', function() {
            searchBar.value = companyDropdown.value;
        });
        populateCompanyDropdown();
    }

    const findSkillsButton = document.getElementById('findSkillsButton');
    if (findSkillsButton) {
        findSkillsButton.addEventListener('click', findSkills);
    }
});

// Logout function
function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'login.html';
}
=======
let score = 0;
let currentQuestions = [];
let currentQuestionIndex = 0;
let companyScores = {};
let currentCompany = '';
let currentSkill = '';
let currentUser = '';

// User authentication functions
function setCurrentUser(username) {
    currentUser = username;
    localStorage.setItem('currentUser', username);
}

function signup() {
    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    const confirmPassword = document.getElementById('confirmPassword').value.trim();

    if (!username || !email || !password || !confirmPassword) {
        alert('All fields are required');
        return;
    }

    if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }

    fetch('/api/signup', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, email, password })
    })
    .then(response => response.json())
    .then(data => {
        console.log('Response from server:', data);
        if (data.message === 'User created successfully') {
            alert('Sign up successful! You can now log in.');
            window.location.href = 'login.html';
        } else {
            alert(data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Sign up failed. Please try again.');
    });
}

function login() {
    const email = document.querySelector('input[type="email"]').value.trim();
    const password = document.querySelector('input[type="password"]').value.trim();

    fetch('/api/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.message === 'Login successful') {
            setCurrentUser(email);
            window.location.href = 'search.html';
        } else {
            alert(data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred during login. Please try again.');
    });
}

function checkLoggedInUser() {
    currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
        window.location.href = 'login.html';
    }
}

function displaySkills(skills) {
    const skillsSection = document.getElementById('skills-section');
    const questionsSection = document.getElementById('questions-section');
    const searchSection = document.getElementById('search');

    searchSection.style.display = 'none';
    questionsSection.style.display = 'none';
    skillsSection.innerHTML = '';

    const overallScoreContainer = document.createElement('div');
    overallScoreContainer.id = 'overall-score-container';
    overallScoreContainer.className = 'overall-score-container';
    overallScoreContainer.innerHTML = '<p>Loading overall score...</p>';
    skillsSection.appendChild(overallScoreContainer);

    const skillsContainer = document.createElement('div');
    skillsContainer.id = 'skillsContainer';
    skillsSection.appendChild(skillsContainer);

    if (skills.length > 0) {
        skills.forEach(skill => {
            const button = document.createElement('button');
            button.textContent = skill;
            button.className = 'skills-button';
            button.onclick = () => startQuiz(skill);
            skillsSection.appendChild(button);
        });
        skillsSection.style.display = 'block';
    } else {
        skillsSection.innerHTML = '<p>No skills found for this company.</p>';
    }
}

// Quiz functions
function startQuiz(skill) {
    currentSkill = skill;
    document.body.classList.add('quiz-mode');
    document.querySelector('main').classList.add('quiz-mode');
    
    document.getElementById('search').style.display = 'none';
    document.getElementById('skills-section').style.display = 'none';
    document.getElementById('questions-section').style.display = 'block';
    document.body.style.backgroundColor = "black";
    document.body.style.color = "white";
    
    fetch(`/api/questions?skill=${encodeURIComponent(skill)}`)
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(questions => {
            currentQuestions = questions;
            if (currentQuestions.length > 0) {
                score = 0;
                currentQuestionIndex = 0;
                displayCurrentQuestion();
                startTimer(25 * 60);
            } else {
                throw new Error('No questions found for this skill');
            }
        })
        .catch(error => {
            console.error('Error fetching questions:', error);
            document.getElementById('questionsContainer').innerHTML = '<p>Error loading questions. Please try again.</p>';
        });
}
async function fetchQuestions(skill) {
    try {
        const response = await fetch(`/api/questions?skill=${encodeURIComponent(skill)}`);
        if (!response.ok) {
            throw new Error('Failed to fetch questions');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching questions:', error);
        return null;
    }
}

function displayCurrentQuestion() {
    const questionsContainer = document.getElementById('questionsContainer');
    questionsContainer.innerHTML = '';
    
    if (currentQuestionIndex < currentQuestions.length) {
        const question = currentQuestions[currentQuestionIndex];
        const questionElement = document.createElement('div');
        questionElement.className = 'question';
        
        const questionText = document.createElement('p');
        questionText.textContent = `Q${currentQuestionIndex + 1}: ${question.question}`;
        questionElement.appendChild(questionText);
        
        question.options.forEach((option, index) => {
            const label = document.createElement('label');
            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = 'current-question';
            radio.value = option;
            radio.id = `option-${index}`;
            radio.dataset.correct = option === question.answer ? 'true' : 'false';
            
            label.appendChild(radio);
            label.appendChild(document.createTextNode(` ${option}`));
            
            questionElement.appendChild(label);
            questionElement.appendChild(document.createElement('br'));
        });
        
        questionsContainer.appendChild(questionElement);
        
        const nextButton = document.getElementById('nextButton');
        nextButton.style.display = 'block';
        
        const submitButton = document.getElementById('submitButton');
        submitButton.style.display = currentQuestionIndex === currentQuestions.length - 1 ? 'block' : 'none';
    } else {
        showScore();
    }
}

function nextQuestion() {
    const selectedOption = document.querySelector('input[name="current-question"]:checked');
    if (selectedOption) {
        if (selectedOption.dataset.correct === 'true') {
            score++;
        }
        currentQuestionIndex++;
        if (currentQuestionIndex < currentQuestions.length) {
            displayCurrentQuestion();
        } else {
            showScore();
        }
    } else {
        alert('Please select an option before proceeding.');
    }
}

function submitQuiz() {
    const selectedOption = document.querySelector('input[name="current-question"]:checked');
    if (selectedOption && selectedOption.dataset.correct === 'true') {
        score++;
    }
    showScore();
}

function returnToSkillsPage() {
    currentQuestions = [];
    currentQuestionIndex = 0;
    score = 0;
    
    // Hide the questions section
    document.getElementById('questions-section').style.display = 'none';
    
    // Hide the search bar and Find Skills button
    document.getElementById('search').style.display = 'none';
    
    // Show the skills section
    document.getElementById('skills-section').style.display = 'block';
    
    // Remove quiz mode styling
    document.body.classList.remove('quiz-mode');
    document.querySelector('main').classList.remove('quiz-mode');
    document.body.style.backgroundColor = "";
    document.body.style.color = "";
    
    // Instead of calling findSkills(), we'll fetch and display user scores
    findSkills();
}

// Timer function
function startTimer(duration) {
    const timerElement = document.createElement('div');
    timerElement.id = 'timer';
    timerElement.style.position = 'absolute';
    timerElement.style.bottom = '10px';
    timerElement.style.top = '100px';
    timerElement.style.left = '10px';
    document.body.appendChild(timerElement);

    let timer = duration, minutes, seconds;
    const interval = setInterval(function () {
        minutes = parseInt(timer / 60, 10);
        seconds = parseInt(timer % 60, 10);

        minutes = minutes < 10 ? '0' + minutes : minutes;
        seconds = seconds < 10 ? '0' + seconds : seconds;

        timerElement.textContent = `Time Left: ${minutes}:${seconds}`;

        if (--timer < 0) {
            clearInterval(interval);
            alert('Time is up! Submitting the quiz...');
            submitQuiz();
        }
    }, 1000);
}

function showTimer() {
    timerElement.style.display = 'block';
    document.body.appendChild(timerElement);
}

function hideTimer() {
    timerElement.style.display = 'none';
    if (timerElement.parentNode) {
        timerElement.parentNode.removeChild(timerElement);
    }
}

function resetPassword() {
    const email = document.getElementById('reset-email').value;
    
    if (email) {
        // Prompt the user for a new password
        const newPassword = prompt("Enter your new password:");
        
        if (newPassword) {
            // Send a request to the server to update the password
            fetch('/api/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, newPassword }),
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert(`Password has been reset for ${email}.`);
                    // Redirect back to the login page after a short delay
                    setTimeout(() => {
                        window.location.href = 'login.html';
                    }, 3000);
                } else {
                    alert(data.message || 'Password reset failed. Please try again.');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('An error occurred. Please try again.');
            });
        } else {
            alert('Password reset cancelled.');
        }
    } else {
        alert('Please enter a valid email address.');
    }
}
async function saveSkillScore(email, company, skill, score) {
    if (!email || !company || !skill || score === undefined) {
        console.error('Missing required fields:', { email, company, skill, score });
        throw new Error('Missing required fields');
    }

    try {
        const response = await fetch('/api/save-score', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, company, skill, score }),
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Error data:', errorData);
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Score saved successfully:', result);
        
        // Fetch and update overall score immediately after saving
        const overallScoreResponse = await fetch(`/api/overall-score?email=${encodeURIComponent(email)}&company=${encodeURIComponent(company)}`);
        const overallScoreData = await overallScoreResponse.json();
        updateOverallScoreDisplay(overallScoreData.overallScore, overallScoreData.skillScores);
        
        return result;
    } catch (error) {
        console.error('Error saving score:', error);
        console.error('Error stack:', error.stack);
        throw error;
    }
}

function calculateScore(userAnswers, correctAnswers) {
    let score = 0;
    for (let i = 0; i < userAnswers.length; i++) {
        if (userAnswers[i] === correctAnswers[i]) {
            score++;
        }
    }
    return (score / correctAnswers.length) * 100; // Return percentage
}

function showScore() {
    console.log('Showing score');
    const questionsContainer = document.getElementById('questionsContainer');
    const nextButton = document.getElementById('nextButton');
    const submitButton = document.getElementById('submitButton');
    const timerElement = document.getElementById('timer');

    const percentage = (score / currentQuestions.length) * 100;
    console.log('Calculated percentage:', percentage);

    nextButton.style.display = 'none';
    submitButton.style.display = 'none';
    if (timerElement) timerElement.style.display = 'none';

    questionsContainer.innerHTML = `
        <div class="score-container" style="width:50vh; height:50vh;">
            <h2>Quiz Completed!</h2>
            <p>Your score for ${currentSkill}: ${score} out of ${currentQuestions.length}</p>
            <div class="circle-container">
                <div class="circle">
                    <div class="progress" style="background: conic-gradient(#8dd5c3 ${percentage}%, rgb(74, 73, 73) 0%);">
                        <div class="circle-text">${Math.round(percentage)}%</div>
                    </div>
                </div>
            </div>
            <button id="backButton" style="margin-top: 20px; padding: 10px 20px; background-color: #12324b; color: white; border: none; border-radius: 5px; width:10px; cursor: pointer;"><-</button>
        </div>
    `;

    const backButton = document.getElementById('backButton');
    if (backButton) {
        backButton.addEventListener('click', returnToSkillsPage);
    }

    // Save the skill score and update overall score
    saveSkillScore(currentUser, currentCompany, currentSkill, percentage);
}

function displayErrorMessage(message) {
    const errorElement = document.getElementById('error-message');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    } else {
        alert(message);
    }
}

function displaySuccessMessage(message) {
    const successElement = document.getElementById('success-message');
    if (successElement) {
        successElement.textContent = message;
        successElement.style.display = 'block';
    } else {
        alert(message);
    }
}

function updateOverallScoreDisplay(overallScore, skillScores) {
    const container = document.getElementById('overall-score-container');
    if (container) {
        if (typeof overallScore !== 'number' || isNaN(overallScore)) {
            console.error('Invalid overall score:', overallScore);
            overallScore = 0; // Default to 0 if invalid
        }
        
        const eligibilityMessage = getEligibilityMessage(overallScore);
        const skillScoresList = Array.isArray(skillScores) ? skillScores.map(({ skill, score }) => {
            const displayScore = typeof score === 'number' && !isNaN(score) 
                ? `${Math.round(score)}%` 
                : 'Not attempted';
            return `<li>${skill}: ${displayScore}</li>`;
        }).join('') : '<li>No skill scores available</li>';

        container.innerHTML = `
            <h3>Overall Company Score</h3>
            <div class="circle-container">
                <div class="circle">
                    <div class="progress" style="background: conic-gradient(#8dd5c3 ${overallScore}%, rgb(74, 73, 73) 0%);">
                        <div class="circle-text">${Math.round(overallScore)}%</div>
                    </div>
                </div>
            </div>
            <p class="eligibility-message">${eligibilityMessage}</p>
            <h4>Individual Skill Scores:</h4>
            <ul>
                ${skillScoresList}
            </ul>
        `;
    } else {
        console.error('Overall score container not found');
    }
}
function displayCompanyInfo(company, skills) {

    const skillsSection = document.getElementById('skills-section');
    skillsSection.innerHTML = ''; // Clear previous content

    // Create and append skill buttons
    const skillButtonsContainer = document.createElement('div');
    skillButtonsContainer.className = 'skill-buttons';
    for (const [skill, score] of Object.entries(skills)) {
        if (skill !== 'overallScore') {
            const skillButton = document.createElement('button');
            skillButton.textContent = skill;
            skillButton.className = 'skill-button';
            skillButton.onclick = () => startQuiz(skill);
            skillButtonsContainer.appendChild(skillButton);
        }
    }
    skillsSection.appendChild(skillButtonsContainer);

    // Calculate and display overall score
    const overallScore = skills.overallScore || calculateOverallScore(skills);
    const overallScoreContainer = document.createElement('div');
    overallScoreContainer.className = 'overall-score-container';
    overallScoreContainer.innerHTML = `
        <h3>Overall Analytics</h3>
        <div class="circle-container">
            <div class="circle">
                <div class="progress" style="background: conic-gradient(#8dd5c3 ${overallScore}%, rgb(74, 73, 73) 0%);">
                    <div class="circle-text">${Math.round(overallScore)}%</div>
                </div>
            </div>
        </div>
        <p class="eligibility-message">${getEligibilityMessage(overallScore)}</p>
    `;
    skillsSection.appendChild(overallScoreContainer);

    skillsSection.style.display = 'block';
}

function calculateOverallScore(skills) {
    const scores = Object.values(skills)
        .filter(score => typeof score === 'number' && !isNaN(score));
    return scores.length > 0 ? scores.reduce((a, b) => a + b) / scores.length : 0;
}
function getEligibilityMessage(score) {
    if (score >= 80) {
        return "Congratulations! You are highly eligible for this company!";
    } else if (score >= 60) {
        return "You show good potential for this company. Keep improving!";
    } else {
        return "You might need more practice to be eligible for this company.";
    }
}



function displayUserScores(scores) {
   
    const userScoresSection = document.getElementById('user-scores');
    userScoresSection.innerHTML = '<h2>Your Scores</h2>';

    toggleSearchAndScores(false);

    for (const [company, skills] of Object.entries(scores)) {
        const companyDiv = document.createElement('div');
        companyDiv.className = 'company-score';
        
        const overallScore = skills.overallScore || calculateOverallScore(skills);
        
        companyDiv.innerHTML = `
            <h3>${company}</h3>
            <div class="company-content">
                <div class="overall-score">
                    <div class="circle-container">
                        <div class="circle">
                            <div class="progress" style="background: conic-gradient(#8dd5c3 ${overallScore}%, rgb(74, 73, 73) 0%);">
                                <div class="circle-text">${Math.round(overallScore)}%</div>
                            </div>
                        </div>
                    </div>
                    <p class="eligibility-message">${getEligibilityMessage(overallScore)}</p>
                </div>
                <div class="skills-container">
                    <h4>Skills:</h4>
                    <div class="skill-buttons"></div>
                    <div class="skill-scores" style="display: none;"></div>
                </div>
            </div>
        `;

        const skillButtonsContainer = companyDiv.querySelector('.skill-buttons');
        const skillScoresContainer = companyDiv.querySelector('.skill-scores');

        const individualSkillScores = Object.entries(skills).filter(([skill, score]) => skill !== 'overallScore');

        updateOverallScoreDisplay(overallScore, individualSkillScores);

        for (const [skill, score] of Object.entries(skills)) {
            if (skill !== 'overallScore') {
                // Create skill button
                const skillButton = document.createElement('button');
                skillButton.textContent = skill;
                skillButton.className = 'skill-button';
                skillButton.onclick = () => startQuiz(skill);
                skillButtonsContainer.appendChild(skillButton);

                // Create skill score display
                const skillScoreElement = document.createElement('p');
                const displayScore = typeof score === 'number' && !isNaN(score) 
                    ? `${Math.round(score)}%` 
                    : 'Not attempted';
                skillScoreElement.textContent = `${skill}: ${displayScore}`;
                skillScoresContainer.appendChild(skillScoreElement);
            }
        }

        // Add toggle button for skill scores
        const toggleButton = document.createElement('button');
        toggleButton.textContent = 'Show Skill Scores';
        toggleButton.onclick = () => {
            const scoresDisplay = skillScoresContainer.style.display;
            skillScoresContainer.style.display = scoresDisplay === 'none' ? 'block' : 'none';
            toggleButton.textContent = scoresDisplay === 'none' ? 'Hide Skill Scores' : 'Show Skill Scores';
        };
        companyDiv.querySelector('.skills-container').appendChild(toggleButton);

        userScoresSection.appendChild(companyDiv);
    }

    userScoresSection.style.display = 'block';
}
function toggleSearchAndScores(showSearch) {
    const searchSection = document.getElementById('search');
    const userScoresSection = document.getElementById('user-scores');
    const backToSearchButton = document.getElementById('backToSearchButton') || createBackToSearchButton();
    if (window.location.pathname.includes('/public/login.html') || window.location.pathname.includes('/public/signup.html')) {
        backToSearchButton.style.display = 'none';
    } else {
    if (showSearch) {
        searchSection.style.display = 'block';
        userScoresSection.style.display = 'none';
        backToSearchButton.style.display = 'none';
    } else {
        searchSection.style.display = 'none';
        userScoresSection.style.display = 'block';
        backToSearchButton.style.display = 'block';
    }
}
}




function findSkills() {
    checkLoggedInUser();
    const company = document.getElementById('company').value.trim();
    currentCompany = company;

    if (company) {
        fetch(`/api/skills?company=${encodeURIComponent(company)}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(skills => {
                displaySkills(skills);
                createOverallScoreContainer(); // Ensure container exists
                return fetch(`/api/overall-score?email=${encodeURIComponent(currentUser)}&company=${encodeURIComponent(company)}`);
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('Overall score data:', data); // Debug log
                if (data.overallScore !== undefined) {
                    updateOverallScoreDisplay(data.overallScore, data.skillScores);
                } else {
                    console.error('Overall score is undefined');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Failed to fetch skills or overall score. Please try again.');
            });
    } else {
        alert('Please enter a company name');
    }
}
// Function to create overall score container
function createOverallScoreContainer() {
  
    const skillsSection = document.getElementById('skills-section');
    let overallScoreContainer = document.getElementById('overall-score-container');
    
    if (!overallScoreContainer) {
        overallScoreContainer = document.createElement('div');
        overallScoreContainer.id = 'overall-score-container';
        overallScoreContainer.className = 'overall-score-container';
        overallScoreContainer.innerHTML = '<p>Loading overall score...</p>';
        skillsSection.insertBefore(overallScoreContainer, skillsSection.firstChild);
    }
}
function createBackToSearchButton() {
    const backToSearchButton = document.createElement('button');
    backToSearchButton.textContent = 'Back to Search';
    backToSearchButton.id = 'backToSearchButton';
    backToSearchButton.onclick = () => toggleSearchAndScores(true);
    document.body.appendChild(backToSearchButton);
    return backToSearchButton;
}
// Function to populate company dropdown
function populateCompanyDropdown() {
    fetch('/api/companies')
        .then(response => {
            if (!response.ok) {
                console.error('Error fetching companies:', response.status);
                throw new Error(`Error fetching companies: ${response.status}`);
            }
            return response.json();
        })
        .then(companies => {
            console.log('Companies received:', companies);
            const dropdown = document.getElementById('companyDropdown');
            dropdown.innerHTML = '<option value="">Select a company</option>';

            try {
                companies.forEach(company => {
                    console.log('Adding company:', company);
                    const option = document.createElement('option');
                    option.textContent = company.name;
                    option.value = company.name;
                    dropdown.appendChild(option);
                });
            } catch (error) {
                console.error('Error adding companies to dropdown:', error);
            }
        })
        .catch(error => console.error('Error fetching companies:', error));
}

document.addEventListener('DOMContentLoaded', () => {
    checkLoggedInUser();
    createOverallScoreContainer(); // Create container on page load
    toggleSearchAndScores(true);

    const companyDropdown = document.getElementById('companyDropdown');
    const searchBar = document.getElementById('company');
    if (companyDropdown && searchBar) {
        companyDropdown.addEventListener('change', function() {
            searchBar.value = companyDropdown.value;
        });
        populateCompanyDropdown();
    }

    const findSkillsButton = document.getElementById('findSkillsButton');
    if (findSkillsButton) {
        findSkillsButton.addEventListener('click', findSkills);
    }
});

// Logout function
function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'login.html';
}
>>>>>>> aa735a8b135e0e925039040867749c60da5e8298
