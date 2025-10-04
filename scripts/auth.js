import { displayError, clearError, clearAllFormErrors, validateTextRule, calculateAge } from './validation.js';


// --- DOM Element Definitions ---
const authModal = document.getElementById('authModal');
const welcomePage = document.getElementById('welcome-page');

const signInPage = document.getElementById('signInPage');
const signUpPage = document.getElementById('signUpPage');

const signInForm = document.getElementById('signInForm');
const signUpForm = document.getElementById('signUpForm');

const goSignUp = document.getElementById('goSignUp');
const backToSignIn = document.getElementById('backToSignIn'); 
let loggedInUsername = null;

//SESSION CHECK ON PAGE LOAD
window.addEventListener('load', async () => {
    const storedUsername = localStorage.getItem('username');
    if (storedUsername) {
        try {
            const response = await fetch('server/check_session.php');
            const result = await response.json();
            if (result.username && result.username === storedUsername) {
                loggedInUsername = storedUsername;
                autoLogin(loggedInUsername);
                return;
            }
        } catch {
            // ignore error
        }
        localStorage.removeItem('username');
    }
    document.getElementById('authModal').classList.remove('hidden');
});



// --- Helper Functions ---

function autoLogin(username) {
    const persistentHeader = document.getElementById('persistentHeader'); 
    const topWelcomeMessage = document.getElementById('topWelcomeMessage'); 

    if (authModal) authModal.classList.add('hidden');
    if (welcomePage) welcomePage.classList.remove('hidden');

    if (persistentHeader) persistentHeader.classList.remove('hidden'); 

    if (topWelcomeMessage) {
        topWelcomeMessage.textContent = `Hey, ${username}`; 
    }

    const welcomeStatusMessage = document.getElementById('welcomeStatusMessage'); 
    if (welcomeStatusMessage) {
        welcomeStatusMessage.textContent = ''; 
    }
    
    console.log('Authentication successful. Transitioning to welcome page.');
}


// --- Sign-In Logic Integrating MySQL backend ---

signInForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    clearAllFormErrors(signInForm);

    const usernameInput = document.getElementById('signInUsername');
    const dobInput = document.getElementById('signInDOB');
    const username = usernameInput.value.trim();
    const dob = dobInput.value;

    let isFormValid = true;
    if (username === '') { displayError(usernameInput, 'Username is required.'); isFormValid = false; }
    if (dob === '') { displayError(dobInput, 'Date of Birth is required.'); isFormValid = false; }

    if (!isFormValid) return;

    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('dob', dob);

    try {
        const response = await fetch('server/signin.php', {
            method: 'POST',
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            body: formData.toString()
        });
        const result = await response.json();

        if (result.error) {
            if (result.error.includes('Username')) {
                displayError(usernameInput, result.error);
                clearError(dobInput);
            } else if (result.error.includes('Date of Birth')) {
                displayError(dobInput, result.error);
                clearError(usernameInput);
            } else {
                displayError(usernameInput, result.error);
            }
        } else if (result.message === 'Login successful' && result.username) {
            localStorage.setItem('username', result.username);
            loggedInUsername = result.username;
            autoLogin(result.username);
        }

    } catch (err) {
        console.error('Sign-in request failed:', err);
        displayError(usernameInput, 'Server error. Please try again later.');
    }
});


// --- Sign-Up Transition Logic ---
goSignUp.addEventListener('click', () => {
    clearAllFormErrors(signInForm);
    signInPage.classList.add('hidden');
    signUpPage.classList.remove('hidden');
});


backToSignIn.addEventListener('click', () => {
    clearAllFormErrors(signUpForm);
    signUpPage.classList.add('hidden');
    signInPage.classList.remove('hidden');
});


// --- Username Availability Check on Blur (Sign-Up) ---

const signUpUsernameInput = document.getElementById('signUpUsername');

signUpUsernameInput.addEventListener('blur', () => {
    const username = signUpUsernameInput.value.trim();
    if (username.length === 0) return;

    clearError(signUpUsernameInput);

    fetch(`server/check_username.php?username=${encodeURIComponent(username)}`)
    .then(response => response.json())
    .then(data => {
        if (data.exists) {
            displayError(signUpUsernameInput, 'Username not available');
        }
    })
    .catch(error => {
        console.error('Username availability check failed:', error);
    });
});


// --- Sign-Up Submission Logic with urlencoded POST ---

signUpForm.addEventListener('submit', function(e) {
    e.preventDefault();
    clearAllFormErrors(signUpForm);

    const usernameInput = document.getElementById('signUpUsername');
    const dobInput = document.getElementById('signUpDOB');
    const securityQuestionSelect = document.getElementById('signup-security-question');
    const securityAnswerInput = document.getElementById('signup-security-answer');

    const username = usernameInput.value.trim();
    const dob = dobInput.value; 
    const question = securityQuestionSelect.value;
    const answer = securityAnswerInput.value.trim();

    let isFormValid = true;

    if (username === '') { displayError(usernameInput, 'Required field cannot be empty.'); isFormValid = false; }
    if (dob === '') { displayError(dobInput, 'Required field cannot be empty.'); isFormValid = false; }
    if (question === '') { displayError(securityQuestionSelect, 'Required field cannot be empty.'); isFormValid = false; }
    if (answer === '') { displayError(securityAnswerInput, 'Required field cannot be empty.'); isFormValid = false; }

    if (!isFormValid) { return; }

    if (!validateTextRule(usernameInput, username, 'Username')) {
        isFormValid = false;
    }
    if (!validateTextRule(securityAnswerInput, answer, 'Security Answer')) {
        isFormValid = false;
    }

    const age = calculateAge(dob);

    if (age < 18) {
        displayError(dobInput, 'Min age 18. You must be at least 18 years old to sign up.');
        isFormValid = false;
    } else if (age > 100) {
        displayError(dobInput, 'Max age 100. Date of Birth is too far in the past.');
        isFormValid = false;
    }

    if (!isFormValid) return;

    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('dob', dob);
    formData.append('security_question', question);
    formData.append('security_answer', answer);

    fetch('server/signup.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString()
    })
    .then(response => response.json())
    .then(result => {
        if (result.error) {
            displayError(usernameInput, result.error);
        } else if (result.message) {
            const authCard = authModal.querySelector('.modal-content');
            authCard.innerHTML = `
                <div style="text-align: center;">
                    <h2 class="auth-title" style="color: #4CAF50; margin-bottom: 0.5rem;">Account Created!</h2>
                    <p class="auth-subtitle" style="margin-top: 0.5rem;">Successful, please wait... (5 seconds)</p>
                </div>
            `;
            setTimeout(() => {
                autoLogin(username);
            }, 5000);
        }
    })
    .catch(err => {
        console.error('Sign-up request failed:', err);
        displayError(usernameInput, 'Server error. Please try again later.');
    });
});
