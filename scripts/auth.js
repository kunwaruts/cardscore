import { displayError, clearError, clearAllFormErrors, validateTextRule, calculateAge } from './validation.js';

// --- Hardcoded Testing Credentials ---
const SUCCESSFUL_USERNAME = 'test';
const SUCCESSFUL_DOB = '1995-07-11'; 

// --- DOM Element Definitions ---
const authModal = document.getElementById('authModal');
const welcomePage = document.getElementById('welcome-page');

const signInPage = document.getElementById('signInPage');
const signUpPage = document.getElementById('signUpPage');

const signInForm = document.getElementById('signInForm');
const signUpForm = document.getElementById('signUpForm');

const goSignUp = document.getElementById('goSignUp');
const backToSignIn = document.getElementById('backToSignIn'); 
// ------------------------------------------

// --- Helper Functions ---

function autoLogin(username) {
    const persistentHeader = document.getElementById('persistentHeader'); 
    const topWelcomeMessage = document.getElementById('topWelcomeMessage'); 

    // 1. Hide modal and show the welcome page
    if (authModal) authModal.classList.add('hidden');
    if (welcomePage) welcomePage.classList.remove('hidden');

    // 2. SHOW the persistent header
    if (persistentHeader) persistentHeader.classList.remove('hidden'); 
    
    // CRITICAL: Dynamically set the 'Hey <Username>' message.
    if (topWelcomeMessage) {
        topWelcomeMessage.textContent = `Hey, ${username}`; 
    }

    // 3. Clear/Hide the old greeting element (now used for setup errors in game.js)
    const welcomeStatusMessage = document.getElementById('welcomeStatusMessage'); 
    if (welcomeStatusMessage) {
        welcomeStatusMessage.textContent = ''; 
    }
    
    console.log('Authentication successful. Transitioning to welcome page.');
}

// --- Sign-In Logic ---

signInForm.addEventListener('submit', function(e) {
    e.preventDefault();
    clearAllFormErrors(signInForm); // Clear previous errors

    const usernameInput = document.getElementById('signInUsername');
    const dobInput = document.getElementById('signInDOB');
    
    const username = usernameInput.value.trim();
    const dob = dobInput.value; 

    let isFormValid = true;

    // --- 1. Basic Empty Field Check ---
    if (username === '') { 
        displayError(usernameInput, 'Username is required.'); 
        isFormValid = false;
    }
    if (dob === '') { 
        displayError(dobInput, 'Date of Birth is required.'); 
        isFormValid = false;
    }
    
    if (!isFormValid) { return; }

    // --- 2. Successful Login Check ---
    if (username === SUCCESSFUL_USERNAME && dob === SUCCESSFUL_DOB) {
        autoLogin(username);
        return; // Exit after successful login
    } 
    
    // ==========================================================
    // 3. Failed Login Feedback (WCAG Compliant Error Suggestion) 
    // ==========================================================

    let loginFailed = false;

    // Check if the username is wrong
    if (username !== SUCCESSFUL_USERNAME) {
        displayError(usernameInput, 'Username is incorrect.');
        loginFailed = true;
    } else {
        clearError(usernameInput); // Ensure correct username doesn't show an error
    }
    
    // Check if the Date of Birth is wrong
    if (dob !== SUCCESSFUL_DOB) {
        // Display DOB error, regardless of the username state
        displayError(dobInput, 'Date of Birth is incorrect.');
        loginFailed = true;
    } else {
        clearError(dobInput); // Ensure correct DOB doesn't show an error
    }
    
    if (loginFailed) {
        console.log('Login failed due to incorrect credentials.');
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

// --- Sign-Up Submission Logic ---

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

    // --- 0. Initial Required Check ---
    if (username === '') { displayError(usernameInput, 'Required field cannot be empty.'); isFormValid = false; }
    if (dob === '') { displayError(dobInput, 'Required field cannot be empty.'); isFormValid = false; }
    if (question === '') { displayError(securityQuestionSelect, 'Required field cannot be empty.'); isFormValid = false; }
    if (answer === '') { displayError(securityAnswerInput, 'Required field cannot be empty.'); isFormValid = false; }

    if (!isFormValid) { return; } 

    // --- 1. Advanced Username/Answer Validation ---
    if (!validateTextRule(usernameInput, username, 'Username')) {
        isFormValid = false;
    }
    if (!validateTextRule(securityAnswerInput, answer, 'Security Answer')) {
        isFormValid = false;
    }
    
    // --- 2. Date of Birth Age Check (Min 18, Max 100) ---
    const age = calculateAge(dob);
    
    if (age < 18) {
        displayError(dobInput, 'Min age 18. You must be at least 18 years old to sign up.');
        isFormValid = false;
    } else if (age > 100) {
        displayError(dobInput, 'Max age 100. Date of Birth is too far in the past.');
        isFormValid = false;
    } else {
        clearError(dobInput);
    }

    // --- Submission and Auto-Login Logic ---
    if (isFormValid) {
        const authCard = authModal.querySelector('.modal-content');
        
        // Success Message
        authCard.innerHTML = `
            <div style="text-align: center;">
                <h2 class="auth-title" style="color: #4CAF50; margin-bottom: 0.5rem;">Account Created!</h2>
                <p class="auth-subtitle" style="margin-top: 0.5rem;">Successful, please wait... (5 seconds)</p>
            </div>
        `;
        
        setTimeout(() => {
            autoLogin(username); 
        }, 5000); 

    } else {
        console.log('Sign-Up validation failed.');
    }
});